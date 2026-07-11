# Monitor Choice — 当前架构

> 最后核对：2026-07-11 · Vite workspace 迁移完成

## 加载顺序与全局依赖

`index.html` 只加载 `entry.js`。Vite 按下表顺序执行 side-effect imports，现有业务 IIFE 继续暴露相同全局接口；`entry.js` 在依赖全部注册后统一调用 `init()`，避免 ES module deferred 时序改变页面行为。

| # | 文件 | 定义的全局 | 角色 |
|---|------|-----------|------|
| 1 | `js/platform.js` | `window.ToolboxI18n` | workspace theme/nav/i18n adapter + 手动启动标记 |
| 2 | `@toolbox/nav/nav-bar.js` | `window.ToolboxNav` | 共享导航栏 workspace runtime |
| 3 | `js/theme.js` | `window.ThemeManager` | Canvas 主题 (init/toggle/getCanvasBg/getCanvasColor/onChange) |
| 4 | `js/i18n.js` | `window.I18n` | i18n 引擎 (t/setLocale/refreshDOM/translations) |
| 5 | `js/i18n-zh.js` | (mutates I18n.translations.zh) | 中文翻译 |
| 6 | `js/i18n-en.js` | (mutates I18n.translations.en) | 英文翻译 |
| 7 | `js/constants.js` | `window.Constants` | 静态参考数据 (分辨率、色域、面板类型) |
| 8 | `js/calc.js` | ESM exports + `window.Calc` 兼容桥 | 纯数学函数 (PPI/PPD/FOV/THX/SMPTE) |
| 9 | `js/state.js` | `window.AppState` | 响应式状态 + localStorage |
| 10 | `js/data-scenarios.js` | `window.Scenarios` | 场景数据 |
| 11 | `js/data-panels.js` | `window.PanelGuideData` | 面板百科数据 |
| 12 | `js/tab-sharpness.js` | `window.TabSharpness` | 清晰度实验室 Tab |
| 13 | `js/tab-size-view.js` | `window.TabSizeView` | 尺寸与距离 Tab (含 3D 场景) |
| 14 | `js/tab-color-lab.js` | `window.TabColorLab` | 色彩空间 Tab (CIE 1931) |
| 15 | `js/tab-scenarios.js` | `window.TabScenarios` | 场景推荐 Tab |
| 16 | `js/tab-panel-guide.js` | `window.TabPanelGuide` | 面板百科 Tab |
| 17 | `script.js` | `window.switchTab`, `window.MonitorChoice` | 入口/编排器；由 `entry.js` 显式启动 |

> ⚠️ 注意: 原 TASKS.md 提到的 `window.PanelRegistry` 和 `window.State` 在此代码库中不存在。实际等价物是 `window.PanelGuideData` 和 `window.AppState`。

## 模块依赖图

```mermaid
graph TD
  subgraph shared["共享 (repo-level)"]
    platform[platform.js] -->|ToolboxTheme| toggle[@toolbox/theme]
    platform -->|ToolboxI18n| i18ncore[@toolbox/i18n]
    toggle --> navbar[@toolbox/nav]
  end

  subgraph data["数据层 (无依赖)"]
    const[constants.js]
    calc[calc.js]
    dscen[data-scenarios.js]
    dpan[data-panels.js]
  end

  subgraph infra["基础设施"]
    theme[theme.js]
    i18n[i18n.js]
    state[state.js]
    i18nzh[i18n-zh.js] --> i18n
    i18nen[i18n-en.js] --> i18n
  end

  subgraph tabs["Tab 控制器"]
    tsharp[tab-sharpness.js]
    tsize[tab-size-view.js]
    tcolor[tab-color-lab.js]
    tscen[tab-scenarios.js]
    tpanel[tab-panel-guide.js]
  end

  subgraph entry["入口"]
    main[script.js]
  end

  tsharp --> const
  tsharp --> calc
  tsharp --> state
  tsharp --> i18n
  tsharp --> theme

  tsize --> const
  tsize --> calc
  tsize --> state
  tsize --> i18n
  tsize --> theme

  tcolor --> const
  tcolor --> i18n
  tcolor --> theme

  tscen --> dscen
  tscen --> const
  tscen --> calc
  tscen --> state
  tscen --> i18n
  tscen -->|switchTab| main

  tpanel --> dpan
  tpanel --> const
  tpanel --> calc
  tpanel --> i18n

  main --> const
  main --> state
  main --> i18n
  main --> tsharp
  main --> tsize
  main --> tcolor
  main --> tscen
  main --> tpanel
```

## 各文件职责

### 共享层 (workspace packages)

- **`js/platform.js`** — 直接导入 `@toolbox/theme/toggle.js`、`@toolbox/nav/nav-bar.css` 与 `@toolbox/i18n/core`，桥接本应用的 Canvas 主题通知和翻译表。
- **`@toolbox/nav/nav-bar.js`** — 从 workspace 依赖进入 Vite bundle，自挂载到 `#toolbox-nav`；应用目录不再保存副本。

### 基础设施

- **theme.js** — Canvas 主题管理器。暴露 `window.ThemeManager` (init/toggle/getStoredTheme/getCanvasBg/getCanvasColor/onChange)。共用 `toolbox-theme` key。提供 `getCanvasBg()`/`getCanvasColor(name)` 供 Canvas 绘制读取 CSS 变量。
- **i18n.js** — i18n 引擎。暴露 `window.I18n` (t/setLocale/getLocale/onChange/init/refreshDOM)。遍历 DOM 中 `data-i18n` 属性并由共享 core 驱动，使用全局 `toolbox-lang`。
- **i18n-zh.js / i18n-en.js** — 翻译数据，填充 `window.I18n.translations.{zh,en}`。
- **constants.js** — 静态参考数据：分辨率列表、宽高比、CIE 1931 光谱轨迹、面板类型、接口带宽阈值。零 DOM 依赖。
- **calc.js** — 纯数学函数：`computePPI`, `computePPD`, `computeRetinaDistance`, `resolveDimensions`, `computeHorizontalFOV`, `computeTHXDistance`, `computeSMPTERange`, `computeInterfaceBandwidth`, `computeDeskConstraint`。提供 named ESM exports，并保留 `window.Calc` 兼容桥供现有 Tab 使用。
- **state.js** — 响应式状态存储。暴露 `window.AppState` (get/set/batch/onChange/savePreferences/loadPreferences)。6 个持久化 key: `distance`, `size`, `resolution`, `workPercentage`, `mediaPercentage`, `deskDepth`。Pub/sub 模式。

### 数据

- **data-scenarios.js** — 9 个使用场景的参考数据（推荐尺寸/PPI/PPD 范围、文案）。
- **data-panels.js** — 面板技术百科（IPS/VA/TN/OLED/Mini-LED、烧屏、刷新率对比）。

### Tab 控制器

所有 Tab 暴露 `{init(), destroy()}` 模式。`script.js` 在切换 Tab 时调用旧 Tab 的 `destroy()` 和新 Tab 的 `init()`，确保同一时间只有一个 Tab 活跃。

- **tab-sharpness.js** — PPI/PPD 计算 + 清晰度仪表盘 Canvas + 文字对比模拟 Canvas。
- **tab-size-view.js** — 尺寸/FOV/THX/SMPTE 统计 + 2D 对比 Canvas + 伪 3D 桌面场景 Canvas（含拖拽）。
- **tab-color-lab.js** — CIE 1931 色度图 Canvas + 色域三角 + 面板对比表。
- **tab-scenarios.js** — 场景卡片 + 筛选，点击"应用"自动选分辨率并跳转到相关 Tab。
- **tab-panel-guide.js** — 面板技术手风琴 + 接口带宽实时计算器。

### 入口

- **entry.js** — Vite 单入口，固定全局依赖顺序，完成 ThemeManager → I18n → platform bridge → MonitorChoice 启动。
- **script.js** — 编排器：初始化分辨率选择器、同步输入控件与 AppState、绑定 Tab 导航、保存/清除。实现懒 Tab 生命周期（切换时 destroy → init）。
- **styles.css** — 唯一 CSS 入口；六个业务样式必须由 Vite 构建期内联到 hashed CSS，禁止在产物中保留指向源码目录的相对 `@import`。

## 死代码

| 函数/逻辑 | 位置 | 原因 |
|-----------|------|------|
| `Calc.computeTextComfort` + `Calc.clamp` | `calc.js` | 导出但从未被任何 Tab 调用 |
| `scenario.relatedTabs` | `tab-scenarios.js` | 引用此字段但 `data-scenarios.js` 中没有任何场景定义 `relatedTabs` |
| `workPercentage` / `mediaPercentage` | `state.js` → `script.js` | 仅用于滑块 UI 显示，未输入任何计算 |

## 可提取的纯函数 (适合单元测试)

| 来源文件 | 函数 | 说明 |
|----------|------|------|
| `calc.js` | 全部 10 个函数 | 零 DOM、零 I/O，完全可测 |
| `state.js` | `createStore(initial, configKeys)` | 提取工厂函数，mock 存储 |
| `i18n.js` | `translate(t9n, locale, key, params)` | 纯翻译查找 + 插值 |
| `tab-sharpness.js` | `findAltResolution`, `ppdLabel`, `ppdColor` | 纯逻辑 |
| `tab-size-view.js` | `project3d(point, camera)` | 3D→2D 投影 (纯数学) |
| `tab-color-lab.js` | `chromaticityToPx(x, y, box)` | CIE 坐标→像素 |
| `tab-scenarios.js` | `pickResolutionForScenario(scenario, Resolutions, Calc)` | 场景→分辨率匹配 |
| `tab-panel-guide.js` | `classifyInterfaces(bw, thresholds)` | 带宽→接口兼容性 |

## ES Modules 状态

当前采用低风险的过渡结构：Vite 负责依赖图、hashed assets、base path 和 CI；`calc.js` 已成为显式 ESM，其他业务文件仍用原 IIFE API。这样可以逐个建立测试边界，不在同一阶段重写 Canvas 生命周期。

后续只有在测试边界足够时再逐步把 `AppState`、数据和 Tab 控制器改为显式 exports；不要求一次性移除全部全局变量。`window.Calc` 要等所有 Tab 改用 import 后再删除。

### 关键风险

- **启动顺序**：`entry.js` 的 import 顺序属于运行时契约，已有 smoke test 固定，不能随意排序。
- **Canvas 主题**：共享 Nav 的主题按钮必须委托 `ThemeManager.toggle()`，确保活跃 Canvas 收到重绘通知。
- **全局拆分**：提取模块时保持 Tab 的 `init()/destroy()` 生命周期，避免重复监听器和 resize handler。

## 总结

| 指标 | 数值 |
|------|------|
| Vite 入口 | 1 (`entry.js`) |
| workspace 共享依赖 | theme / nav / i18n |
| 全局变量 | 14 |
| 纯函数可提测 | ~25 个 |
| 自动化测试 | 17 个 Node tests + 1 个生产浏览器 smoke |
| 生产输出 | `dist/`，base `/monitor-choice/` |
