import type { Profile, RootState } from './types'

export const EXPORT_VERSION = 1

interface ExportShape {
  version: number
  globalEnabled?: boolean
  profiles: unknown
}

export function exportState(state: RootState): string {
  const payload: ExportShape = {
    version: EXPORT_VERSION,
    globalEnabled: state.globalEnabled,
    profiles: state.profiles,
  }
  return JSON.stringify(payload, null, 2)
}

function fail(msg: string): never {
  throw new Error(`[packet-swapper] 导入失败：${msg}`)
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function assertProfile(p: unknown, i: number): asserts p is Profile {
  if (!isObject(p)) fail(`profiles[${i}] 不是对象`)
  if (typeof p.id !== 'string') fail(`profiles[${i}].id 缺失`)
  if (typeof p.name !== 'string') fail(`profiles[${i}].name 缺失`)
  if (typeof p.enabled !== 'boolean') fail(`profiles[${i}].enabled 缺失`)
  if (!Array.isArray(p.headerRules)) fail(`profiles[${i}].headerRules 不是数组`)
  if (!Array.isArray(p.mockRules)) fail(`profiles[${i}].mockRules 不是数组`)
}

export function importState(json: string): RootState {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    fail('不是合法 JSON')
  }

  if (!isObject(parsed)) fail('顶层不是对象')
  if (!Array.isArray(parsed.profiles)) fail('profiles 不是数组')

  parsed.profiles.forEach((p, i) => assertProfile(p, i))

  return {
    globalEnabled: parsed.globalEnabled === true,
    profiles: parsed.profiles as Profile[],
  }
}
