import { useState, type DragEvent } from 'react'

/**
 * 列表拖拽排序（原生 HTML5 DnD，零依赖）。
 *
 * 交互：拖起「手柄」(getHandleProps) → 拖过目标行时高亮（overId）→
 * 在目标行任意位置松手（getRowProps 的 onDrop）触发 onReorder(fromId, toId)。
 * 行本身不 draggable，只有手柄可发起拖拽，避免与输入框/下拉等控件冲突。
 */
export function useDragReorder(onReorder: (fromId: string, toId: string) => void) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const reset = () => {
    setDragId(null)
    setOverId(null)
  }

  const getHandleProps = (id: string) => ({
    draggable: true,
    title: '拖拽调整优先级（越靠上优先级越高）',
    // 拖拽中隐藏源手柄：整行已作为 dragImage 跟随鼠标，避免原位残留默认 ghost 虚影
    'data-dragging': dragId === id ? 'true' : undefined,
    onDragStart: (e: DragEvent) => {
      setDragId(id)
      e.dataTransfer.effectAllowed = 'move'
      // Firefox 需要 setData 才会触发 drag
      try {
        e.dataTransfer.setData('text/plain', id)
      } catch {
        /* 忽略：部分环境不允许写 dataTransfer */
      }
      // 默认拖拽影像是手柄（小六点），这里改取所在整行，让拖起来的是「那一条规则」
      const row = (e.currentTarget as HTMLElement).closest('[data-drag-row]') as HTMLElement | null
      if (row) {
        // 相对行内偏移，避免影像跳到鼠标左上角
        const rect = row.getBoundingClientRect()
        e.dataTransfer.setDragImage(row, e.clientX - rect.left, e.clientY - rect.top)
      }
    },
    onDragEnd: reset,
  })

  const getRowProps = (id: string) => ({
    onDragOver: (e: DragEvent) => {
      // 必须 preventDefault 否则 drop 不触发
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      if (dragId && dragId !== id) setOverId(id)
    },
    onDrop: (e: DragEvent) => {
      e.preventDefault()
      if (dragId && dragId !== id) onReorder(dragId, id)
      reset()
    },
  })

  return { dragId, overId, getHandleProps, getRowProps }
}
