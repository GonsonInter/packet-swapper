import type { HttpMethod, MockRule } from './types'
import { normalizeUrlPattern } from './normalize-url-pattern'

/** urlPattern 匹配：无 * 时子串匹配；含 * 时按顺序匹配各段（* = 任意）。空 pattern 匹配任意。 */
function urlMatches(rawPattern: string, url: string): boolean {
  // 与网络层共用归一化：清洗误加的 = / ~ 前缀与首尾空格，两种模式匹配语义保持一致
  const pattern = normalizeUrlPattern(rawPattern)
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
 * 多规则按「上面优先」——列表越靠前优先级越高，返回第一条命中的规则。未命中返回 null。
 * 拖拽排序调整数组顺序即可改变优先级，与网络层 DNR priority 语义一致。
 */
export function matchMockRule(
  rules: MockRule[],
  url: string,
  method: string,
): MockRule | null {
  const upper = method.toUpperCase() as HttpMethod

  for (const rule of rules) {
    if (!rule.enabled || rule.mode !== 'page') continue
    if (rule.method !== 'ANY' && rule.method !== upper) continue
    if (!urlMatches(rule.urlPattern, url)) continue
    return rule // 第一条命中即返回：上面的规则优先
  }
  return null
}
