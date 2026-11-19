import {
  HEADER_RULE_ID_BASE,
  type DnrModifyHeaderInfo,
  type DnrRule,
  type DnrRuleAction,
  type HeaderRule,
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
  // 先收集所有生效规则（跳过禁用与空 name），得到总数用于计算「上面优先」的 priority
  const collected: { rule: HeaderRule; name: string }[] = []

  for (const profile of profiles) {
    if (!profile.enabled) continue

    for (const rule of profile.headerRules) {
      if (!rule.enabled) continue

      const name = rule.name.trim()
      if (!name) {
        console.warn(`[packet-swapper] 跳过空 header name 的规则: ${rule.id}`)
        continue
      }
      collected.push({ rule, name })
    }
  }

  const total = collected.length
  return collected.map(({ rule, name }, seq) => {
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

    return {
      id: HEADER_RULE_ID_BASE + seq,
      // priority 与列表顺序相反且恒为正整数（DNR 要求 >0）：靠上的规则 priority 更高 → 上面优先
      priority: total - seq,
      action,
      condition: {
        urlFilter: rule.urlFilter && rule.urlFilter.length > 0 ? rule.urlFilter : '*',
        resourceTypes: ALL_RESOURCE_TYPES,
      },
    }
  })
}
