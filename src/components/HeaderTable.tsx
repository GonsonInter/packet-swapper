import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Seg } from './Seg'
import { DragHandle } from './DragHandle'
import { useDragReorder } from './use-drag-reorder'
import { newHeaderRule } from '../core/factories'
import { reorderById } from '../core/reorder'
import type { HeaderAction, HeaderRule, HeaderTarget, Profile } from '../core/types'

const TARGETS: [HeaderTarget, string][] = [
  ['request', '请求头'],
  ['response', '响应头'],
]
const ACTIONS: [HeaderAction, string][] = [
  ['set', '设置'],
  ['append', '追加'],
  ['remove', '删除'],
]

export function HeaderTable({
  profile,
  onChange,
}: {
  profile: Profile
  onChange: (p: Profile) => void
}) {
  const rules = profile.headerRules
  const setRules = (next: HeaderRule[]) => onChange({ ...profile, headerRules: next })
  const patch = (id: string, p: Partial<HeaderRule>) =>
    setRules(rules.map((r) => (r.id === id ? { ...r, ...p } : r)))
  const remove = (id: string) => setRules(rules.filter((r) => r.id !== id))
  const add = () => setRules([...rules, newHeaderRule()])
  const { dragId, overId, getHandleProps, getRowProps } = useDragReorder((fromId, toId) =>
    setRules(reorderById(rules, fromId, toId)),
  )

  if (rules.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          padding: '48px 16px',
          border: '1px dashed #e5e7eb',
          borderRadius: 12,
          background: '#fcfcfd',
        }}
      >
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <line x1="9" y1="10" x2="9" y2="19" />
        </svg>
        <div style={{ color: '#9ca3af', fontSize: 13 }}>还没有 header 规则</div>
        <button className="ps-btn-text" onClick={add}>
          + 新增 header 规则
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* 表头 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 6px 8px',
          fontSize: 11,
          fontWeight: 600,
          color: '#9ca3af',
        }}
      >
        <span style={{ width: 20, textAlign: 'center' }}></span>
        <span style={{ width: 32, textAlign: 'center' }}>启用</span>
        <span style={{ flex: 1 }}>Header 名</span>
        <span style={{ flex: 1 }}>值</span>
        <span style={{ width: 64, textAlign: 'center' }}>操作</span>
      </div>

      {rules.map((r) => {
        const isRemove = r.action === 'remove'
        const isDragging = dragId === r.id
        const isDragOver = overId === r.id
        return (
          <div
            key={r.id}
            className="ps-row"
            data-drag-row=""
            {...getRowProps(r.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '7px 6px',
              borderRadius: 8,
              background: isDragOver ? '#dbeafe' : isDragging ? '#f3f4f6' : undefined,
              outline: isDragOver ? '3px dashed #2563eb' : 'none',
              outlineOffset: -1,
              boxShadow: isDragOver ? '0 0 0 4px rgba(37, 99, 235, 0.15)' : undefined,
            }}
          >
            <DragHandle {...getHandleProps(r.id)} />
            <span style={{ width: 32, textAlign: 'center' }}>
              <input
                type="checkbox"
                checked={r.enabled}
                onChange={(e) => patch(r.id, { enabled: e.target.checked })}
              />
            </span>
            <input
              className="ps-input"
              style={{ flex: 1 }}
              value={r.name}
              placeholder="X-My-Header"
              onChange={(e) => patch(r.id, { name: e.target.value })}
            />
            <input
              className="ps-input"
              style={{ flex: 1 }}
              value={r.value}
              disabled={isRemove}
              placeholder={isRemove ? '删除无需值' : 'value'}
              onChange={(e) => patch(r.id, { value: e.target.value })}
            />
            <span style={{ width: 64, display: 'inline-flex', justifyContent: 'center', gap: 2 }}>
              <button
                className="ps-icon-btn danger"
                title="删除该规则"
                onClick={() => remove(r.id)}
              >
                ✕
              </button>
              <RowMenu rule={r} onPatch={(p) => patch(r.id, p)} />
            </span>
          </div>
        )
      })}

      {rules.length === 0 && (
        <div style={{ padding: '16px 6px', color: '#9ca3af', fontSize: 13 }}>
          还没有 header 规则，点下面新增。
        </div>
      )}

      <button className="ps-btn-text" style={{ marginTop: 10 }} onClick={add}>
        + 新增 header 规则
      </button>
    </div>
  )
}

const MENU_W = 230
const GAP = 6

function RowMenu({ rule, onPatch }: { rule: HeaderRule; onPatch: (p: Partial<HeaderRule>) => void }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // 菜单渲染后实测真实尺寸再定位：下方放不下就翻到按钮上方，并钳制在视口内。
  useLayoutEffect(() => {
    if (!open) {
      setPos(null)
      return
    }
    const b = btnRef.current?.getBoundingClientRect()
    const m = menuRef.current?.getBoundingClientRect()
    if (!b || !m) return
    let top = b.bottom + GAP
    if (top + m.height > window.innerHeight - 8) {
      top = Math.max(8, b.top - m.height - GAP) // 翻到上方
    }
    let left = b.right - m.width // 右边缘对齐 ⋮ 按钮
    left = Math.max(8, Math.min(left, window.innerWidth - m.width - 8))
    setPos({ top, left })
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return
      setOpen(false)
    }
    const close = () => setOpen(false)
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  const nonDefault = rule.target !== 'request' || rule.action !== 'set' || !!rule.urlFilter

  return (
    <>
      <button
        ref={btnRef}
        className={'ps-icon-btn' + (nonDefault ? ' active' : '') + (open ? ' open' : '')}
        title="作用 / 操作 / URL 过滤"
        onClick={() => setOpen((o) => !o)}
      >
        ⋮
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="ps-menu ps-scope"
            style={{
              position: 'fixed',
              top: pos?.top ?? -9999,
              left: pos?.left ?? -9999,
              right: 'auto',
              width: MENU_W,
              visibility: pos ? 'visible' : 'hidden',
            }}
          >
            <div className="ps-menu-label">作用</div>
            <Seg value={rule.target} options={TARGETS} onChange={(v) => onPatch({ target: v })} />
            <div className="ps-menu-label">操作</div>
            <Seg value={rule.action} options={ACTIONS} onChange={(v) => onPatch({ action: v })} />
            <div className="ps-menu-label">URL 过滤（空 = 全局）</div>
            <input
              className="ps-input"
              value={rule.urlFilter ?? ''}
              placeholder="||example.com"
              onChange={(e) => onPatch({ urlFilter: e.target.value })}
            />
          </div>,
          document.body,
        )}
    </>
  )
}
