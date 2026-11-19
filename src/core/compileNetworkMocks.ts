import {
  NETWORK_MOCK_ID_BASE,
  type DnrRule,
  type DnrRuleCondition,
  type MockRule,
  type Profile,
} from './types'
import { normalizeUrlPattern } from './normalize-url-pattern'

/** UTF-8 安全的 base64 编码（btoa 只吃 latin1）。service worker 与 node 均可用。 */
function toBase64(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

function contentTypeOf(rule: MockRule): string {
  const h = rule.headers.find((x) => x.name.toLowerCase() === 'content-type')
  return h?.value ?? 'text/plain'
}

/**
 * 把 network 模式的 mockRule 编译成 DNR redirect 规则（重定向到 base64 data URL）。
 * page 模式忽略（由 content script 处理）。
 * 注意：data URL 响应恒为 200，statusCode 在网络层 mock 无法控制（补充手段）。
 */
export function compileNetworkMocks(profiles: Profile[]): DnrRule[] {
  // 先收集所有 network 模式启用规则，得到总数用于计算「上面优先」的 priority
  const collected: MockRule[] = []
  for (const profile of profiles) {
    if (!profile.enabled) continue
    for (const rule of profile.mockRules) {
      if (rule.enabled && rule.mode === 'network') collected.push(rule)
    }
  }

  const total = collected.length
  return collected.map((rule, seq) => {
    const dataUrl = `data:${contentTypeOf(rule)};base64,${toBase64(rule.body)}`

    // 归一化后再交给 DNR：清洗误加的 = / ~ 前缀与首尾空格，避免字面量不匹配导致规则静默失效
    const urlFilter = normalizeUrlPattern(rule.urlPattern)
    const condition: DnrRuleCondition = {
      urlFilter: urlFilter.length > 0 ? urlFilter : '*',
    }
    if (rule.method !== 'ANY') {
      condition.requestMethods = [rule.method.toLowerCase()]
    }

    return {
      id: NETWORK_MOCK_ID_BASE + seq,
      // priority 与列表顺序相反且恒为正整数（DNR 要求 >0）：靠上的规则 priority 更高 → 上面优先
      priority: total - seq,
      action: { type: 'redirect', redirect: { url: dataUrl } },
      condition,
    }
  })
}
