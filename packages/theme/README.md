# @toolbox/theme

Toolbox 的框架无关主题契约。当前契约 v2 提供三套双模式配色族（Catppuccin 默认、Gruvbox、Solarized）、共享语义 token、`data-theme-family` 族机制、首屏 pre-paint 和 Vanilla runtime。

## 使用

```js
import '@toolbox/theme/styles.css'
import '@toolbox/theme/toggle.js'
import {
  DEFAULT_THEME,
  SEMANTIC_COLOR_TOKENS,
  THEME_STORAGE_KEY,
} from '@toolbox/theme/contract'
```

- 样式消费语义 token，例如 `--color-bg`、`--color-text`、`--color-border`、`--color-primary` 和 `--color-ring`。
- `styles.css` = token 层 + 共享元素基线；`tokens.css` 只含 token 层。受 Tailwind preflight
  等全局样式约束、不能接受元素基线的应用，应只引入 `tokens.css`。
- 调色板族通过 `data-theme-family` 表达，`ToolboxTheme.getThemeFamily/setThemeFamily`
  读写 `toolbox-theme-family`。族只覆盖原始 `--ctp-*` 层，语义别名自动跟随；当前内置
  `catppuccin`（默认）、`gruvbox`、`solarized`，均为双模式族。族与模式的组合必须通过
  契约测试中的 WCAG 对比度门禁。
- runtime 暴露 `window.ToolboxTheme.getTheme/setTheme/toggleTheme/prePaintScript`。
- 全局偏好只写 `localStorage['toolbox-theme']`，并同步到 `<html data-theme="dark|light">`。
  该键的值域只有 `dark|light`；“跟随系统”等扩展模式保存在应用私有命名空间。
- 没有有效保存值时遵循系统浅色偏好，否则默认深色。

应用可以保留业务级 token 映射，但不得复制主题解析、创建第二个全局 storage key，或重新定义共享 token 的语义。

## 兼容性

- 新增 token 或 runtime 方法属于兼容性扩展。
- 删除/改名 token，改变 storage key、主题值、DOM 属性或既有方法语义属于 breaking change。
- 改变现有颜色值虽然不一定破坏 API，也属于视觉变更，必须执行全应用视觉矩阵。
- 共享包版本与逐应用迁移按 [依赖与回滚策略](../../docs/DEPENDENCIES.md) 管理。

## 验证

```bash
pnpm --filter=@toolbox/theme test
pnpm --filter=@toolbox/theme lint
```

包级测试会校验深浅色都提供完整 token、Catppuccin 基准色未意外漂移，以及 storage、DOM、fallback 和 pre-paint 行为。
