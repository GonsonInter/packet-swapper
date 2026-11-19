/**
 * 数组重排：把 from 位置的元素移到 to 位置（不可变）。
 *
 * 用于拖拽排序：拖起索引 from、落点索引 to，返回新数组。
 * 越界或原地移动时原样返回（引用不变，便于 React 浅比较跳过更新）。
 */
export function reorder<T>(list: readonly T[], from: number, to: number): T[] {
  if (from === to) return [...list]
  if (from < 0 || to < 0 || from >= list.length || to >= list.length) return [...list]

  const next = [...list]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

/** 按元素 id 重排（规则列表用 id 作 key，拖拽回调给的是 id 而非下标）。 */
export function reorderById<T extends { id: string }>(
  list: readonly T[],
  fromId: string,
  toId: string,
): T[] {
  const from = list.findIndex((x) => x.id === fromId)
  const to = list.findIndex((x) => x.id === toId)
  if (from === -1 || to === -1) return [...list]
  return reorder(list, from, to)
}
