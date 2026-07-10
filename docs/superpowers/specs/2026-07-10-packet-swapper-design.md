# 调包专家 (packet-swapper) — 设计文档

> Chrome MV3 扩展。ModHeader 的干净开源替代,额外支持 mock 请求返回。
> 展示名:**调包专家**;仓库/包名:`packet-swapper`。
> 日期:2026-07-10

## 背景

ModHeader 被 Chrome 商店以"含恶意软件"下架(后期加入了数据收集代码)。本项目做一个功能对等、无任何数据收集的干净替代,并额外增加"mock 请求返回"能力。

## 功能范围(一期)

1. **改请求头** — 对发出的请求增/改/删 request headers
2. **改响应头** — 修改服务器返回的 response headers
3. **按 URL 条件生效** — 每条规则可选 urlFilter,空则全局
4. **多套 profile 切换** — 保存多组方案,可同时启用多个(规则叠加)
5. **Mock 请求返回**
   - 页面内 API(fetch/XHR):注入 hook,完全自定义 status/headers/body/delay(主力)
   - 网络层其他资源:DNR redirect 到 data URL(补充)

非目标(一期不做):ModHeader 配置格式导入兼容、e2e 自动化测试、云同步。

## 整体架构

MV3 扩展,React + Vite 构建,产物 `dist/` 通过 "加载已解压的扩展程序" 加载。

四个运行部分:

- **background(service worker)**
  - 读 `chrome.storage.local` 里启用的 profile
  - 把 header 规则编译成 `declarativeNetRequest` 动态规则
  - storage 变化 → 全量重建规则
- **content script(两个 world)**
  - isolated world:读 storage 里的 mock 规则,`postMessage` 下发给 main world,storage 变化时重发
  - main world(`document_start`):hook `window.fetch` 与 `XMLHttpRequest`,命中规则返回自定义响应
- **popup(React)** — 总开关 + profile 快速切换 + 打开管理页
- **options 管理页(React)** — 编辑 header/mock 规则、profile 增删、导入导出 JSON

机制分工:
- 改 header → `declarativeNetRequest`(网络层,稳定)
- mock 页面内 API → content script 注入 hook
- mock 其他资源 → DNR redirect → data URL

## 数据模型

存于 `chrome.storage.local`,顶层为 `{ globalEnabled: boolean, profiles: Profile[] }`。

```
Profile {
  id: string
  name: string
  enabled: boolean
  headerRules: HeaderRule[]
  mockRules:   MockRule[]
}

HeaderRule {
  id: string
  enabled: boolean
  target:  'request' | 'response'
  action:  'set' | 'append' | 'remove'
  name:    string
  value:   string          // action=remove 时忽略
  urlFilter?: string        // 空=全局;支持 DNR urlFilter 语法,如 ||example.com
}

MockRule {
  id: string
  enabled: boolean
  urlPattern: string        // 匹配哪个接口(page 模式用子串/通配,network 模式转 DNR)
  method:  'GET'|'POST'|'PUT'|'DELETE'|'PATCH'|'ANY'
  mode:    'page' | 'network'
  statusCode: number        // 默认 200
  headers:  { name, value }[]
  body:     string          // 文本;JSON 直接贴
  delayMs:  number          // 默认 0,仅 page 模式生效
}
```

## 组件设计

### 1. 规则编译器(纯函数,`src/core/`)

- `compileHeaderRules(profiles): DNRRule[]`
  - 遍历启用 profile 的启用 headerRules
  - `action: "modifyHeaders"`;`set/append/remove` → DNR operation
  - `target: request` → `requestHeaders`;`response` → `responseHeaders`
  - `urlFilter` 空 → `condition.urlFilter = "*"`,否则透传
  - 分配稳定的规则 id 段(便于 `updateDynamicRules` 全量替换)
- `compileNetworkMocks(profiles): DNRRule[]`
  - `mode: network` 的 mockRule → `action: "redirect"`,`redirectUrl = data:<ct>;base64,<body>`
- `matchMockRule(rules, url, method): MockRule | null` — page 模式匹配逻辑

这些是纯函数,单元测试主战场。

### 2. background(`src/background/`)

- 启动时和 `chrome.storage.onChanged` 时:
  - `compileHeaderRules` + `compileNetworkMocks` → 合并
  - `chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules })`
- `globalEnabled=false` 时清空所有动态规则

### 3. content scripts(`src/content/`)

- `content-iso.ts`(world ISOLATED,`document_start`)
  - 读 storage mock 规则(page 模式部分)
  - `window.postMessage({ source: 'packet-swapper', mocks })` 下发
  - `chrome.storage.onChanged` → 重发
- `content-main.ts`(world MAIN,`document_start`)
  - 收 postMessage,缓存 mock 规则
  - 劫持 `window.fetch`:命中 → 构造 `Response(body, { status, headers })`,`delayMs` 用 `await sleep`;未命中 → 原始 fetch
  - 劫持 `XMLHttpRequest`:重写 `open/send`,命中则伪造 `status/responseText/readyState` 事件序列;未命中透传

> world: MAIN 的 content script 拿不到 `chrome.*`,故靠 iso world 转发规则。二者通过 `window.postMessage` + 固定 `source` 标识通信。

### 4. UI(`src/popup/`、`src/options/`)

**popup(~360px 宽)**
- 顶部:全局总开关
- profile 列表:每项复选框(enabled)
- 底部:"打开管理页"按钮

**options 管理页**
- 左:profile 列表(新建/删除/重命名/选中)
- 右:tab 切换
  - `Headers` 表:开关 / target / action / name / value / urlFilter,行内增删
  - `Mock` 表:开关 / urlPattern / method / mode / status,展开行编辑 headers·body·delay
- 右上:导入 / 导出 JSON(全部 profiles)

## 数据流

1. 用户在 options 编辑 → 写 `chrome.storage.local`
2. background 监听变化 → 重编译 → `updateDynamicRules`(header + network mock 立即生效)
3. content-iso 监听变化 → postMessage → content-main 更新 page mock 缓存
4. 页面 fetch/XHR → content-main 命中则返回假响应

## 错误处理

- 规则编译:单条规则非法(如空 header name)→ 跳过该条 + console.warn,不整体失败
- DNR 上限:动态规则有数量上限(当前 Chrome 约 5000/30000),超限时截断并在 options 顶部提示
- data URL mock:body 过大接近 URL 长度上限时,options 里对该 mockRule 标黄提示改用 page 模式
- storage 读失败:降级为"全部停用"并提示

## 测试策略

- **单元测试(vitest)**:`compileHeaderRules` / `compileNetworkMocks` / `matchMockRule` / 导入导出序列化 —— 核心纯逻辑全覆盖
- **手动验收**:load unpacked 后用测试页验证
  - 改 request/response header → devtools Network 核对
  - page mock → 页面 fetch 拿到假 JSON
  - network mock → 图片/文档被 redirect
- 一期不做 e2e 自动化(Chrome 扩展 e2e 成本高),列入 roadmap

## 目录结构(规划)

```
packet-swapper/
├── manifest.json
├── vite.config.ts
├── package.json
├── src/
│   ├── core/         # 纯逻辑:编译器、匹配器、类型
│   ├── background/
│   ├── content/      # content-iso, content-main
│   ├── popup/
│   └── options/
├── tests/            # vitest 单测
└── docs/
```

## Manifest 权限

- `declarativeNetRequest`、`declarativeNetRequestWithHostAccess`
- `storage`
- `host_permissions: ["<all_urls>"]`
- content_scripts 声明两条(iso + main world)

## Roadmap(后续)

- ModHeader 配置导入兼容
- e2e 自动化(Playwright + 扩展加载)
- 云同步 / 配置分享
- 请求日志面板
