// @vitest-environment jsdom
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { PS_SOURCE } from '../src/content/protocol'
import type { MockRule } from '../src/core/types'
import { makeMockRule } from './helpers'

let realFetch: ReturnType<typeof vi.fn>

beforeAll(async () => {
  // 在导入 content-main 前替换 window.fetch，使其把它捕获为「原始 fetch」，
  // 避免未命中时打真实网络。
  realFetch = vi.fn(async () => new Response('REAL', { status: 200 }))
  window.fetch = realFetch as unknown as typeof fetch
  await import('../src/content/content-main')
})

function pushMocks(mocks: MockRule[]) {
  window.dispatchEvent(
    new MessageEvent('message', {
      data: { source: PS_SOURCE, type: 'mocks', mocks },
      source: window,
    }),
  )
}

describe('content-main fetch hook', () => {
  it('命中 mock 时返回自定义响应，不打真实网络', async () => {
    pushMocks([
      makeMockRule({
        urlPattern: '/api/user',
        method: 'ANY',
        statusCode: 201,
        body: '{"name":"mock"}',
        headers: [{ name: 'Content-Type', value: 'application/json' }],
      }),
    ])

    const resp = await window.fetch('https://x.com/api/user')
    expect(resp.status).toBe(201)
    expect(resp.headers.get('content-type')).toBe('application/json')
    expect(await resp.json()).toEqual({ name: 'mock' })
    expect(realFetch).not.toHaveBeenCalled()
  })

  it('未命中时回退真实 fetch', async () => {
    pushMocks([makeMockRule({ urlPattern: '/api/user' })])
    const resp = await window.fetch('https://x.com/other')
    expect(await resp.text()).toBe('REAL')
    expect(realFetch).toHaveBeenCalledTimes(1)
  })

  it('method 不符时回退真实 fetch', async () => {
    realFetch.mockClear()
    pushMocks([makeMockRule({ urlPattern: '/api/user', method: 'POST' })])
    await window.fetch('https://x.com/api/user', { method: 'GET' })
    expect(realFetch).toHaveBeenCalledTimes(1)
  })
})

describe('content-main XHR hook', () => {
  it('命中 mock 时伪造 status/responseText 并按序触发事件', async () => {
    pushMocks([
      makeMockRule({
        urlPattern: '/api/data',
        method: 'GET',
        statusCode: 200,
        body: '{"v":42}',
        headers: [{ name: 'Content-Type', value: 'application/json' }],
      }),
    ])

    const states: number[] = []
    const events: string[] = []

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('GET', 'https://x.com/api/data')
      xhr.addEventListener('readystatechange', () => states.push(xhr.readyState))
      xhr.addEventListener('load', () => {
        events.push('load')
        try {
          expect(xhr.status).toBe(200)
          expect(xhr.responseText).toBe('{"v":42}')
          expect(xhr.getResponseHeader('content-type')).toBe('application/json')
          resolve()
        } catch (e) {
          reject(e)
        }
      })
      xhr.addEventListener('loadend', () => events.push('loadend'))
      xhr.send()
    })

    expect(states).toContain(4)
    expect(states[states.length - 1]).toBe(4)
    expect(events).toEqual(['load', 'loadend'])
  })

  it('page 模式 delayMs 生效', async () => {
    pushMocks([makeMockRule({ urlPattern: '/api/slow', method: 'GET', body: 'ok', delayMs: 40 })])
    const start = performance.now()
    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest()
      xhr.open('GET', 'https://x.com/api/slow')
      xhr.addEventListener('load', () => resolve())
      xhr.send()
    })
    expect(performance.now() - start).toBeGreaterThanOrEqual(30)
  })
})
