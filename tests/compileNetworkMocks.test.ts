import { describe, it, expect } from 'vitest'
import { compileNetworkMocks } from '../src/core/compileNetworkMocks'
import { NETWORK_MOCK_ID_BASE } from '../src/core/types'
import { makeMockRule, makeProfile } from './helpers'

function decodeDataUrl(url: string): { contentType: string; body: string } {
  const m = /^data:([^;]*);base64,(.*)$/.exec(url)
  if (!m) throw new Error(`不是 base64 data URL: ${url}`)
  const bin = atob(m[2])
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return { contentType: m[1], body: new TextDecoder().decode(bytes) }
}

describe('compileNetworkMocks', () => {
  it('只编译 network 模式的 mock，page 模式忽略', () => {
    const rules = compileNetworkMocks([
      makeProfile({
        mockRules: [
          makeMockRule({ id: 'net', mode: 'network' }),
          makeMockRule({ id: 'page', mode: 'page' }),
        ],
      }),
    ])
    expect(rules).toHaveLength(1)
    expect(rules[0].action.type).toBe('redirect')
  })

  it('redirect 到 base64 data URL，含 body 与 content-type', () => {
    const rules = compileNetworkMocks([
      makeProfile({
        mockRules: [
          makeMockRule({
            mode: 'network',
            body: '{"ok":true}',
            headers: [{ name: 'Content-Type', value: 'application/json' }],
          }),
        ],
      }),
    ])
    const url = rules[0].action.redirect!.url!
    const { contentType, body } = decodeDataUrl(url)
    expect(contentType).toBe('application/json')
    expect(body).toBe('{"ok":true}')
  })

  it('未指定 content-type 时用默认 text/plain', () => {
    const rules = compileNetworkMocks([
      makeProfile({ mockRules: [makeMockRule({ mode: 'network', body: 'hi', headers: [] })] }),
    ])
    const { contentType, body } = decodeDataUrl(rules[0].action.redirect!.url!)
    expect(contentType).toBe('text/plain')
    expect(body).toBe('hi')
  })

  it('UTF-8 body 正确编码', () => {
    const rules = compileNetworkMocks([
      makeProfile({ mockRules: [makeMockRule({ mode: 'network', body: '你好😀', headers: [] })] }),
    ])
    expect(decodeDataUrl(rules[0].action.redirect!.url!).body).toBe('你好😀')
  })

  it('method=ANY 不加 requestMethods，具体 method 转小写', () => {
    const rules = compileNetworkMocks([
      makeProfile({
        mockRules: [
          makeMockRule({ id: 'any', mode: 'network', method: 'ANY' }),
          makeMockRule({ id: 'post', mode: 'network', method: 'POST' }),
        ],
      }),
    ])
    expect(rules[0].condition.requestMethods).toBeUndefined()
    expect(rules[1].condition.requestMethods).toEqual(['post'])
  })

  it('urlPattern 空 → "*"，非空透传到 urlFilter', () => {
    const rules = compileNetworkMocks([
      makeProfile({
        mockRules: [
          makeMockRule({ id: 'a', mode: 'network', urlPattern: '' }),
          makeMockRule({ id: 'b', mode: 'network', urlPattern: '/api/y' }),
        ],
      }),
    ])
    expect(rules[0].condition.urlFilter).toBe('*')
    expect(rules[1].condition.urlFilter).toBe('/api/y')
  })

  it('归一化：误加的 = 前缀与首尾空格不会进 urlFilter（修复规则静默失效）', () => {
    const rules = compileNetworkMocks([
      makeProfile({
        mockRules: [
          makeMockRule({ id: 'a', mode: 'network', urlPattern: ' = https://x.com/api/page_info ' }),
          makeMockRule({ id: 'b', mode: 'network', urlPattern: '~ /api/v1' }),
        ],
      }),
    ])
    expect(rules[0].condition.urlFilter).toBe('https://x.com/api/page_info')
    expect(rules[1].condition.urlFilter).toBe('/api/v1')
  })

  it('后定义赢：priority 按定义顺序递增（后定义的更高）', () => {
    const rules = compileNetworkMocks([
      makeProfile({
        mockRules: [
          makeMockRule({ id: 'a', mode: 'network' }),
          makeMockRule({ id: 'b', mode: 'network' }),
        ],
      }),
    ])
    expect(rules[0].priority).toBeLessThan(rules[1].priority)
  })

  it('id 从 NETWORK_MOCK_ID_BASE 起递增，跳过禁用项与禁用 profile', () => {
    const rules = compileNetworkMocks([
      makeProfile({
        mockRules: [
          makeMockRule({ id: 'a', mode: 'network' }),
          makeMockRule({ id: 'off', mode: 'network', enabled: false }),
          makeMockRule({ id: 'b', mode: 'network' }),
        ],
      }),
      makeProfile({ id: 'p2', enabled: false, mockRules: [makeMockRule({ id: 'x', mode: 'network' })] }),
    ])
    expect(rules.map((r) => r.id)).toEqual([NETWORK_MOCK_ID_BASE, NETWORK_MOCK_ID_BASE + 1])
  })
})
