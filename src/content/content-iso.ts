// ISOLATED world content script（document_start）。
// 从 storage 读 page 模式 mock 规则，postMessage 下发给 MAIN world；storage 变化时重发。
import { collectPageMockRules } from '../core/collectPageMocks'
import { getState, onStateChange } from '../core/storage'
import { PS_SOURCE, type PsMocksMessage } from './protocol'

async function push(): Promise<void> {
  try {
    const state = await getState()
    const message: PsMocksMessage = {
      source: PS_SOURCE,
      type: 'mocks',
      mocks: collectPageMockRules(state),
    }
    window.postMessage(message, '*')
  } catch (e) {
    console.error('[packet-swapper] content-iso 下发 mock 失败', e)
  }
}

onStateChange(() => void push())

// MAIN world 脚本同为 document_start，可能在本次 postMessage 前尚未装好监听。
// MAIN 侧装好后会 postMessage 一个 "ready"，我们收到后补发一次。
window.addEventListener('message', (ev) => {
  const d = ev.data as { source?: string; type?: string } | null
  if (ev.source === window && d?.source === PS_SOURCE && d.type === 'ready') void push()
})

void push()
