import {
  HEADER_RULE_ID_BASE,
  type DnrModifyHeaderInfo,
  type DnrRule,
  type DnrRuleAction,
  type Profile,
} from './types'

/** header 规则默认作用于所有资源类型（含 main_frame），否则 DNR 默认不含 main_frame。 */
const ALL_RESOURCE_TYPES = [
  'main_frame',
  'sub_frame',
  'stylesheet',
  'script',
  'image',
  'font',
  'object',
  'xmlhttprequest',
  'ping',
  'csp_report',
  'media',
  'websocket',
  'other',
]

/**
 * 把所有启用 profile 的启用 headerRule 编译成 DNR modifyHeaders 规则。
 * - set/append/remove → DNR operation（remove 不带 value）
 * - target=request → requestHeaders，response → responseHeaders
 * - urlFilter 空 → "*"
 * - id 从 HEADER_RULE_ID_BASE 起连续递增（跨 profile 连续）
 * - 空 header name 跳过 + warn
 */
export function compileHeaderRules(profiles: Profile[]): DnrRule[] {
  const rules: DnrRule[] = []
  let nextId = HEADER_RULE_ID_BASE

  for (const profile of profiles) {
    if (!profile.enabled) continue

    for (const rule of profile.headerRules) {
      if (!rule.enabled) continue

      const name = rule.name.trim()
      if (!name) {
        console.warn(`[packet-swapper] 跳过空 header name 的规则: ${rule.id}`)
        continue
      }

      const headerInfo: DnrModifyHeaderInfo =
        rule.action === 'remove'
          ? { header: name, operation: 'remove' }
          : { header: name, operation: rule.action, value: rule.value }

      const action: DnrRuleAction = { type: 'modifyHeaders' }
      if (rule.target === 'request') {
        action.requestHeaders = [headerInfo]
      } else {
        action.responseHeaders = [headerInfo]
      }

      rules.push({
        id: nextId++,
        priority: 1,
        action,
        condition: {
          urlFilter: rule.urlFilter && rule.urlFilter.length > 0 ? rule.urlFilter : '*',
          resourceTypes: ALL_RESOURCE_TYPES,
        },
      })
    }
  }

  return rules
}
