import { describe, it, expect } from 'vitest'
import { collectPageMockRules } from '../src/core/collectPageMocks'
import { makeMockRule, makeProfile } from './helpers'

describe('collectPageMockRules', () => {
  it('globalEnabled=false 时返回空', () => {
    const state = {
      globalEnabled: false,
      profiles: [makeProfile({ mockRules: [makeMockRule({ mode: 'page' })] })],
    }
    expect(collectPageMockRules(state)).toEqual([])
  })

  it('只收集启用 profile 里启用的 page 模式规则', () => {
    const state = {
      globalEnabled: true,
      profiles: [
        makeProfile({
          id: 'p1',
          mockRules: [
            makeMockRule({ id: 'a', mode: 'page' }),
            makeMockRule({ id: 'off', mode: 'page', enabled: false }),
            makeMockRule({ id: 'net', mode: 'network' }),
          ],
        }),
        makeProfile({
          id: 'p2',
          enabled: false,
          mockRules: [makeMockRule({ id: 'disabled-profile', mode: 'page' })],
        }),
        makeProfile({ id: 'p3', mockRules: [makeMockRule({ id: 'b', mode: 'page' })] }),
      ],
    }
    expect(collectPageMockRules(state).map((r) => r.id)).toEqual(['a', 'b'])
  })
})
