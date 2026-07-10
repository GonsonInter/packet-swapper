import { useEffect, useRef, useState } from 'react'
import { GlobalStyle } from '../components/GlobalStyle'
import { ProfileRail } from '../components/ProfileRail'
import { RulesEditor } from '../components/RulesEditor'
import { Switch } from '../components/Switch'
import { newProfile } from '../core/factories'
import { exportState, importState } from '../core/serialize'
import type { Profile, RootState } from '../core/types'
import { useRootState, useWarning } from '../core/useRootState'

export function App() {
  const { state, update } = useRootState()
  const warning = useWarning()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const profiles = state?.profiles ?? []
  const selected =
    profiles.find((p) => p.id === selectedId) ??
    profiles.find((p) => p.enabled) ??
    profiles[0] ??
    null

  useEffect(() => {
    if (state && selected && selected.id !== selectedId) setSelectedId(selected.id)
  }, [state, selected, selectedId])

  if (!state) return <div className="ps-scope" style={{ padding: 24 }}>加载中…</div>

  const mutate = (fn: (d: RootState) => void) => {
    const d = structuredClone(state)
    fn(d)
    update(d)
  }

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

  const doExport = () => {
    const blob = new Blob([exportState(state)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'packet-swapper-config.json'
    a.click()
    URL.revokeObjectURL(url)
  }
  const doImport = async (file: File) => {
    try {
      const imported = importState(await file.text())
      update(imported)
      setSelectedId(imported.profiles.find((p) => p.enabled)?.id ?? imported.profiles[0]?.id ?? null)
      alert('导入成功')
    } catch (e) {
      alert(`导入失败：${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const disabled = !state.globalEnabled

  return (
    <div
      className="ps-scope"
      style={{ maxWidth: 980, margin: '0 auto', padding: '24px 24px 64px', fontSize: 13 }}
    >
      <GlobalStyle />

      <header style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <strong style={{ fontSize: 18 }}>调包专家</strong>
        <span style={{ fontSize: 13, color: '#9ca3af' }}>管理</span>
        <Switch
          checked={state.globalEnabled}
          onChange={(v) => mutate((d) => void (d.globalEnabled = v))}
          title="总开关"
        />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="ps-btn" onClick={doExport}>
            导出 JSON
          </button>
          <button className="ps-btn" onClick={() => fileRef.current?.click()}>
            导入 JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void doImport(f)
              e.target.value = ''
            }}
          />
        </div>
      </header>

      {warning && (
        <div
          style={{
            background: '#fff7ed',
            border: '1px solid #fdba74',
            borderRadius: 8,
            padding: '8px 12px',
            marginBottom: 18,
            fontSize: 13,
            color: '#9a3412',
          }}
        >
          ⚠️ {warning}
        </div>
      )}

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <aside style={{ width: 200, flexShrink: 0 }}>
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
