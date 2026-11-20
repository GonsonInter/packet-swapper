/**
 * 拖拽插入指示线：在目标行顶边（before）或底边（after）画一条蓝色横线。
 * 绝对定位脱流，不占布局、不会顶动相邻行；父行需 position: relative。
 */
export function DropIndicator({ position }: { position: 'before' | 'after' }) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        height: 3,
        borderRadius: 2,
        background: '#2563eb',
        boxShadow: '0 0 6px rgba(37, 99, 235, 0.45)',
        pointerEvents: 'none',
        zIndex: 5,
        // before 贴顶边、after 贴底边
        ...(position === 'before' ? { top: -2 } : { bottom: -2 }),
      }}
    />
  )
}
