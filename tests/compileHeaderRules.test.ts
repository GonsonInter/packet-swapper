import { describe, it, expect, vi } from 'vitest'
import { compileHeaderRules } from '../src/core/compileHeaderRules'
import { HEADER_RULE_ID_BASE } from '../src/core/types'
import { makeHeaderRule, makeProfile } from './helpers'

describe('compileHeaderRules', () => {
  it('把启用 profile 的启用 headerRule 编译成 modifyHeaders 规则', () => {
    const rules = compileHeaderRules([
      makeProfile({ headerRules: [makeHeaderRule()] }),
    ])
    expect(rules).toHaveLength(1)
    expect(rules[0].action.type).toBe('modifyHeaders')
    expect(rules[0].id).toBe(HEADER_RULE_ID_BASE)
    expect(rules[0].priority).toBeGreaterThan(0)
  })

  it('set/append/remove 映射到 DNR operation', () => {
    const rules = compileHeaderRules([
      makeProfile({
        headerRules: [
          makeHeaderRule({ id: 'a', action: 'set', name: 'A', value: '1' }),
          makeHeaderRule({ id: 'b', action: 'append', name: 'B', value: '2' }),
          makeHeaderRule({ id: 'c', action: 'remove', name: 'C', value: '' }),
        ],
      }),
    ])
    const ops = rules.map((r) => r.action.requestHeaders![0])
    expect(ops[0]).toEqual({ header: 'A', operation: 'set', value: '1' })
    expect(ops[1]).toEqual({ header: 'B', operation: 'append', value: '2' })
    // remove 不带 value
    expect(ops[2]).toEqual({ header: 'C', operation: 'remove' })
  })

  it('target=request 放 requestHeaders，target=response 放 responseHeaders', () => {
    const rules = compileHeaderRules([
      makeProfile({
        headerRules: [
          makeHeaderRule({ id: 'req', target: 'request', name: 'R1' }),
          makeHeaderRule({ id: 'res', target: 'response', name: 'R2' }),
        ],
      }),
    ])
    expect(rules[0].action.requestHeaders).toBeDefined()
    expect(rules[0].action.responseHeaders).toBeUndefined()
    expect(rules[1].action.responseHeaders).toBeDefined()
    expect(rules[1].action.requestHeaders).toBeUndefined()
  })

  it('urlFilter 空 → "*"，非空透传', () => {
    const rules = compileHeaderRules([
      makeProfile({
        headerRules: [
          makeHeaderRule({ id: 'x', urlFilter: undefined }),
          makeHeaderRule({ id: 'y', urlFilter: '' }),
          makeHeaderRule({ id: 'z', urlFilter: '||example.com' }),
        ],
      }),
    ])
    expect(rules[0].condition.urlFilter).toBe('*')
    expect(rules[1].condition.urlFilter).toBe('*')
    expect(rules[2].condition.urlFilter).toBe('||example.com')
  })

  it('分配稳定递增的 id', () => {
    const rules = compileHeaderRules([
      makeProfile({
        headerRules: [
          makeHeaderRule({ id: 'a' }),
          makeHeaderRule({ id: 'b' }),
          makeHeaderRule({ id: 'c' }),
        ],
      }),
    ])
    expect(rules.map((r) => r.id)).toEqual([
      HEADER_RULE_ID_BASE,
      HEADER_RULE_ID_BASE + 1,
      HEADER_RULE_ID_BASE + 2,
    ])
  })

  it('上面优先：priority 与列表顺序相反（靠上的更高）', () => {
    const rules = compileHeaderRules([
      makeProfile({
        headerRules: [
          makeHeaderRule({ id: 'a', name: 'A' }),
          makeHeaderRule({ id: 'b', name: 'B' }),
          makeHeaderRule({ id: 'c', name: 'C' }),
        ],
      }),
    ])
    const ps = rules.map((r) => r.priority)
    expect(ps[0]).toBeGreaterThan(ps[1])
    expect(ps[1]).toBeGreaterThan(ps[2])
    // 三条规则：首条 priority = total = 3（恒为正、靠上最高）
    expect(ps[0]).toBe(3)
    expect(ps[2]).toBe(1)
  })

  it('跳过禁用的规则与禁用的 profile', () => {
    const rules = compileHeaderRules([
      makeProfile({
        headerRules: [
          makeHeaderRule({ id: 'on', enabled: true, name: 'On' }),
          makeHeaderRule({ id: 'off', enabled: false, name: 'Off' }),
        ],
      }),
      makeProfile({
        id: 'p2',
        enabled: false,
        headerRules: [makeHeaderRule({ id: 'x', name: 'Disabled' })],
      }),
    ])
    expect(rules).toHaveLength(1)
    expect(rules[0].action.requestHeaders![0].header).toBe('On')
  })

  it('空 header name 跳过并 warn', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const rules = compileHeaderRules([
      makeProfile({ headerRules: [makeHeaderRule({ name: '  ' })] }),
    ])
    expect(rules).toHaveLength(0)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('多个 profile 的规则叠加', () => {
    const rules = compileHeaderRules([
      makeProfile({ id: 'p1', headerRules: [makeHeaderRule({ id: 'a', name: 'A' })] }),
      makeProfile({ id: 'p2', headerRules: [makeHeaderRule({ id: 'b', name: 'B' })] }),
    ])
    expect(rules).toHaveLength(2)
    // id 跨 profile 连续递增
    expect(rules.map((r) => r.id)).toEqual([HEADER_RULE_ID_BASE, HEADER_RULE_ID_BASE + 1])
  })
})
