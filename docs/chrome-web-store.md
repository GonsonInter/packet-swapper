# Chrome Web Store 提交材料

> 提交前务必：真机 load unpacked 验证五个功能；用 `npm run build` 后打包 `dist/` 为 zip 上传。

## 基本信息

- **名称（Name）**：调包专家 Packet Swapper
- **分类（Category）**：开发者工具 / Developer Tools
- **语言（Default language）**：中文（简体）

## 简短描述（Summary，≤132 字符）

改请求头/响应头、按 URL 条件生效、多方案切换，并支持 mock 接口返回。ModHeader 的干净开源替代，无任何数据收集。

## 详细描述（Description）

调包专家（Packet Swapper）是一个面向开发者的请求处理工具，是 ModHeader 的干净开源替代——不含任何数据收集代码。

主要功能：
• 改请求头 / 响应头：对请求增 / 改 / 删 HTTP header（基于 declarativeNetRequest，网络层稳定生效）
• 按 URL 条件生效：每条规则可选 URL 过滤，留空则全局生效
• 多套方案：保存多组配置，一键切换当前生效的方案
• Mock 接口返回：
  - 页面模式（主力）：拦截页面 fetch / XMLHttpRequest，完全自定义 status / headers / body / 延迟
  - 网络层模式（补充）：将请求重定向到 data URL，适合非 JS 发起的资源
• 配置可导入 / 导出为 JSON，方便备份与团队共享
• 内置 JSON 编辑器：语法高亮、合法性检测、一键格式化

隐私：本扩展不收集、不上传任何数据。所有配置仅保存在你本地浏览器的 chrome.storage.local 中。

开源地址：https://github.com/GonsonInter/packet-swapper

## 单一用途说明（Single purpose）

本扩展的单一用途是：作为开发者调试工具，按用户配置的规则修改 HTTP 请求/响应头，并对页面内 API 请求返回自定义（mock）响应。

## 权限用途说明（Permission justifications）

- **declarativeNetRequest**：用于按用户配置的规则修改请求头和响应头、以及将请求重定向到本地 data URL 实现网络层 mock。这是 MV3 下修改 header 的唯一受支持机制。
- **declarativeNetRequestWithHostAccess**：修改 header 需要对目标站点具备 host 访问权限；该权限使 declarativeNetRequest 规则能作用于用户授权的站点。
- **storage**：将用户创建的方案与规则保存在本地（chrome.storage.local），仅本地存储，不上传。
- **host_permissions: `<all_urls>`**：作为开发者工具，用户需要对任意目标站点调试请求，因此需要全站点的 host 访问权限，才能对用户当前调试的任意站点应用 header 规则与注入 mock 脚本。扩展不会主动读取或外传页面内容。
- **内容脚本注入（content scripts on `<all_urls>`）**：在页面中注入脚本以拦截 fetch / XMLHttpRequest 实现页面级 mock。仅在本地按用户规则拦截匹配的请求并返回用户自定义的响应，不采集页面数据。

## 数据用途声明（Data usage）

- 是否收集用户数据：**否**。
- 远程代码（Remote code）：**否**——所有代码已随扩展打包，无远程加载、无 eval。
- 数据出售 / 转移 / 与用途无关的使用：均**否**。
- 隐私政策 URL：见 `PRIVACY.md`（发布时托管为可访问 URL，例如 GitHub 上该文件的 raw 链接或 GitHub Pages）。

## 截图清单（需自行截取，1280×800 或 640×400）

1. popup 的 Header 标签：展示几条 header 规则 + `⋮` 菜单展开（作用/操作/URL 过滤）。
2. popup 的 Mock 标签：一条展开的 mock 规则，展示 JSON 编辑器（高亮 + 格式化）。
3. 左侧多方案切换。
4. 管理页（options）：更大画布 + 导入/导出按钮。
5.（可选）DevTools Network 面板对比，证明 header 真实被改。
