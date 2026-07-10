import Editor from 'react-simple-code-editor'
// 用 prism-core + 按需语言，保证共享同一个 Prism 实例（react-simple-code-editor 推荐用法）
import { highlight, languages } from 'prismjs/components/prism-core'
import 'prismjs/components/prism-json'

const FONT = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

export function JsonEditor({
  value,
  onChange,
  minHeight = 120,
}: {
  value: string
  onChange: (v: string) => void
  minHeight?: number
}) {
  const trimmed = value.trim()
  let error: string | null = null
  let valid = false
  if (trimmed) {
    try {
      JSON.parse(trimmed)
      valid = true
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
  }

  const format = () => {
    try {
      onChange(JSON.stringify(JSON.parse(value), null, 2))
    } catch {
      /* 非法 JSON 不格式化 */
    }
  }

  return (
    <div>
      <div
        className="ps-json"
        style={{
          border: `1px solid ${error ? '#fca5a5' : '#e5e7eb'}`,
          borderRadius: 6,
          overflow: 'auto',
          maxHeight: 320,
          background: '#fff',
          transition: 'border-color .12s',
        }}
      >
        <Editor
          value={value}
          onValueChange={onChange}
          highlight={(code) => highlight(code, languages.json, 'json')}
          padding={10}
          textareaId="ps-json-body"
          style={{ fontFamily: FONT, fontSize: 12.5, lineHeight: 1.5, minHeight }}
        />
      </div>
      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, minHeight: 18 }}>
        {trimmed && valid && <span style={{ fontSize: 11, color: '#16a34a' }}>✓ JSON 合法</span>}
        {trimmed && error && (
          <span style={{ fontSize: 11, color: '#dc2626', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={error}>
            ✗ {error}
          </span>
        )}
        <button
          className="ps-btn-text"
          style={{ marginLeft: 'auto', padding: '3px 8px', fontSize: 12 }}
          disabled={!valid}
          onClick={format}
        >
          格式化
        </button>
      </div>
    </div>
  )
}
