import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { copyManifest } from './scripts/copy-manifest'

const target = process.env.BUILD_TARGET ?? 'app'

// content script 必须是自包含的单文件（IIFE），且不能用 ES module import，
// 所以每个 content 脚本单独用 lib 模式打一遍，追加写入 dist/（emptyOutDir: false）。
export default defineConfig(() => {
  if (target === 'content') {
    const entry = process.env.CONTENT_ENTRY
    if (entry !== 'content-iso' && entry !== 'content-main') {
      throw new Error(`CONTENT_ENTRY 必须是 content-iso 或 content-main，收到: ${entry}`)
    }
    return {
      build: {
        outDir: 'dist',
        emptyOutDir: false,
        lib: {
          entry: resolve(__dirname, `src/content/${entry}.ts`),
          formats: ['iife'] as const,
          name: entry.replace(/-/g, '_'),
          fileName: () => `${entry}.js`,
        },
      },
    }
  }

  return {
    plugins: [react(), copyManifest()],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          background: resolve(__dirname, 'src/background/index.ts'),
          popup: resolve(__dirname, 'src/popup/index.html'),
          options: resolve(__dirname, 'src/options/index.html'),
        },
        output: {
          entryFileNames: (chunk) =>
            chunk.name === 'background' ? 'background.js' : 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
    },
  }
})
