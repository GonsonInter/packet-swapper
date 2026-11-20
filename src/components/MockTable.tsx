import { useState } from 'react'
import { JsonEditor } from './JsonEditor'
import { Seg } from './Seg'
import { DragHandle } from './DragHandle'
import { DropIndicator } from './DropIndicator'
import { useDragReorder } from './use-drag-reorder'
import { isNetworkBodyTooLarge, newMockRule } from '../core/factories'
import { reorderById } from '../core/reorder'
import type { HttpMethod, MockHeader, MockMode, MockRule, Profile } from '../core/types'

const METHODS: HttpMethod[] = ['ANY', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH']
const MODES: [MockMode, string][] = [
  ['network', '网络层'],
  ['page', '页面'],
]

const labelStyle = {
  fontSize: 11,
  color: '#6b7280',
  fontWeight: 600,
  marginBottom: 6,
  lineHeight: '16px',
  height: 16,
} as const

export function MockTable({
  profile,
  onChange,
}: {
  profile: Profile
  onChange: (p: Profile) => void
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const rules = profile.mockRules
  const setRules = (next: MockRule[]) => onChange({ ...profile, mockRules: next })
  const patch = (id: string, p: Partial<MockRule>) =>
    setRules(rules.map((r) => (r.id === id ? { ...r, ...p } : r)))
  const remove = (id: string) => setRules(rules.filter((r) => r.id !== id))
  const add = () => {
    const r = newMockRule()
    setRules([...rules, r])
    setExpanded((s) => new Set(s).add(r.id))
  }
  const toggle = (id: string) =>
    setExpanded((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  const { dragId, overId, overPos, getHandleProps, getRowProps } = useDragReorder((fromId, toId) =>
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
          <path d="M8 3H6a2 2 0 0 0-2 2v4M16 3h2a2 2 0 0 1 2 2v4M8 21H6a2 2 0 0 1-2-2v-4M16 21h2a2 2 0 0 0 2-2v-4" />
        </svg>
        <div style={{ color: '#9ca3af', fontSize: 13 }}>还没有 mock 规则</div>
        <button className="ps-btn-text" onClick={add}>
          + 新增 mock 规则
        </button>
      </div>
    )
  }

  return (
    <div>
      {rules.map((r) => {
        const open = expanded.has(r.id)
        const tooLarge = isNetworkBodyTooLarge(r)
        const isDragOver = overId === r.id
        return (
          <div
            key={r.id}
            data-drag-row=""
            {...getRowProps(r.id)}
            style={{
              position: 'relative',
              border: `1px solid ${tooLarge ? '#fdba74' : '#eef0f2'}`,
              borderRadius: 10,
              marginBottom: 8,
              padding: '8px 10px',
              background: tooLarge ? '#fffbeb' : dragId === r.id ? '#f3f4f6' : '#fff',
            }}
          >
            {isDragOver && <DropIndicator position={overPos} />}
            {/* 概要行 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <DragHandle {...getHandleProps(r.id)} />
              <input
                type="checkbox"
                checked={r.enabled}
                onChange={(e) => patch(r.id, { enabled: e.target.checked })}
              />
              <input
                className="ps-input"
                style={{ flex: 1 }}
                value={r.urlPattern}
                placeholder="/api/user 或 https://x.com/*"
                onChange={(e) => patch(r.id, { urlPattern: e.target.value })}
              />
              <select
                className="ps-input"
                style={{ width: 92, flexShrink: 0 }}
                value={r.method}
                onChange={(e) => patch(r.id, { method: e.target.value as HttpMethod })}
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <button
                className={'ps-icon-btn' + (open ? ' open' : '')}
                title={open ? '收起' : '展开'}
                onClick={() => toggle(r.id)}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .12s' }}
                >
                  <polyline points="9 6 15 12 9 18" />
                </svg>
              </button>
              <button className="ps-icon-btn danger" title="删除该规则" onClick={() => remove(r.id)}>
                ✕
              </button>
            </div>

            {/* 详情 */}
            {open && (
              <div
                style={{
                  marginTop: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end' }}>
                  <div>
                    <div style={labelStyle}>模式</div>
                    <Seg value={r.mode} options={MODES} onChange={(v) => patch(r.id, { mode: v })} />
                  </div>
                  <div>
                    <div style={labelStyle}>状态码</div>
                    <input
                      className="ps-input"
                      type="number"
                      style={{ width: 96 }}
                      value={r.statusCode}
                      onChange={(e) => patch(r.id, { statusCode: Number(e.target.value) || 200 })}
                    />
                  </div>
                </div>

                <MockHeaders rule={r} onChange={(headers) => patch(r.id, { headers })} />

                <div>
                  <div style={labelStyle}>
                    响应 Body
                    {tooLarge && (
                      <span style={{ color: '#b45309', fontWeight: 400 }}>　body 过大，建议改用页面模式</span>
                    )}
                  </div>
                  <JsonEditor value={r.body} onChange={(body) => patch(r.id, { body })} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span
                    style={{
                      fontSize: 11,
                      color: '#6b7280',
                      fontWeight: 600,
                      lineHeight: '30px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    延迟 (ms)
                  </span>
                  <input
                    className="ps-input"
                    type="number"
                    style={{ width: 100 }}
                    value={r.delayMs}
                    disabled={r.mode !== 'page'}
                    title={
                      r.mode !== 'page'
                        ? '网络层走浏览器 DNR 重定向，扩展 API 无法控制响应时序；需要延迟请改用「页面」模式'
                        : undefined
                    }
                    onChange={(e) => patch(r.id, { delayMs: Number(e.target.value) || 0 })}
                  />
                  {r.mode !== 'page' && (
                    <span style={{ fontSize: 12, color: '#9ca3af', lineHeight: '18px' }}>
                      网络层（DNR 重定向）不支持延迟，需要延迟请切到「页面」模式
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}

      <button className="ps-btn-text" style={{ marginTop: 2 }} onClick={add}>
        + 新增 mock 规则
      </button>
    </div>
  )
}

function MockHeaders({
  rule,
  onChange,
}: {
  rule: MockRule
  onChange: (headers: MockHeader[]) => void
}) {
  const add = () => onChange([...rule.headers, { name: '', value: '' }])
  const patch = (i: number, p: Partial<MockHeader>) =>
    onChange(rule.headers.map((h, idx) => (idx === i ? { ...h, ...p } : h)))
  const remove = (i: number) => onChange(rule.headers.filter((_, idx) => idx !== i))

  return (
    <div>
      <div style={labelStyle}>响应 Headers</div>
      {rule.headers.map((h, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
          <input
            className="ps-input"
            style={{ flex: 1 }}
            placeholder="Content-Type"
            value={h.name}
            onChange={(e) => patch(i, { name: e.target.value })}
          />
          <input
            className="ps-input"
            style={{ flex: 2 }}
            placeholder="application/json"
            value={h.value}
            onChange={(e) => patch(i, { value: e.target.value })}
          />
          <button className="ps-icon-btn danger" title="删除该 header" onClick={() => remove(i)}>
            ✕
          </button>
        </div>
      ))}
      <button className="ps-btn-text" style={{ padding: '3px 6px' }} onClick={add}>
        + header
      </button>
    </div>
  )
}
