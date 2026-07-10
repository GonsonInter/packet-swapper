import { useState } from 'react'
import type { Profile } from '../core/types'
import { HeaderTable } from './HeaderTable'
import { MockTable } from './MockTable'

/** 顶部 Header/Mock 切换 + 对应规则表。popup 与 options 共用。 */
export function RulesEditor({
  profile,
  onChange,
}: {
  profile: Profile
  onChange: (p: Profile) => void
}) {
  const [tab, setTab] = useState<'headers' | 'mock'>('headers')
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        <button
          className={tab === 'headers' ? 'ps-btn ps-btn-primary' : 'ps-btn'}
          onClick={() => setTab('headers')}
        >
          Header
        </button>
        <button
          className={tab === 'mock' ? 'ps-btn ps-btn-primary' : 'ps-btn'}
          onClick={() => setTab('mock')}
        >
          Mock
        </button>
      </div>
      {tab === 'headers' ? (
        <HeaderTable profile={profile} onChange={onChange} />
      ) : (
        <MockTable profile={profile} onChange={onChange} />
      )}
    </div>
  )
}
