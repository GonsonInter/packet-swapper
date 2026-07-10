import { describe, it, expect } from 'vitest'
import { exportState, importState } from '../src/core/serialize'
import type { RootState } from '../src/core/types'
import { makeHeaderRule, makeMockRule, makeProfile } from './helpers'

const state: RootState = {
  globalEnabled: true,
  profiles: [
    makeProfile({
      headerRules: [makeHeaderRule()],
      mockRules: [makeMockRule()],
    }),
    makeProfile({ id: 'p2', name: 'Two' }),
  ],
}

describe('serialize', () => {
  it('导出再导入往返一致', () => {
    const json = exportState(state)
    expect(typeof json).toBe('string')
    expect(importState(json)).toEqual(state)
  })

  it('导出的是带缩进的合法 JSON，含 version', () => {
    const parsed = JSON.parse(exportState(state))
    expect(parsed.version).toBeTypeOf('number')
    expect(Array.isArray(parsed.profiles)).toBe(true)
  })

  it('非 JSON 文本报错', () => {
    expect(() => importState('not json {')).toThrow()
  })

  it('结构非法（profiles 不是数组）报错', () => {
    expect(() => importState(JSON.stringify({ version: 1, profiles: 'x' }))).toThrow()
  })

  it('profile 缺必填字段报错', () => {
    expect(() =>
      importState(JSON.stringify({ version: 1, profiles: [{ id: 'p', name: 'p' }] })),
    ).toThrow()
  })

  it('缺 globalEnabled 时默认为 false', () => {
    const imported = importState(JSON.stringify({ version: 1, profiles: [] }))
    expect(imported.globalEnabled).toBe(false)
    expect(imported.profiles).toEqual([])
  })
})
