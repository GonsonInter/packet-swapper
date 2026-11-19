import { describe, it, expect } from 'vitest'
import { normalizeUrlPattern } from '../src/core/normalize-url-pattern'

describe('normalizeUrlPattern', () => {
  it('空白输入返回空串', () => {
    expect(normalizeUrlPattern('')).toBe('')
    expect(normalizeUrlPattern('   ')).toBe('')
    expect(normalizeUrlPattern(undefined as unknown as string)).toBe('')
  })

  it('普通 pattern 去首尾空格后原样保留', () => {
    expect(normalizeUrlPattern('  /api/user  ')).toBe('/api/user')
    expect(normalizeUrlPattern('https://x.com/a/b')).toBe('https://x.com/a/b')
  })

  it('清洗误加的 = 精确匹配前缀（含前缀后的空格）', () => {
    expect(normalizeUrlPattern('= https://x.com/api')).toBe('https://x.com/api')
    expect(normalizeUrlPattern('=https://x.com/api')).toBe('https://x.com/api')
    expect(normalizeUrlPattern('== /api/x')).toBe('/api/x')
  })

  it('清洗误加的 ~ 正则前缀', () => {
    expect(normalizeUrlPattern('~ /api/\\d+')).toBe('/api/\\d+')
  })

  it('清洗 re:/regex:/regexp:/contains: 等工具前缀（大小写不敏感）', () => {
    expect(normalizeUrlPattern('re:/api/v1')).toBe('/api/v1')
    expect(normalizeUrlPattern('REGEX: /api/v1')).toBe('/api/v1')
    expect(normalizeUrlPattern('contains:page_info')).toBe('page_info')
  })

  it('保留 DNR 合法锚点 || 与 |，不做清洗', () => {
    expect(normalizeUrlPattern('||x.com/path')).toBe('||x.com/path')
    expect(normalizeUrlPattern('|https://x.com/path|')).toBe('|https://x.com/path|')
  })

  it('含通配符 * 的 pattern 只做 trim，通配语义不变', () => {
    expect(normalizeUrlPattern('  /api/*/detail  ')).toBe('/api/*/detail')
    expect(normalizeUrlPattern('= https://x.com/*')).toBe('https://x.com/*')
  })

  it('只有前缀没有实际内容时返回空串', () => {
    expect(normalizeUrlPattern('= ')).toBe('')
    expect(normalizeUrlPattern('~')).toBe('')
  })
})
