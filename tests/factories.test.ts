import { describe, it, expect } from 'vitest'
import { newMockRule, newProfile, newHeaderRule, NETWORK_BODY_WARN_BYTES } from '../src/core/factories'

describe('newMockRule', () => {
  it('默认网络层模式（DNR 重定向），满足新建即最常用路径', () => {
    const r = newMockRule()
    expect(r.mode).toBe('network')
    expect(r.enabled).toBe(true)
    expect(r.method).toBe('ANY')
    expect(r.statusCode).toBe(200)
    expect(r.delayMs).toBe(0)
    expect(r.body).toBe('')
  })

  it('每次生成唯一 id', () => {
    expect(newMockRule().id).not.toBe(newMockRule().id)
  })
})

describe('newProfile / newHeaderRule', () => {
  it('新方案默认启用且规则为空', () => {
    const p = newProfile()
    expect(p.enabled).toBe(true)
    expect(p.headerRules).toEqual([])
    expect(p.mockRules).toEqual([])
  })

  it('header 规则默认 request + set', () => {
    const h = newHeaderRule()
    expect(h.target).toBe('request')
    expect(h.action).toBe('set')
  })
})

describe('常量', () => {
  it('网络层 body 告警阈值为 1MB', () => {
    expect(NETWORK_BODY_WARN_BYTES).toBe(1_000_000)
  })
})
