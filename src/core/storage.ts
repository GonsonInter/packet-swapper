import type { RootState } from './types'

const STORAGE_KEY = 'packet-swapper-state'

export const DEFAULT_STATE: RootState = {
  globalEnabled: true,
  profiles: [
    {
      id: 'default',
      name: '默认',
      enabled: true,
      headerRules: [],
      mockRules: [],
    },
  ],
}

/** 读 RootState；读失败或无数据时返回默认值。 */
export async function getState(): Promise<RootState> {
  try {
    const obj = await chrome.storage.local.get(STORAGE_KEY)
    const state = obj[STORAGE_KEY] as RootState | undefined
    if (!state || !Array.isArray(state.profiles)) return DEFAULT_STATE
    return state
  } catch (e) {
    console.error('[packet-swapper] 读取 storage 失败，降级为默认状态', e)
    return DEFAULT_STATE
  }
}

export async function setState(state: RootState): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: state })
}

/** 订阅 storage 变化，回调收到新的 RootState。返回取消订阅函数。 */
export function onStateChange(cb: (state: RootState) => void): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    area: string,
  ) => {
    if (area !== 'local' || !(STORAGE_KEY in changes)) return
    const next = changes[STORAGE_KEY].newValue as RootState | undefined
    if (next) cb(next)
  }
  chrome.storage.onChanged.addListener(listener)
  return () => chrome.storage.onChanged.removeListener(listener)
}

// ── warning 标记：background 写、options 读 ──
const WARNING_KEY = 'packet-swapper-warning'

export async function setWarning(msg: string | null): Promise<void> {
  await chrome.storage.local.set({ [WARNING_KEY]: msg })
}

export async function getWarning(): Promise<string | null> {
  try {
    const obj = await chrome.storage.local.get(WARNING_KEY)
    return (obj[WARNING_KEY] as string | null | undefined) ?? null
  } catch {
    return null
  }
}

export function onWarningChange(cb: (msg: string | null) => void): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    area: string,
  ) => {
    if (area !== 'local' || !(WARNING_KEY in changes)) return
    cb((changes[WARNING_KEY].newValue as string | null | undefined) ?? null)
  }
  chrome.storage.onChanged.addListener(listener)
  return () => chrome.storage.onChanged.removeListener(listener)
}

export { STORAGE_KEY, WARNING_KEY }
