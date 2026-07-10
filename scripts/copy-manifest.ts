import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'

/**
 * 构建后把 manifest.json 和 public/ 里的静态资源（图标等）拷进 dist/。
 * manifest 手写，不走 Vite 的 HTML 处理。
 */
export function copyManifest(): Plugin {
  return {
    name: 'copy-manifest',
    apply: 'build',
    closeBundle() {
      const root = process.cwd()
      const dist = resolve(root, 'dist')
      if (!existsSync(dist)) mkdirSync(dist, { recursive: true })

      cpSync(resolve(root, 'manifest.json'), resolve(dist, 'manifest.json'))

      const publicDir = resolve(root, 'public')
      if (existsSync(publicDir)) {
        cpSync(publicDir, dist, { recursive: true })
      }
    },
  }
}
