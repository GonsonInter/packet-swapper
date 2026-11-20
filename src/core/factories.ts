import type { HeaderRule, MockRule, Profile } from './types'

function uid(): string {
  return crypto.randomUUID()
}

export function newProfile(name = '新方案'): Profile {
  return { id: uid(), name, enabled: true, headerRules: [], mockRules: [] }
}

export function newHeaderRule(): HeaderRule {
  return {
    id: uid(),
    enabled: true,
    target: 'request',
    action: 'set',
    name: '',
    value: '',
    urlFilter: '',
  }
}

export function newMockRule(): MockRule {
  return {
    id: uid(),
    enabled: true,
    urlPattern: '',
    method: 'ANY',
    // 默认网络层：基于 DNR 重定向，无需 content script 注入、覆盖更彻底
    mode: 'network',
    statusCode: 200,
    headers: [],
    body: '',
    delayMs: 0,
  }
}

/** network 模式 body 过大（接近 data URL 长度上限）时给 UI 标黄。 */
export const NETWORK_BODY_WARN_BYTES = 1_000_000

export function isNetworkBodyTooLarge(rule: MockRule): boolean {
  return rule.mode === 'network' && new TextEncoder().encode(rule.body).length > NETWORK_BODY_WARN_BYTES
}
