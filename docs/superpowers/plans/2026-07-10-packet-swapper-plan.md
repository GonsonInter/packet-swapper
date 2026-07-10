---
title: 调包专家 (packet-swapper) 实现计划
date: 2026-07-10
status: Draft
---

# 调包专家 (packet-swapper) 实现计划

## Overview

做一个 Chrome MV3 扩展,作为 ModHeader 的干净替代:改请求头/响应头、按 URL 生效、多 profile 切换,并额外支持 mock 请求返回(页面内 fetch/XHR + 网络层 redirect 两种)。React + Vite 构建,核心纯逻辑用 TDD 覆盖。

设计文档见 `docs/superpowers/specs/2026-07-10-packet-swapper-design.md`。

## Current State

空仓库(仅 git init + .gitignore + 设计文档)。环境:node v24.10.0、npm 11.6.1、Chrome 已装于 `/Applications/Google Chrome.app`。

## Desired State

`npm run build` 产出 `dist/`,Chrome「加载已解压的扩展程序」选 `dist/` 即可用:
- popup 里总开关 + 勾选 profile
- options 里编辑 header/mock 规则、增删 profile、导入导出 JSON
- 改 header 通过 DNR 实时生效;page mock 拦截页面 fetch/XHR 返回假响应
- `npm test` 全绿(核心纯逻辑单测)

## Key Discoveries

- **MV3 只能用 declarativeNetRequest 改 header**,老的 blocking webRequest 已移除。`modifyHeaders` 动作支持 `set/append/remove`,分别作用于 `requestHeaders`/`responseHeaders`。
- **动态规则**用 `chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules })` 全量替换;规则 id 需为正整数。
- **world: "MAIN" content script**(Chrome 111+)可在 manifest `content_scripts[].world` 声明,能直接改页面的 `window.fetch`;但拿不到 `chrome.*`,需 ISOLATED world 脚本经 `window.postMessage` 转发配置。
- **CRXJS 对 MAIN world 支持不稳**,故采用 Vite 多入口 + 自写拷贝插件,manifest 手写。
- **网络层 mock** 用 DNR `redirect` 到 `data:` URL,受 URL 长度限制,仅作补充。

## What We're NOT Doing(一期)

- ModHeader 配置格式导入兼容
- e2e 自动化(Playwright 加载扩展)
- 云同步 / 配置分享 / 请求日志面板
- Firefox 兼容

## Implementation Phases

### Phase 0: 脚手架与构建
**Goal:** `npm run build` 产出可加载的空壳扩展,`npm test` 能跑。

**Changes:**
- `package.json`:deps `react` `react-dom`;devDeps `vite` `@vitejs/plugin-react` `typescript` `vitest` `@types/chrome` `@types/react` `@types/react-dom`
- `vite.config.ts`:多入口(background / content-iso / content-main / popup / options),output 到 `dist/`,content 脚本打成 IIFE 单文件
- 自写小插件 `scripts/copy-manifest.ts`:build 后把 `manifest.json` + 图标拷进 `dist/`
- `manifest.json`:MV3,权限 `declarativeNetRequest` `declarativeNetRequestWithHostAccess` `storage`,`host_permissions: ["<all_urls>"]`,声明两条 content_scripts(iso ISOLATED / main MAIN,均 document_start),background service worker,popup,options
- `tsconfig.json`、`vitest.config.ts`
- 占位入口文件(空 background、空 popup/options React 挂载)+ 占位图标

**Verification:**
- [ ] Automated: `npm run build` 成功,`dist/manifest.json` 存在
- [ ] Manual: Chrome load unpacked `dist/` 无报错,能看到扩展图标、点开 popup 空白页

**Success Criteria:** 空壳扩展能加载,构建/测试脚手架就绪。

### Phase 1: 类型 + storage 层 + 规则编译器(TDD)
**Goal:** 核心纯逻辑完成并单测全绿。

**Changes(先写测试,看失败,再实现):**
- `src/core/types.ts`:`Profile` `HeaderRule` `MockRule` `RootState`
- `tests/compileHeaderRules.test.ts` → `src/core/compileHeaderRules.ts`
  - 启用 profile 的启用 headerRules → DNR modifyHeaders 规则
  - set/append/remove 映射;request→requestHeaders,response→responseHeaders
  - urlFilter 空→`"*"`,非空透传;稳定递增 id
  - 覆盖:禁用项跳过、空 name 跳过+warn、多 profile 叠加
- `tests/compileNetworkMocks.test.ts` → `src/core/compileNetworkMocks.ts`
  - mode=network 的 mockRule → DNR redirect 到 data URL(base64 body + content-type)
- `tests/matchMockRule.test.ts` → `src/core/matchMockRule.ts`
  - page 模式:按 urlPattern(子串/通配)+ method 匹配,返回命中规则或 null
- `tests/serialize.test.ts` → `src/core/serialize.ts`
  - 导出/导入 JSON 往返一致;导入非法结构报错
- `src/core/storage.ts`:`chrome.storage.local` 读写封装(get/set RootState,默认值)

**Verification:**
- [ ] Automated: `npm test` 全绿,覆盖上述所有分支
- [ ] Manual: 无

**Success Criteria:** 所有核心纯函数测试通过,storage 封装就绪。

### Phase 2: background(应用 DNR 规则)
**Goal:** 改 storage → header/network-mock 规则实时生效。

**Changes:**
- `src/background/index.ts`:
  - 启动 + `chrome.storage.onChanged` → 读 RootState → `compileHeaderRules` + `compileNetworkMocks` 合并 → `updateDynamicRules`(removeRuleIds 用现有规则 id)
  - `globalEnabled=false` → 清空动态规则
  - 超 DNR 上限 → 截断 + 写一个 warning 标记到 storage(供 options 读)

**Verification:**
- [ ] Automated: 编译逻辑已在 Phase 1 覆盖;此处逻辑薄
- [ ] Manual: 手动往 storage 塞一条 header 规则(或等 Phase 4 后),访问测试页,devtools Network 看到 header 被改

**Success Criteria:** storage 变化能驱动 DNR 规则更新,header 真实生效。

### Phase 3: content scripts(page mock)
**Goal:** 页面 fetch/XHR 命中规则时返回假响应。

**Changes:**
- `src/content/content-iso.ts`(ISOLATED):读 storage 里 page 模式 mock 规则,`postMessage({source:'packet-swapper', mocks})`;`onChanged` 重发
- `src/content/content-main.ts`(MAIN, document_start):
  - 监听 message 缓存 mocks
  - 包裹 `window.fetch`:`matchMockRule` 命中 → `await sleep(delayMs)` → 返回 `new Response(body,{status,headers})`;否则原始 fetch
  - 包裹 `XMLHttpRequest`:重写 open/send,命中则伪造 status/responseText 并按序触发 readystatechange/load 事件;否则透传
- `matchMockRule` 复用 Phase 1,打进 main bundle

**Verification:**
- [ ] Automated: `matchMockRule` 已覆盖
- [ ] Manual: 测试页 `fetch('/api/x')` 拿到假 JSON;`new XMLHttpRequest()` 同样拿到假响应;delay 生效

**Success Criteria:** 页面内 API mock 可用,含延迟。

### Phase 4: options 管理页
**Goal:** 可视化编辑全部配置。

**Changes:**
- `src/options/`:React 页面
  - 左:profile 列表(新建/删除/重命名/选中),`storage` 读写
  - 右 tab:`Headers` 表(开关/target/action/name/value/urlFilter,行内增删) + `Mock` 表(开关/urlPattern/method/mode/status,展开编辑 headers/body/delay)
  - 顶部:读 background 写的 warning 标记并提示;导入/导出 JSON 按钮
  - network 模式 body 过大时该行标黄提示

**Verification:**
- [ ] Automated: 无(UI)
- [ ] Manual: 增删改 profile/规则后刷新页面配置持久;改 header 后验收 Network;导入导出 JSON 往返一致

**Success Criteria:** 全部配置可在 UI 完成,持久化正确。

### Phase 5: popup
**Goal:** 快速开关与 profile 切换。

**Changes:**
- `src/popup/`:React
  - 全局总开关(写 `globalEnabled`)
  - profile 列表复选框(写 `enabled`)
  - "打开管理页"按钮(`chrome.runtime.openOptionsPage()`)

**Verification:**
- [ ] Automated: 无
- [ ] Manual: popup 勾选变化即时影响生效规则(配合 background)

**Success Criteria:** popup 能快速启停与切 profile。

### Phase 6: 收尾与整体验收
**Goal:** README + 全链路手动验收。

**Changes:**
- `README.md`:安装(load unpacked)、构建、用法、已知限制(MV3 响应头/CORS 限制)
- 真实图标(简单画一个)
- `tests/` 补齐遗漏分支

**Verification:**
- [ ] Automated: `npm run build` + `npm test` 全绿
- [ ] Manual: 五项全链路 —— 改请求头 / 改响应头 / 按 URL 生效 / 多 profile 叠加 / page mock + network mock,逐一在 Chrome 验证

**Success Criteria:** 五个功能在真实 Chrome 全部可用,文档齐备。

## Testing Strategy

- **单元测试(vitest)**:Phase 1 的 `compileHeaderRules`/`compileNetworkMocks`/`matchMockRule`/`serialize` 全分支覆盖,TDD 先写后实现。
- **手动验收**:每个 phase 末尾在真实 Chrome 验证;Phase 6 做一次五功能全链路。
- 不做 e2e 自动化(成本高,列 roadmap)。

## Risks

- **MV3 响应头/CORS 限制**:部分响应头(尤其 CORS 预检相关)DNR 改不到,或需精确 host 权限。缓解:README 明确记为已知限制,验收时区分"扩展 bug"与"平台限制"。
- **XHR mock 伪造事件序列易错**:readyState/事件顺序不对会让页面逻辑异常。缓解:严格按 0→1→2→3→4 与 load 事件顺序,拿真实站点回归。
- **world: MAIN 注入时机**:document_start 时页面脚本可能已缓存原始 fetch。缓解:content-main 必须最早注入并覆盖引用;验收阶段用早发请求的页面测试。
- **data URL mock 长度上限**:大 body 网络层 mock 失败。缓解:UI 标黄引导改用 page 模式。
