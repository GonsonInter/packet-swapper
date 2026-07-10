// MAIN world content script（document_start）。
// hook window.fetch 与 XMLHttpRequest，命中 page 模式 mock 规则时返回自定义响应。
// 拿不到 chrome.*，规则由 ISOLATED world 经 postMessage 下发。
import { matchMockRule } from '../core/matchMockRule'
import type { MockRule } from '../core/types'
import { PS_SOURCE, type PsMessage, type PsReadyMessage } from './protocol'

let mocks: MockRule[] = []

window.addEventListener('message', (ev) => {
  if (ev.source !== window) return
  const d = ev.data as PsMessage | null
  if (!d || d.source !== PS_SOURCE) return
  if (d.type === 'mocks') mocks = d.mocks ?? []
})

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

function buildHeaders(rule: MockRule): Headers {
  const h = new Headers()
  for (const { name, value } of rule.headers) {
    try {
      h.set(name, value)
    } catch {
      /* 非法 header 名忽略 */
    }
  }
  return h
}

// ── fetch hook ──
const origFetch = window.fetch
window.fetch = async function (
  this: unknown,
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  try {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url
    const method = (
      init?.method ?? (input instanceof Request ? input.method : 'GET')
    ).toUpperCase()

    const hit = matchMockRule(mocks, url, method)
    if (hit) {
      if (hit.delayMs > 0) await sleep(hit.delayMs)
      const resp = new Response(hit.body, {
        status: hit.statusCode || 200,
        headers: buildHeaders(hit),
      })
      try {
        Object.defineProperty(resp, 'url', { value: url })
      } catch {
        /* url 只读，忽略 */
      }
      return resp
    }
  } catch (e) {
    console.error('[packet-swapper] fetch hook 出错，回退真实请求', e)
  }
  return origFetch.call(window, input, init)
}

// ── XMLHttpRequest hook ──
interface XhrMeta {
  method: string
  url: string
}
const xhrMeta = new WeakMap<XMLHttpRequest, XhrMeta>()

const xhrProto = XMLHttpRequest.prototype
const origOpen = xhrProto.open
const origSend = xhrProto.send

xhrProto.open = function (
  this: XMLHttpRequest,
  method: string,
  url: string | URL,
  ...rest: unknown[]
) {
  xhrMeta.set(this, { method: String(method).toUpperCase(), url: String(url) })
  // @ts-expect-error 透传剩余参数
  return origOpen.call(this, method, url, ...rest)
}

xhrProto.send = function (this: XMLHttpRequest, body?: Document | XMLHttpRequestBodyInit | null) {
  const meta = xhrMeta.get(this)
  const hit = meta ? matchMockRule(mocks, meta.url, meta.method) : null
  if (!hit || !meta) {
    return origSend.call(this, body ?? null)
  }
  fakeXhr(this, hit, meta.url)
}

function def(obj: object, prop: string, value: unknown): void {
  try {
    Object.defineProperty(obj, prop, { configurable: true, get: () => value })
  } catch {
    /* 忽略 */
  }
}

function fakeXhr(xhr: XMLHttpRequest, rule: MockRule, url: string): void {
  const status = rule.statusCode || 200
  const headerLines = rule.headers.map((h) => `${h.name}: ${h.value}`).join('\r\n')

  const run = () => {
    // 覆盖只读属性
    def(xhr, 'status', status)
    def(xhr, 'statusText', 'OK')
    def(xhr, 'responseText', rule.body)
    def(xhr, 'response', rule.body)
    def(xhr, 'responseURL', url)
    xhr.getAllResponseHeaders = () => (headerLines ? headerLines + '\r\n' : '')
    xhr.getResponseHeader = (name: string) => {
      const h = rule.headers.find((x) => x.name.toLowerCase() === name.toLowerCase())
      return h ? h.value : null
    }

    const fireReadyState = (state: number) => {
      def(xhr, 'readyState', state)
      xhr.dispatchEvent(new Event('readystatechange'))
    }

    fireReadyState(XMLHttpRequest.HEADERS_RECEIVED) // 2
    fireReadyState(XMLHttpRequest.LOADING) // 3
    fireReadyState(XMLHttpRequest.DONE) // 4

    const total = new TextEncoder().encode(rule.body).length
    const progress = (type: string) =>
      xhr.dispatchEvent(
        new ProgressEvent(type, { lengthComputable: true, loaded: total, total }),
      )
    progress('load')
    progress('loadend')
  }

  if (rule.delayMs > 0) setTimeout(run, rule.delayMs)
  else run()
}

// 通知 ISOLATED world：MAIN 侧已装好，请（重）发一次规则
const ready: PsReadyMessage = { source: PS_SOURCE, type: 'ready' }
window.postMessage(ready, '*')
