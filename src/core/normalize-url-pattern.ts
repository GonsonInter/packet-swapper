/**
 * URL 匹配规则归一化。
 *
 * 背景：urlPattern 是纯文本输入，用户常从其他工具粘来带前缀的规则
 * （`= 完整URL` 表精确、`~ /re/` 表正则、`re:`/`regex:`/`contains:` 等），
 * 也容易带首尾空格。网络层把它直接透传给 Chrome DNR urlFilter 时，`=`、
 * 空格都会被当成字面量，真实 URL 不含该子串 → 规则静默失效。
 *
 * 本工具的匹配语义统一为「无 * 子串匹配、含 * 分段通配」，与 DNR urlFilter
 * 无锚点时的行为一致；因此这里把这些前缀和空白清洗掉，不引入精确/正则新语义。
 * DNR 合法锚点 `||`（域名锚点）、`|`（首尾锚点）予以保留。
 *
 * @returns 清洗后的 pattern；输入为空白时返回空串（由调用方决定兜底，如网络层用 '*'）
 */
export function normalizeUrlPattern(raw: string): string {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) return ''

  // 保留 DNR 原生锚点语法，交给 DNR 按锚点规则解释
  if (trimmed.startsWith('||') || trimmed.startsWith('|')) return trimmed

  // 去除用户误加的匹配模式前缀（= 精确、~ 正则、re:/regex:/contains: 等），统一按子串/通配处理
  const withoutPrefix = trimmed.replace(/^(?:=+|~+|re:|regex:|regexp:|contains:)\s*/i, '').trim()
  return withoutPrefix
}
