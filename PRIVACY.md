# 隐私政策 / Privacy Policy — 调包专家 (Packet Swapper)

最后更新：2026-07-15

## 中文

调包专家（Packet Swapper，以下称"本扩展"）是一个面向开发者的本地调试工具。我们高度重视你的隐私。

**本扩展不收集、不存储、不传输任何个人数据。**

- **不收集数据**：本扩展不会采集你的浏览记录、请求内容、页面内容、个人信息或任何其他数据。
- **不上传数据**：本扩展没有任何服务器，不会将任何数据发送到开发者或第三方。
- **本地存储**：你创建的方案与规则（header 规则、mock 规则等）仅通过 Chrome 的 `chrome.storage.local` 保存在你本机的浏览器中，不会离开你的设备。你可随时在扩展内删除，或在 Chrome 中卸载扩展以清除全部数据。
- **无远程代码**：本扩展的全部代码随安装包打包，不从远程加载或执行任何代码。
- **权限用途**：本扩展申请的 `declarativeNetRequest`、`declarativeNetRequestWithHostAccess`、`storage` 权限及 `<all_urls>` 访问权限，仅用于按你本地配置的规则修改 HTTP 请求/响应头、以及在页面内返回你自定义的 mock 响应。这些操作全部在你本地完成。

本扩展开源，代码可供审阅：https://github.com/GonsonInter/packet-swapper

如对本隐私政策有疑问，可在上述仓库提交 issue。

## English

Packet Swapper ("the Extension") is a local developer debugging tool. We take your privacy seriously.

**The Extension does not collect, store, or transmit any personal data.**

- **No data collection**: The Extension does not collect your browsing history, request contents, page contents, personal information, or any other data.
- **No data transmission**: The Extension has no server and sends no data to the developer or any third party.
- **Local storage only**: The profiles and rules you create (header rules, mock rules, etc.) are stored solely in your browser via Chrome's `chrome.storage.local` and never leave your device. You can delete them within the Extension at any time, or uninstall the Extension to remove all data.
- **No remote code**: All code ships within the package; nothing is loaded or executed remotely.
- **Permissions**: The `declarativeNetRequest`, `declarativeNetRequestWithHostAccess`, `storage` permissions and `<all_urls>` host access are used solely to modify HTTP request/response headers and return your custom mock responses according to your local configuration. All of this happens locally.

The Extension is open source and available for review: https://github.com/GonsonInter/packet-swapper

For questions about this policy, please open an issue in the repository above.
