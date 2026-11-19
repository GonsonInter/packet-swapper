import { describe, it, expect } from 'vitest'
import { matchMockRule } from '../src/core/matchMockRule'
import { makeMockRule } from './helpers'

describe('matchMockRule', () => {
  it('子串匹配 URL + method=ANY', () => {
    const rules = [makeMockRule({ urlPattern: '/api/user', method: 'ANY' })]
    const hit = matchMockRule(rules, 'https://x.com/api/user?id=1', 'GET')
    expect(hit?.id).toBe('m1')
  })

  it('不匹配返回 null', () => {
    const rules = [makeMockRule({ urlPattern: '/api/user' })]
    expect(matchMockRule(rules, 'https://x.com/api/other', 'GET')).toBeNull()
  })

  it('method 不符不匹配', () => {
    const rules = [makeMockRule({ urlPattern: '/api/user', method: 'POST' })]
    expect(matchMockRule(rules, 'https://x.com/api/user', 'GET')).toBeNull()
    expect(matchMockRule(rules, 'https://x.com/api/user', 'POST')?.id).toBe('m1')
  })

  it('method 大小写不敏感', () => {
    const rules = [makeMockRule({ urlPattern: '/api/user', method: 'POST' })]
    expect(matchMockRule(rules, 'https://x.com/api/user', 'post')?.id).toBe('m1')
  })

  it('通配符 * 匹配', () => {
    const rules = [makeMockRule({ urlPattern: '/api/*/detail' })]
    expect(matchMockRule(rules, 'https://x.com/api/123/detail', 'GET')?.id).toBe('m1')
    // * 两侧各有一个斜杠，故只有单斜杠的 /api/detail 不该命中
    expect(matchMockRule(rules, 'https://x.com/api/detail', 'GET')).toBeNull()
    expect(matchMockRule(rules, 'https://x.com/api/123/other', 'GET')).toBeNull()
  })

  it('空 urlPattern 匹配任意 URL', () => {
    const rules = [makeMockRule({ urlPattern: '' })]
    expect(matchMockRule(rules, 'https://x.com/anything', 'GET')?.id).toBe('m1')
  })

  it('跳过禁用规则与非 page 模式规则', () => {
    const rules = [
      makeMockRule({ id: 'off', urlPattern: '/api/user', enabled: false }),
      makeMockRule({ id: 'net', urlPattern: '/api/user', mode: 'network' }),
    ]
    expect(matchMockRule(rules, 'https://x.com/api/user', 'GET')).toBeNull()
  })

  it('多条命中时上面优先（返回第一条）', () => {
    const rules = [
      makeMockRule({ id: 'first', urlPattern: '/api' }),
      makeMockRule({ id: 'second', urlPattern: '/api/user' }),
    ]
    // 两条都命中 /api/user，列表靠上的 first 优先
    expect(matchMockRule(rules, 'https://x.com/api/user', 'GET')?.id).toBe('first')
  })

  it('调序后优先级随之改变：把 second 排到上面则 second 赢', () => {
    const rules = [
      makeMockRule({ id: 'second', urlPattern: '/api/user' }),
      makeMockRule({ id: 'first', urlPattern: '/api' }),
    ]
    expect(matchMockRule(rules, 'https://x.com/api/user', 'GET')?.id).toBe('second')
  })

  it('归一化：带 = 前缀和空格的 pattern 仍能按子串命中（与网络层语义一致）', () => {
    const rules = [makeMockRule({ urlPattern: ' = /api/user ' })]
    expect(matchMockRule(rules, 'https://x.com/api/user?id=1', 'GET')?.id).toBe('m1')
  })

  it('归一化：~ 正则前缀清洗后按子串匹配', () => {
    const rules = [makeMockRule({ urlPattern: '~ /api/user' })]
    expect(matchMockRule(rules, 'https://x.com/api/user', 'GET')?.id).toBe('m1')
  })
})
