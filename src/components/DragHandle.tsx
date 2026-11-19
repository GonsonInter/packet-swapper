import type { HTMLAttributes } from 'react'

/**
 * 拖拽手柄：六点抓握图标，仅它本身 draggable。
 * 事件由 useDragReorder 的 getHandleProps 注入。
 */
export function DragHandle(props: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      aria-label="拖拽排序"
      role="button"
      tabIndex={0}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 20,
        height: 28,
        flexShrink: 0,
        cursor: 'grab',
        color: '#9ca3af',
        borderRadius: 6,
        userSelect: 'none',
      }}
      onMouseDown={(e) => e.stopPropagation()}
      {...props}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <circle cx="9" cy="6" r="1.6" />
        <circle cx="15" cy="6" r="1.6" />
        <circle cx="9" cy="12" r="1.6" />
        <circle cx="15" cy="12" r="1.6" />
        <circle cx="9" cy="18" r="1.6" />
        <circle cx="15" cy="18" r="1.6" />
      </svg>
    </span>
  )
}
