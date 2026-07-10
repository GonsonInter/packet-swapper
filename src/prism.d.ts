// @types/prismjs 未覆盖这些子路径入口，补声明。
declare module 'prismjs/components/prism-core' {
  export const languages: Record<string, unknown>
  export function highlight(code: string, grammar: unknown, language: string): string
}
declare module 'prismjs/components/prism-json'
