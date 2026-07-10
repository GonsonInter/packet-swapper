// 注入一小段全局样式，补足内联样式做不到的 hover / focus / 阴影等，用于美化 UI。
const CSS = `
.ps-scope { font-family: system-ui, -apple-system, 'Segoe UI', 'PingFang SC', sans-serif; color: #111827; -webkit-font-smoothing: antialiased; }
.ps-scope *, .ps-scope *::before, .ps-scope *::after { box-sizing: border-box; }
.ps-scope input[type="checkbox"] { cursor: pointer; }

.ps-input {
  border: 1px solid #e5e7eb; border-radius: 6px; padding: 5px 8px;
  font-size: 13px; font-family: inherit; background: #fff; width: 100%;
  outline: none; transition: border-color .12s, box-shadow .12s;
}
.ps-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.ps-input:disabled { background: #f9fafb; color: #9ca3af; }
textarea.ps-input { resize: vertical; line-height: 1.5; }

.ps-btn {
  border: 1px solid #d1d5db; background: #fff; border-radius: 7px;
  padding: 5px 12px; font-size: 13px; font-family: inherit; cursor: pointer;
  color: #374151; transition: background .12s, border-color .12s, color .12s; white-space: nowrap;
}
.ps-btn:hover { background: #f9fafb; border-color: #c3c7ce; }
.ps-btn-primary { background: #2563eb; border-color: #2563eb; color: #fff; }
.ps-btn-primary:hover { background: #1d4ed8; border-color: #1d4ed8; }

.ps-btn-text {
  border: none; background: none; color: #2563eb; padding: 5px 8px;
  font-size: 13px; font-family: inherit; cursor: pointer; border-radius: 6px;
  transition: background .12s; white-space: nowrap;
}
.ps-btn-text:hover { background: #eff6ff; }
.ps-btn-text:disabled { color: #c3c7ce; cursor: not-allowed; background: none; }

/* JSON 编辑器语法高亮（light） */
.ps-json textarea { outline: none; }
.ps-json .token.property { color: #1d4ed8; }
.ps-json .token.string { color: #16a34a; }
.ps-json .token.number { color: #b45309; }
.ps-json .token.boolean, .ps-json .token.null { color: #7c3aed; }
.ps-json .token.punctuation, .ps-json .token.operator { color: #9ca3af; }

.ps-icon-btn {
  border: none; background: none; cursor: pointer; border-radius: 6px;
  width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center;
  color: #9ca3af; font-size: 16px; line-height: 1; transition: background .12s, color .12s;
}
.ps-icon-btn:hover { background: #f3f4f6; color: #374151; }
/* 非默认配置：琥珀色常驻标识 */
.ps-icon-btn.active { color: #d97706; background: #fffbeb; }
.ps-icon-btn.active:hover { background: #fef3c7; color: #b45309; }
/* 菜单打开中：蓝色（覆盖非默认态） */
.ps-icon-btn.open, .ps-icon-btn.active.open { background: #eff6ff; color: #2563eb; }
.ps-icon-btn.danger:hover { background: #fef2f2; color: #dc2626; }

.ps-row { border-bottom: 1px solid #f3f4f6; transition: background .1s; }
.ps-row:hover { background: #fafbfc; }

.ps-menu {
  position: absolute; z-index: 60; background: #fff; border: 1px solid #e5e7eb;
  border-radius: 12px; box-shadow: 0 10px 34px rgba(0,0,0,.14); padding: 12px; width: 230px;
}
.ps-menu-label { font-size: 11px; color: #6b7280; margin: 12px 0 5px; font-weight: 600; }
.ps-menu-label:first-child { margin-top: 0; }

.ps-seg { display: flex; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
.ps-seg button {
  flex: 1; border: none; background: #fff; padding: 6px 16px; font-size: 12px;
  cursor: pointer; color: #374151; border-left: 1px solid #e5e7eb; transition: background .1s;
  white-space: nowrap; line-height: 1.6;
}
.ps-seg button:first-child { border-left: none; }
.ps-seg button:hover { background: #f9fafb; }
.ps-seg button.on { background: #2563eb; color: #fff; }

.ps-card {
  border: 1px solid #e5e7eb; background: #fff; border-radius: 9px; cursor: pointer;
  transition: border-color .12s, background .12s;
}
.ps-card:hover { border-color: #c3c7ce; }
.ps-card.active { border-color: #2563eb; background: #eff6ff; }
`

export function GlobalStyle() {
  return <style>{CSS}</style>
}
