# RateLens — 实施计划

> 对应规格书: [spec.md](./spec.md) | 任务追踪: [../TASKS.md](../TASKS.md)
> 日期: 2026-07-08 | 状态: 规划完成，等待执行

---

## 测试策略总览

```
Task 1 (基础设施) → Gate 1: dev 能启动 + build 无错误
     ↓
Task 2 (数据+计算) → Gate 2: Vitest 全部通过（约 30 用例）
     ↓
Task 3 (通用组件) → Gate 3: build 无错误 + 组件可渲染
     ↓
Task 4 (正算模块) → Gate 4: build 通过 + 手动验证 3 个 case
     ↓
Task 5 (反推模块) → Gate 5: build 通过 + 手动验证 2 个 case
     ↓
Task 6 (组装 App) → Gate 6: 全量测试 + 手动 7 项检查
     ↓
Task 7 (视觉打磨) → Gate 7: 4 断点响应式 + 主题切换
     ↓
Task 8 (部署准备) → Gate 8: build + preview 全功能验证
```

> **硬性规则：Gate 未通过，禁止进入下一个 Task。**

---

## Task 1: 项目初始化与基础设施

**预估:** 30 min | **产出:** 可运行的空白项目 + 主题变量 + shadcn/ui + Vitest

### Steps

1. `npx create-vite@latest ./ --template react-ts` 创建项目
2. 安装依赖: `tailwindcss @tailwindcss/vite`, `vitest @testing-library/react @testing-library/jest-dom jsdom`
3. 配置 `vite.config.ts`（React 插件 + Tailwind 插件 + `@/` 路径别名）
4. 配置 `vitest.config.ts`（jsdom 环境 + 路径别名 + setup 文件）
5. 创建 `src/__tests__/setup.ts`（`@testing-library/jest-dom`）
6. 创建 `src/index.css`（Catppuccin Frappe/Latte 完整 CSS 变量 + Tailwind `@import`）
7. `npx shadcn@latest init` + 安装组件: `button input card collapsible badge separator tooltip select`
8. 创建 `src/lib/utils.ts`（`cn()`, `formatNumber`, `formatPercent`, `formatDiscount`, `parseNum`）
9. `package.json` 添加 `"test": "vitest run"` 和 `"test:watch": "vitest"`
10. `git init && git checkout -b main` + 初始 commit

### Gate 1

- [ ] `npm run dev` 成功，页面背景为 `#303446`
- [ ] `npm run build` 无 TypeScript 错误
- [ ] `npx vitest run` 可执行（不报配置错误）

---

## Task 2: 数据层、计算逻辑与单元测试

**预估:** 2 h | **产出:** 类型定义 + 模型数据 + 正/反算函数 + 3 个 hooks + 4 组测试（~30 用例）

### Steps

1. `src/types/index.ts` — `ModelPricing`, `ModelProvider`, `ForwardResult`, `ReverseRowResult`, `AppState` 等类型
2. `src/data/models.ts` — Claude (5) + GPT/Codex (6) 完整定价数据 + `findModelPricing()`
3. `src/calc/forward.ts` — `calcForward()` + `calcPriceCell()`
4. `src/calc/reverse.ts` — `calcReverse()`（含 verdict 判定逻辑）
5. `src/hooks/use-local-storage.ts` — 泛型 localStorage 封装
6. `src/hooks/use-exchange-rate.ts` — 自动获取汇率 + 手动输入 + 多 API fallback **（⚠️ 注意 useCallback 依赖 `defaultRate` 可能引发重取循环）**
7. `src/hooks/use-theme.ts` — Dark/Light 切换 + 系统偏好检测 + localStorage 持久化
8. `npm install lucide-react`
9. 编写 4 组测试:

| 测试文件 | 用例数 | 覆盖 |
|----------|--------|------|
| `utils.test.ts` | 13 | formatNumber / formatPercent / formatDiscount / parseNum |
| `models.test.ts` | 9 | 数据完整性 / Claude vs GPT 差异 / findModelPricing |
| `forward.test.ts` | 8 | calcForward 5 场景 + calcPriceCell 3 场景 |
| `reverse.test.ts` | 8 | 多维度 / null 处理 / 比例=0 / cheaper/expensive 判定 |

### Gate 2

- [ ] `npx vitest run` — 全部约 30 用例通过
- [ ] `npm run build` — 无 TypeScript 错误

---

## Task 3: 布局与通用组件

**预估:** 2 h | **产出:** 页面骨架 + 8 个通用组件 + 临时 App.tsx 组装验证

### Steps

1. `src/components/layout/Header.tsx` — 标题 "RateLens" + Moon/Sun 主题切换
2. `src/components/layout/Footer.tsx` — "零追踪 · 纯前端 · MIT"
3. `src/components/GlossaryPanel.tsx` — shadcn Collapsible + 8 个术语卡 + 底部说明框
4. `src/components/ModeSwitcher.tsx` — 胶囊双按钮（正算/反推）
5. `src/components/StepIndicator.tsx` — 三步圆形序号 + 模式感知文本
6. `src/components/PresetButtons.tsx` — 4 个胶囊（反推模式仅 2 个充值预设）
7. `src/components/FundingInputs.tsx` — 充值/到账双输入框
8. `src/components/ExchangeRateDisplay.tsx` — 只读显示 + 手动编辑切换
9. 编写临时 `App.tsx` 渲染全部组件（hardcoded props），验证不崩溃
10. `git commit`

### Gate 3

- [ ] `npm run build` — 无类型错误
- [ ] `npm run dev` — 所有组件可见不崩溃
- [ ] 主题切换工作（dark ↔ light）
- [ ] 名词解释可展开/折叠
- [ ] `npx vitest run` — 无回归

---

## Task 4: 倍率正算模块

**预估:** 2.5 h | **产出:** 分组倍率输入 + 三卡结果 + 结论面板 + 价格表

### Steps

1. `src/components/ForwardCalculator.tsx` — 分组倍率输入 + `useMemo` 计算编排 + 子组件组合
2. `src/components/ForwardResultCards.tsx` — 三卡（充值比例·绿 / 等效倍率·蓝 / 占官方成本·黄）
3. `src/components/ConclusionPanel.tsx` — 渐变边框结论面板
4. `src/components/ModelProviderSelector.tsx` — Claude / GPT & Codex 胶囊切换
5. `src/components/PriceTable.tsx` — 响应式表格（语义化 pill 色 / null 显示"按输入价计费" / 移动端水平滚动）
6. 更新 `App.tsx`，正算模式渲染完整 UI 流（**增量修改，不重写**）
7. `git commit`

### Gate 4

- [ ] `npm run build` 通过
- [ ] `npx vitest run` 无回归
- [ ] 手动 Case 1: `100/100/1.1` → 充值比例 `1.0` → 等效 `1.1` → 占官方 `~15.3%`
- [ ] 手动 Case 2: `100/50/0.6` → 充值比例 `2.0` → 等效 `1.2` → 占官方 `~16.7%`
- [ ] 手动 Case 3: 点预设 → 数据填充 → 结果实时更新
- [ ] Claude ↔ GPT 切换价格表正确
- [ ] 未填写时显示引导文本

---

## Task 5: 扣费反推模块

**预估:** 2 h | **产出:** 反推输入 UI + 结果卡列表 + 汇总行

### Steps

1. `src/components/ReverseCalculator.tsx` — 模型选择器（Claude/GPT 分组）+ 实付输入 + 缓存展开 + `useMemo` 计算
2. `src/components/ReverseResultCards.tsx` — 维度结果卡（badge + 倍率数字 + 计算明细）+ 底部汇总
3. 更新 `App.tsx`，反推模式渲染完整 UI 流（**增量修改**）
4. `git commit`

### Gate 5

- [ ] `npm run build` 通过
- [ ] `npx vitest run` 无回归
- [ ] 手动 Case 1: 反推模式 → 100/100 → Opus 4.8 → 输出 ¥25 → 倍率 `1.0` → badge "便宜 86.1%"
- [ ] 手动 Case 2: GPT-5.5 → 缓存写入 ¥10 → 显示"不适用"
- [ ] 正算 ↔ 反推 UI 正确切换，充值/到账金额共享
- [ ] 缓存项可展开/折叠

---

## Task 6: 组装 App 与状态管理

**预估:** 1.5 h | **产出:** 最终 App.tsx + localStorage 持久化 + favicon + SEO meta

### Steps

1. 清理 `App.tsx` 临时渲染代码，连接 `useLocalStorage`/`useExchangeRate`/`useTheme` 统一管理
2. 创建 `public/favicon.svg`（lens/magnifier + Catppuccin blue）
3. 更新 `index.html` title 和 meta description
4. 添加 `<ErrorBoundary>` 根级包裹
5. `git commit`

### Gate 6（最重要）

- [ ] `npx vitest run` 全部通过
- [ ] `npm run build` 成功
- [ ] 手动 1: 正算完整流程 — 100/100/1.1 → 三卡正确 → 价格表正确
- [ ] 手动 2: 反推完整流程 — 选模型 → 输入实付 → 结果正确 → badge 颜色正确
- [ ] 手动 3: 预设按钮 — 点击后表单填充 + 结果实时更新
- [ ] 手动 4: 主题切换 — dark ↔ light 全部颜色正确
- [ ] 手动 5: 数据持久化 — 刷新后输入值 + 模式 + 价格表全部恢复
- [ ] 手动 6: 名词解释可展开折叠
- [ ] 手动 7: 控制台无 React 错误

---

## Task 7: 视觉打磨与响应式优化

**预估:** 1.5 h | **产出:** 卡片微光 + 动画 + 自定义滚动条 + 响应式精调

### Steps

1. 卡片微光效果（`::before` pseudo-element + radial-gradient）
2. 移动端价格表水平滚动优化（渐变遮罩指示器）
3. 过渡动画（模式切换 / 数值变化 / 卡片 hover）
4. 自定义滚动条样式（`::-webkit-scrollbar`）
5. 4 个断点响应式精调（375 / 768 / 1024 / 1440）
6. `git commit`

### Gate 7

- [ ] `npm run build` + `npx vitest run` 无回归
- [ ] 375px: 单列，价格表可滚动，无文字溢出
- [ ] 768px: 输入区 2 列，结果卡 2-3 列
- [ ] 1024px: 多列，`max-w-4xl` 生效
- [ ] 1440px: 居中 + 两侧边距
- [ ] Dark → Light 全部元素颜色正确
- [ ] 卡片 hover 抬起效果
- [ ] 价格表移动端滚动指示

---

## Task 8: 最终验证与部署准备

**预估:** 30 min | **产出:** v1.0.0 tag + dev 分支

### Steps

1. `npx vitest run` — 全量通过
2. `npm run build` — 成功生成 `dist/`
3. `npm run preview` — 全功能验证
4. `git commit && git tag v1.0.0`
5. `git checkout -b dev`

### Gate 8

- [ ] 全量测试通过
- [ ] `dist/` 构建成功
- [ ] preview 全功能验证
- [ ] `v1.0.0` tag 已创建
- [ ] `dev` 分支已创建

---

## 验证清单总览

| # | 验证项 | 预期结果 | Gate |
|---|--------|----------|------|
| 1 | 正算: 100/100/1.1 | 比例 1.0, 等效 1.1, 占官方 ~15.3% | G4 |
| 2 | 正算: 100/50/0.6 | 比例 2.0, 等效 1.2, 占官方 ~16.7% | G4 |
| 3 | 预设按钮 | 点击后表单填充 + 结果实时更新 | G4 |
| 4 | 价格表 Claude | 5 行，缓存写入有值 | G4 |
| 5 | 价格表 GPT | 6 行，缓存写入 "—" | G4 |
| 6 | 反推: Opus 4.8 输出 ¥25 | 倍率 1.0, "便宜 86.1%" | G5 |
| 7 | 反推: GPT-5.5 写入 ¥10 | 显示"不适用" | G5 |
| 8 | 主题切换 | dark ↔ light 颜色正确 | G6 |
| 9 | 数据持久化 | 刷新后恢复 | G6 |
| 10 | 移动端 375px | 单列，表格横向滚动 | G7 |
