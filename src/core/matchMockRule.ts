import type { HttpMethod, MockRule } from './types'

/** urlPattern 匹配：无 * 时子串匹配；含 * 时按顺序匹配各段（* = 任意）。空 pattern 匹配任意。 */
function urlMatches(pattern: string, url: string): boolean {
  if (!pattern) return true
  if (!pattern.includes('*')) return url.includes(pattern)

  const parts = pattern.split('*')
  let idx = 0
  for (const part of parts) {
    if (part === '') continue
    const found = url.indexOf(part, idx)
    if (found === -1) return false
    idx = found + part.length
  }
  return true
}

/**
 * page 模式 mock 匹配：在规则列表里找命中 url + method 的启用 page 规则。
 * 多条命中时「后定义赢」——返回最后一条匹配的规则。未命中返回 null。
 */
export function matchMockRule(
  rules: MockRule[],
  url: string,
  method: string,
): MockRule | null {
  const upper = method.toUpperCase() as HttpMethod

  let hit: MockRule | null = null
  for (const rule of rules) {
    if (!rule.enabled || rule.mode !== 'page') continue
    if (rule.method !== 'ANY' && rule.method !== upper) continue
    if (!urlMatches(rule.urlPattern, url)) continue
    hit = rule // 保留最后一条命中的
  }
  return hit
}
