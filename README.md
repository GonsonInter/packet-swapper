# 调包专家 (packet-swapper)

Chrome MV3 扩展。ModHeader 的干净开源替代——**无任何数据收集**，并额外支持 **mock 请求返回**。

## 功能

- **改请求头 / 响应头**：对请求增 / 改 / 删 header（基于 `declarativeNetRequest`，网络层稳定生效）
- **按 URL 条件生效**：每条规则可选 URL 过滤，空则全局
- **多套 profile**：保存多组方案，可同时启用多个（规则叠加）
- **Mock 请求返回**
  - **页面模式（主力）**：注入 hook 劫持页面 `fetch` / `XMLHttpRequest`，完全自定义 status / headers / body / delay
  - **网络层模式（补充）**：DNR redirect 到 `data:` URL，适合非 JS 发起的资源

## 安装（开发者模式）

```bash
npm install
npm run build      # 产出 dist/
```

1. Chrome 打开 `chrome://extensions`
2. 右上角打开「开发者模式」
3. 点「加载已解压的扩展程序」，选择本项目的 `dist/` 目录
4. 工具栏出现「调包专家」图标即安装成功

改完代码重新 `npm run build`，回到扩展页点刷新即可。开发时可用 `npm run dev`（watch 构建）。

## 用法

- 点工具栏图标 → **popup**：总开关、快速勾选启用哪些 profile、打开管理页
- **管理页（options）**：
  - 左侧新建 / 删除 / 重命名 / 选中方案
  - 右侧 `Headers` 标签：编辑请求 / 响应头规则（作用、操作、名、值、URL 过滤）
  - 右侧 `Mock` 标签：编辑 mock 规则，展开行可编辑响应 headers / body / 延迟
  - 右上角导入 / 导出全部配置为 JSON

配置写入 `chrome.storage.local`，background 监听变化实时重建 DNR 规则；页面 mock 由 content script 下发缓存。

## 开发

```bash
npm test          # vitest 单元测试（核心纯逻辑 + fetch/XHR hook 集成测试）
npm run typecheck # tsc --noEmit
npm run build     # 构建到 dist/
npm run icons     # 重新生成图标 PNG
```

构建分三步（见 `package.json`）：popup/options/background 走 Vite 多入口；两个 content script 各自用 lib 模式打成自包含 IIFE 追加进 `dist/`。

## 目录结构

```
src/
├── core/        # 纯逻辑：类型、规则编译器、匹配器、序列化、storage 封装、React hook
├── background/  # service worker：编译规则 → updateDynamicRules
├── content/     # content-iso（ISOLATED，下发规则）+ content-main（MAIN，hook fetch/XHR）
├── popup/       # React：总开关 + profile 切换
└── options/     # React：完整配置编辑
tests/           # vitest
```

## 已知限制（MV3 平台约束，非 bug）

- **响应头 / CORS**：部分响应头（尤其 CORS 预检相关）DNR 改不到，或需精确 host 权限。
- **网络层 mock 的状态码**：`data:` URL 响应恒为 `200`，网络层模式无法自定义状态码；需要自定义状态码请用**页面模式**。
- **网络层 mock 的 body 大小**：受 `data:` URL 长度上限约束，body 过大时管理页会对该规则标黄，建议改用页面模式。
- **页面模式 mock 注入时机**：content-main 在 `document_start` 注入并劫持 `fetch`/`XHR`；极早（注入前）发出的请求可能漏掉。
- **XHR mock**：伪造 `readyState` / 事件序列（`readystatechange` → `load` → `loadend`），未覆盖 `abort`/`timeout`/上传进度等边角场景。

## 不做（一期）

ModHeader 配置格式导入兼容、e2e 自动化、云同步 / 配置分享、请求日志面板、Firefox 兼容。详见 `docs/`。
