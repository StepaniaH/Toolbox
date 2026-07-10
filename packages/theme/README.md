# @toolbox/theme

Toolbox 的框架无关主题契约。当前 v1 提供 Catppuccin Frappé 深色与 Latte 浅色主题、共享语义 token、首屏 pre-paint 和 Vanilla runtime。

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
- runtime 暴露 `window.ToolboxTheme.getTheme/setTheme/toggleTheme/prePaintScript`。
- 全局偏好只写 `localStorage['toolbox-theme']`，并同步到 `<html data-theme="dark|light">`。
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
