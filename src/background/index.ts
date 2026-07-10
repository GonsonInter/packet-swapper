import { compileHeaderRules } from '../core/compileHeaderRules'
import { compileNetworkMocks } from '../core/compileNetworkMocks'
import { getState, onStateChange, setWarning } from '../core/storage'
import type { DnrRule, RootState } from '../core/types'

// Chrome 动态规则上限（新版约 30000）。不同 @types/chrome 常量名不一，防御式读取，取不到用 5000。
const dnr = chrome.declarativeNetRequest as unknown as Record<string, number | undefined>
const MAX_DYNAMIC_RULES =
  dnr.MAX_NUMBER_OF_DYNAMIC_RULES ?? dnr.MAX_NUMBER_OF_DYNAMIC_AND_SESSION_RULES ?? 5000

let applying = false
let pending = false

/** 读当前状态，重编译并全量替换动态规则。 */
async function applyState(state: RootState): Promise<void> {
  // 串行化：应用期间来的变更合并成一次待处理，结束后补跑。
  if (applying) {
    pending = true
    return
  }
  applying = true

  try {
    const existing = await chrome.declarativeNetRequest.getDynamicRules()
    const removeRuleIds = existing.map((r) => r.id)

    if (!state.globalEnabled) {
      if (removeRuleIds.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules: [] })
      }
      await setWarning(null)
      return
    }

    let rules: DnrRule[] = [
      ...compileHeaderRules(state.profiles),
      ...compileNetworkMocks(state.profiles),
    ]

    let warning: string | null = null
    if (rules.length > MAX_DYNAMIC_RULES) {
      warning = `规则数 ${rules.length} 超过动态规则上限 ${MAX_DYNAMIC_RULES}，已截断，仅前 ${MAX_DYNAMIC_RULES} 条生效。`
      console.warn(`[packet-swapper] ${warning}`)
      rules = rules.slice(0, MAX_DYNAMIC_RULES)
    }

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds,
      // 自定义 DnrRule 结构与 chrome.declarativeNetRequest.Rule 一致，运行时直接传。
      addRules: rules as unknown as chrome.declarativeNetRequest.Rule[],
    })
    await setWarning(warning)
  } catch (e) {
    console.error('[packet-swapper] 应用动态规则失败', e)
    await setWarning(`应用规则失败：${e instanceof Error ? e.message : String(e)}`)
  } finally {
    applying = false
    if (pending) {
      pending = false
      const next = await getState()
      void applyState(next)
    }
  }
}

async function reapply(): Promise<void> {
  const state = await getState()
  await applyState(state)
}

// storage 变化 → 重建
onStateChange((state) => {
  void applyState(state)
})

// service worker 启动 / 安装时全量重建一次
chrome.runtime.onInstalled.addListener(() => void reapply())
chrome.runtime.onStartup.addListener(() => void reapply())

// 冷启动（SW 被唤醒）立即跑一次，保证规则与 storage 一致
void reapply()

console.log('[packet-swapper] background service worker loaded')
