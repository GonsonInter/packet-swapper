import {
  NETWORK_MOCK_ID_BASE,
  type DnrRule,
  type DnrRuleCondition,
  type MockRule,
  type Profile,
} from './types'

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
  const rules: DnrRule[] = []
  let nextId = NETWORK_MOCK_ID_BASE

  for (const profile of profiles) {
    if (!profile.enabled) continue

    for (const rule of profile.mockRules) {
      if (!rule.enabled || rule.mode !== 'network') continue

      const dataUrl = `data:${contentTypeOf(rule)};base64,${toBase64(rule.body)}`

      const condition: DnrRuleCondition = {
        urlFilter: rule.urlPattern.length > 0 ? rule.urlPattern : '*',
      }
      if (rule.method !== 'ANY') {
        condition.requestMethods = [rule.method.toLowerCase()]
      }

      rules.push({
        id: nextId++,
        priority: 1,
        action: { type: 'redirect', redirect: { url: dataUrl } },
        condition,
      })
    }
  }

  return rules
}
