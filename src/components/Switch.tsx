/** 滑动开关。 */
export function Switch({
  checked,
  onChange,
  title,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  title?: string
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      title={title}
      style={{
        border: 'none',
        cursor: 'pointer',
        borderRadius: 999,
        width: 42,
        height: 24,
        padding: 3,
        background: checked ? '#2563eb' : '#d1d5db',
        transition: 'background .15s',
        display: 'inline-flex',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          transform: checked ? 'translateX(18px)' : 'translateX(0)',
          transition: 'transform .15s',
          boxShadow: '0 1px 3px rgba(0,0,0,.25)',
        }}
      />
    </button>
  )
}
