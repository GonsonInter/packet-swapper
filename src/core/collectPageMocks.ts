import type { MockRule, RootState } from './types'

/**
 * 从 RootState 收集所有「应下发给页面」的 page 模式 mock 规则：
 * - globalEnabled=false → 空
 * - 只取启用 profile 里启用的 page 模式规则
 * 顺序：按 profile 顺序、profile 内规则顺序（matchMockRule 取第一条命中）。
 */
export function collectPageMockRules(state: RootState): MockRule[] {
  if (!state.globalEnabled) return []

  const out: MockRule[] = []
  for (const profile of state.profiles) {
    if (!profile.enabled) continue
    for (const rule of profile.mockRules) {
      if (rule.enabled && rule.mode === 'page') out.push(rule)
    }
  }
  return out
}
