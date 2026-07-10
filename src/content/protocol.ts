import type { MockRule } from '../core/types'

/** ISOLATED ↔ MAIN world 通过 window.postMessage 通信的固定标识与消息类型。 */
export const PS_SOURCE = 'packet-swapper' as const

export interface PsMocksMessage {
  source: typeof PS_SOURCE
  type: 'mocks'
  mocks: MockRule[]
}

export interface PsReadyMessage {
  source: typeof PS_SOURCE
  type: 'ready'
}

export type PsMessage = PsMocksMessage | PsReadyMessage
