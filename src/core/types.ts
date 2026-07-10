// 数据模型：存于 chrome.storage.local，顶层为 RootState。

export type HeaderTarget = 'request' | 'response'
export type HeaderAction = 'set' | 'append' | 'remove'

export interface HeaderRule {
  id: string
  enabled: boolean
  target: HeaderTarget
  action: HeaderAction
  name: string
  value: string
  /** 空 = 全局；否则按 DNR urlFilter 语法，如 ||example.com */
  urlFilter?: string
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'ANY'
export type MockMode = 'page' | 'network'

export interface MockHeader {
  name: string
  value: string
}

export interface MockRule {
  id: string
  enabled: boolean
  /** 匹配哪个接口：page 模式用子串/通配（* 通配），network 模式转 DNR */
  urlPattern: string
  method: HttpMethod
  mode: MockMode
  statusCode: number
  headers: MockHeader[]
  /** 响应体文本；JSON 直接贴 */
  body: string
  /** 仅 page 模式生效 */
  delayMs: number
}

export interface Profile {
  id: string
  name: string
  enabled: boolean
  headerRules: HeaderRule[]
  mockRules: MockRule[]
}

export interface RootState {
  globalEnabled: boolean
  profiles: Profile[]
}

/** DNR 规则 id 分段，避免 header 规则与 network mock 规则 id 冲突。 */
export const HEADER_RULE_ID_BASE = 1
export const NETWORK_MOCK_ID_BASE = 100_000

// ── 编译器输出：自定义的最小 DNR 规则类型 ──
// 不直接用 @types/chrome 的 enum 类型：它们是运行时对象，node 单测里拿不到 chrome，
// 且字符串字面量无法赋值给 enum。我们只产出普通对象，background 调 API 时再 cast。

export interface DnrModifyHeaderInfo {
  header: string
  operation: 'set' | 'append' | 'remove'
  value?: string
}

export interface DnrRuleAction {
  type: 'modifyHeaders' | 'redirect' | 'block' | 'allow'
  requestHeaders?: DnrModifyHeaderInfo[]
  responseHeaders?: DnrModifyHeaderInfo[]
  redirect?: { url?: string }
}

export interface DnrRuleCondition {
  urlFilter?: string
  resourceTypes?: string[]
  requestMethods?: string[]
}

export interface DnrRule {
  id: number
  priority: number
  action: DnrRuleAction
  condition: DnrRuleCondition
}
