import { useEffect, useState } from 'react'
import { GlobalStyle } from '../components/GlobalStyle'
import { ProfileRail } from '../components/ProfileRail'
import { RulesEditor } from '../components/RulesEditor'
import { Switch } from '../components/Switch'
import { newProfile } from '../core/factories'
import type { Profile, RootState } from '../core/types'
import { useRootState, useWarning } from '../core/useRootState'

export function App() {
  const { state, update } = useRootState()
  const warning = useWarning()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const profiles = state?.profiles ?? []
  const selected =
    profiles.find((p) => p.id === selectedId) ??
    profiles.find((p) => p.enabled) ??
    profiles[0] ??
    null

  useEffect(() => {
    if (state && selected && selected.id !== selectedId) setSelectedId(selected.id)
  }, [state, selected, selectedId])

  if (!state) return <div className="ps-scope" style={{ width: 780, padding: 16 }}>加载中…</div>

  const mutate = (fn: (d: RootState) => void) => {
    const d = structuredClone(state)
    fn(d)
    update(d)
  }

  // 单选：选中某方案即把它设为唯一生效
  const selectProfile = (id: string) => {
    setSelectedId(id)
    mutate((d) => {
      for (const p of d.profiles) p.enabled = p.id === id
    })
  }
  const rename = (id: string, name: string) =>
    mutate((d) => {
      const t = d.profiles.find((x) => x.id === id)
      if (t) t.name = name
    })
  const remove = (id: string) => {
    if (!confirm('删除该方案？')) return
    mutate((d) => {
      d.profiles = d.profiles.filter((p) => p.id !== id)
    })
  }
  const add = () =>
    mutate((d) => {
      const p = newProfile(`方案 ${d.profiles.length + 1}`)
      for (const x of d.profiles) x.enabled = false
      p.enabled = true
      d.profiles.push(p)
      setSelectedId(p.id)
    })
  const changeProfile = (updated: Profile) =>
    mutate((d) => {
      d.profiles = d.profiles.map((p) => (p.id === updated.id ? updated : p))
    })

  const disabled = !state.globalEnabled

  return (
    <div className="ps-scope" style={{ width: 780, fontSize: 13, background: '#fff' }}>
      <GlobalStyle />

      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '11px 16px',
          borderBottom: '1px solid #eef0f2',
        }}
      >
        <strong style={{ fontSize: 15, letterSpacing: 0.2 }}>调包专家</strong>
        <Switch
          checked={state.globalEnabled}
          onChange={(v) => mutate((d) => void (d.globalEnabled = v))}
          title="总开关"
        />
        <button
          className="ps-btn"
          style={{ marginLeft: 'auto' }}
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          管理页 ↗
        </button>
      </header>

      {warning && (
        <div
          style={{
            background: '#fff7ed',
            borderBottom: '1px solid #fdba74',
            padding: '7px 16px',
            fontSize: 12,
            color: '#9a3412',
          }}
        >
          ⚠️ {warning}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'stretch', height: 508 }}>
        <aside
          style={{
            width: 116,
            flexShrink: 0,
            borderRight: '1px solid #eef0f2',
            padding: 8,
            background: '#fcfcfd',
          }}
        >
          <ProfileRail
            profiles={profiles}
            selectedId={selected?.id ?? null}
            onSelect={selectProfile}
            onRename={rename}
            onDelete={remove}
            onAdd={add}
          />
        </aside>

        <main
          style={{
            flex: 1,
            minWidth: 0,
            padding: 14,
            overflow: 'auto',
            opacity: disabled ? 0.45 : 1,
            pointerEvents: disabled ? 'none' : 'auto',
            transition: 'opacity .15s',
          }}
        >
          {selected ? (
            <RulesEditor profile={selected} onChange={changeProfile} />
          ) : (
            <div style={{ color: '#9ca3af' }}>没有方案，点左侧「新建方案」。</div>
          )}
        </main>
      </div>
    </div>
  )
}
