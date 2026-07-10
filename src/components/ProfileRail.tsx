import { useState } from 'react'
import type { Profile } from '../core/types'

/**
 * 方案列表（单选）：单击切换生效方案，双击方案名重命名。popup 与 options 共用。
 */
export function ProfileRail({
  profiles,
  selectedId,
  onSelect,
  onRename,
  onDelete,
  onAdd,
}: {
  profiles: Profile[]
  selectedId: string | null
  onSelect: (id: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  onAdd: () => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {profiles.map((p) => {
        const active = p.id === selectedId
        return (
          <div
            key={p.id}
            className={'ps-card' + (active ? ' active' : '')}
            onClick={() => onSelect(p.id)}
            title={p.name}
            style={{ padding: '7px 8px' }}
          >
            {editingId === p.id ? (
              <input
                autoFocus
                value={p.name}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.currentTarget.select()}
                onBlur={() => setEditingId(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') e.currentTarget.blur()
                }}
                onChange={(e) => onRename(p.id, e.target.value)}
                style={{
                  border: '1px solid #93c5fd',
                  background: '#fff',
                  borderRadius: 5,
                  padding: '1px 4px',
                  fontWeight: 600,
                  fontSize: 13,
                  width: '100%',
                  outline: 'none',
                  color: '#111827',
                }}
              />
            ) : (
              <div
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  setEditingId(p.id)
                }}
                title="双击重命名"
                style={{
                  fontWeight: 600,
                  fontSize: 13,
                  color: active ? '#1d4ed8' : '#111827',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  cursor: 'pointer',
                }}
              >
                {p.name || <span style={{ color: '#9ca3af', fontWeight: 400 }}>未命名</span>}
              </div>
            )}
            <div
              style={{
                fontSize: 10,
                color: '#9ca3af',
                marginTop: 4,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span>
                {p.headerRules.length}H · {p.mockRules.length}M
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(p.id)
                }}
                title="删除方案"
                style={{
                  marginLeft: 'auto',
                  border: 'none',
                  background: 'none',
                  color: '#d1d5db',
                  cursor: 'pointer',
                  fontSize: 12,
                  padding: 0,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#d1d5db')}
              >
                ✕
              </button>
            </div>
          </div>
        )
      })}
      <button className="ps-btn-text" style={{ marginTop: 2 }} onClick={onAdd}>
        + 新建方案
      </button>
    </div>
  )
}
