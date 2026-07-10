import { useCallback, useEffect, useState } from 'react'
import { getState, onStateChange, onWarningChange, getWarning, setState as persist } from './storage'
import type { RootState } from './types'

/** 加载并订阅 RootState；update 乐观更新 + 持久化到 storage。 */
export function useRootState() {
  const [state, setLocal] = useState<RootState | null>(null)

  useEffect(() => {
    let alive = true
    void getState().then((s) => {
      if (alive) setLocal(s)
    })
    const off = onStateChange((s) => setLocal(s))
    return () => {
      alive = false
      off()
    }
  }, [])

  const update = useCallback((next: RootState) => {
    setLocal(next)
    void persist(next)
  }, [])

  return { state, update }
}

/** 订阅 background 写入的 warning 标记。 */
export function useWarning(): string | null {
  const [warning, setWarning] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    void getWarning().then((w) => {
      if (alive) setWarning(w)
    })
    const off = onWarningChange((w) => setWarning(w))
    return () => {
      alive = false
      off()
    }
  }, [])
  return warning
}
