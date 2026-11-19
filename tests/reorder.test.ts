import { describe, it, expect } from 'vitest'
import { reorder, reorderById } from '../src/core/reorder'

describe('reorder', () => {
  it('把元素从 from 移到 to（下移）', () => {
    expect(reorder(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd'])
  })

  it('把元素从 from 移到 to（上移）', () => {
    expect(reorder(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c'])
  })

  it('原地移动返回等长新数组（不报错）', () => {
    const r = reorder(['a', 'b'], 1, 1)
    expect(r).toEqual(['a', 'b'])
  })

  it('越界返回等长拷贝', () => {
    expect(reorder(['a', 'b'], -1, 1)).toEqual(['a', 'b'])
    expect(reorder(['a', 'b'], 0, 5)).toEqual(['a', 'b'])
  })

  it('不改原数组（不可变）', () => {
    const src = ['a', 'b', 'c']
    reorder(src, 0, 2)
    expect(src).toEqual(['a', 'b', 'c'])
  })
})

describe('reorderById', () => {
  const list = [
    { id: 'r1', v: 1 },
    { id: 'r2', v: 2 },
    { id: 'r3', v: 3 },
  ]

  it('按 id 交换顺序', () => {
    expect(reorderById(list, 'r1', 'r3').map((x) => x.id)).toEqual(['r2', 'r3', 'r1'])
  })

  it('找不到 id 时返回等长拷贝', () => {
    expect(reorderById(list, 'nope', 'r2')).toEqual(list)
    expect(reorderById(list, 'r1', 'nope')).toEqual(list)
  })
})
