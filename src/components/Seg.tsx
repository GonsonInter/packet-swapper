// 分段控件（segmented control），配合 GlobalStyle 里的 .ps-seg 使用。
export function Seg<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: [T, string][]
  onChange: (v: T) => void
}) {
  return (
    <div className="ps-seg">
      {options.map(([v, label]) => (
        <button key={v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>
          {label}
        </button>
      ))}
    </div>
  )
}
