# RateLens — 设计规格书

> 版本: 1.0 | 日期: 2026-07-08 | 状态: 规划完成

## 项目概览

**RateLens** 是一个纯前端的 AI 模型价格倍率计算器，支持"倍率正算"和"扣费反推"两种模式。

| 维度 | 决策 |
|------|------|
| 架构 | React SPA（Vite 构建） |
| UI | shadcn/ui + Tailwind CSS v4 |
| 主题 | Catppuccin Frappe（Dark 默认）/ Latte（Light） |
| 计算 | 全客户端，零后端依赖 |
| 测试 | Vitest 单元测试 |
| 国际化 | 双语 zh-CN / en（MVP 优先中文） |

---

## 一、设计系统

### 1.1 色彩 — Catppuccin Frappe / Latte

采用开源 [Catppuccin](https://catppuccin.com/) 配色（Frappe 深色 / Latte 浅色）。

#### Dark Mode（Catppuccin Frappe · 默认）

| Token | Hex | 用途 |
|-------|-----|------|
| `--base` | `#303446` | 页面背景 |
| `--mantle` | `#292c3c` | 卡片内嵌背景 |
| `--crust` | `#232634` | 最深背景层 |
| `--surface-0` | `#414559` | 卡片背景 |
| `--surface-1` | `#51576d` | 悬浮卡片 |
| `--surface-2` | `#626880` | 输入框背景 |
| `--text` | `#c6d0f5` | 正文 |
| `--subtext-1` | `#b5bfe2` | 次要文本 |
| `--subtext-0` | `#a5adce` | 辅助文本 |
| `--overlay-0` | `#737994` | 占位文本 |
| `--blue` | `#8caaee` | 主强调色 |
| `--mauve` | `#ca9ee6` | 次强调色 |
| `--green` | `#a6d189` | 正向/便宜 |
| `--red` | `#e78284` | 负向/贵 |
| `--yellow` | `#e5c890` | 警告/持平 |
| `--peach` | `#ef9f76` | 高亮数据 |
| `--teal` | `#81c8be` | 汇率显示 |
| `--lavender` | `#babbf1` | 标签/badge |
| `--sapphire` | `#85c1dc` | 链接 |
| `--border-subtle` | `rgba(198, 208, 245, 0.08)` | 卡片边框 |
| `--border-strong` | `rgba(198, 208, 245, 0.16)` | 激活边框 |

#### Light Mode（Catppuccin Latte）

| Token | Hex | 用途 |
|-------|-----|------|
| `--base` | `#eff1f5` | 页面背景 |
| `--mantle` | `#e6e9ef` | 卡片内嵌背景 |
| `--crust` | `#dce0e8` | 最深背景层 |
| `--surface-0` | `#ccd0da` | 卡片背景 |
| `--surface-1` | `#bcc0cc` | 悬浮卡片 |
| `--surface-2` | `#acb0be` | 输入框背景 |
| `--text` | `#4c4f69` | 正文 |
| `--subtext-1` | `#5c5f77` | 次要文本 |
| `--subtext-0` | `#6c6f85` | 辅助文本 |
| `--overlay-0` | `#9ca0b0` | 占位文本 |
| `--blue` | `#1e66f5` | 主强调色 |
| `--mauve` | `#8839ef` | 次强调色 |
| `--green` | `#40a02b` | 正向 |
| `--red` | `#d20f39` | 负向 |
| `--yellow` | `#df8e1d` | 警告 |
| `--peach` | `#fe640b` | 高亮数据 |
| `--teal` | `#179299` | 信息 |
| `--lavender` | `#7287fd` | 标签 |
| `--sapphire` | `#209fb5` | 链接 |
| `--border-subtle` | `rgba(76, 79, 105, 0.10)` | 卡片边框 |
| `--border-strong` | `rgba(76, 79, 105, 0.18)` | 激活边框 |

### 1.2 字体

| 层级 | 字体 |
|------|------|
| UI 文本 | `ui-rounded, "SF Pro Rounded", system-ui, sans-serif` |
| 等宽数字 | `"JetBrains Mono", "SF Mono", ui-monospace, monospace`（金额/倍率） |
| 中文 fallback | `"PingFang SC", "Noto Sans SC"` |

### 1.3 圆角

| Token | 值 | 用途 |
|-------|-----|------|
| `--radius-sm` | `8px` | badge, 输入框 |
| `--radius-md` | `12px` | 卡片内区域 |
| `--radius-lg` | `18px` | 主卡片 |
| `--radius-pill` | `9999px` | 胶囊按钮 |

### 1.4 动效

| 效果 | 参数 | 用途 |
|------|------|------|
| 快速过渡 | `0.2s cubic-bezier(0.4, 0, 0.2, 1)` | hover/focus 状态 |
| 卡片悬浮 | `translateY(-2px)` + `box-shadow` 加深 | 主卡片 hover |
| 数字变化 | CSS `transition` on `color` + `opacity` | 计算结果更新 |
| 模式切换 | `height: auto` + `opacity` fade | 正算 ↔ 反推 |

### 1.5 视觉特征

- **卡片微光**：`radial-gradient(ellipse 60% 30% at 50% 0%, color-mix(in srgb, var(--blue) 4%, transparent), transparent)` 实现顶部微光
- **结论面板**：`linear-gradient` + `border` 突出最终结论
- **数据 Pill**：计算结果以圆角色块呈现，语义着色（绿=便宜 / 黄=持平 / 红=贵）
- **步骤指示器**：圆形数字 badge + 水平排列，标识三步计算流程

---

## 二、项目结构

```
rate-lens/
├── .gitignore
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── index.html
├── components.json                    # shadcn/ui 配置
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css                      # Tailwind + Catppuccin 主题变量
│   ├── lib/
│   │   └── utils.ts                   # cn(), formatNumber, parseNum 等
│   ├── hooks/
│   │   ├── use-theme.ts
│   │   ├── use-local-storage.ts
│   │   └── use-exchange-rate.ts
│   ├── data/
│   │   └── models.ts                  # 模型定价数据
│   ├── calc/
│   │   ├── forward.ts                 # 倍率正算
│   │   └── reverse.ts                 # 扣费反推
│   ├── components/
│   │   ├── ui/                        # shadcn/ui 基础组件
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── card.tsx
│   │   │   ├── collapsible.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── separator.tsx
│   │   │   └── tooltip.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   ├── GlossaryPanel.tsx
│   │   ├── ModeSwitcher.tsx
│   │   ├── StepIndicator.tsx
│   │   ├── FundingInputs.tsx
│   │   ├── ExchangeRateDisplay.tsx
│   │   ├── PresetButtons.tsx
│   │   ├── ForwardCalculator.tsx
│   │   ├── ForwardResultCards.tsx
│   │   ├── ConclusionPanel.tsx
│   │   ├── ReverseCalculator.tsx
│   │   ├── ReverseResultCards.tsx
│   │   ├── ModelProviderSelector.tsx
│   │   └── PriceTable.tsx
│   ├── types/
│   │   └── index.ts
│   └── __tests__/
│       ├── setup.ts
│       ├── utils.test.ts
│       ├── models.test.ts
│       ├── forward.test.ts
│       └── reverse.test.ts
└── docs/
    ├── spec.md                        # 本文件
    └── plan.md                        # 实施计划
```

---

## 三、核心功能

### 3.1 模式一：倍率正算

**输入字段：**

| 字段 | 类型 | 默认值 | 验证 |
|------|------|--------|------|
| 充值金额（¥） | `number` | `""` | `> 0` |
| 到账金额（$） | `number` | `""` | `> 0` |
| 分组倍率 | `number` | `""` | `> 0`, step `0.01` |
| 实时汇率 | `number` | 自动获取，默认 `7.2` | `> 0` |

**计算公式：**

1. **充值比例** = 充值金额 ÷ 到账金额（¥/1$）
2. **1:1 等效分组倍率** = 分组倍率 × 充值比例
3. **占官方成本** = 等效分组倍率 ÷ 实时汇率 × 100%
4. **模型实付价** = 官方 API 价($) × 分组倍率 × 充值比例 → ¥/1M tokens

**快捷预设按钮：**
- `充值100到账100` → recharge=100, arrived=100
- `充值100到账50` → recharge=100, arrived=50
- `倍率 0.6` → groupRate=0.6
- `倍率 1.1` → groupRate=1.1

**价格表（仅正算模式）：**
- 按模型大类切换（Claude / GPT & Codex）
- 列：模型名称 | 上下文窗口 | 输入价 | 缓存写入 | 缓存读取 | 输出价
- 每单元格：实付 ¥ pill（语义色） + 官方 ¥ 划线价 + 计算公式

**Pill 颜色语义：**

| 条件 | 颜色 |
|------|------|
| 实付 < 官方 × 0.8 | `--green` |
| 实付 ≈ 官方 (±20%) | `--yellow` |
| 实付 > 官方 × 1.2 | `--red` |

### 3.2 模式二：扣费反推

**输入字段：**

| 字段 | 类型 | 验证 |
|------|------|------|
| 充值金额（¥） | 同模式一共用 | `> 0` |
| 到账金额（$） | 同模式一共用 | `> 0` |
| 参照模型 | `select` 下拉 | 必选 |
| 输入实付（¥/1M） | `number` | 选填 |
| 输出实付（¥/1M） | `number` | 选填 |
| 缓存写入实付（¥/1M） | `number` | 选填，展开后可见 |
| 缓存读取实付（¥/1M） | `number` | 选填，展开后可见 |

**反推公式：**
- **真实分组倍率** = 实付 ¥ ÷ 官方 $ ÷ 充值比例
- **1:1 等效倍率** = 实付 ¥ ÷ 官方 $
- **占官方成本** = 实付 ¥ ÷ (官方 $ × 汇率)

**结果展示：**
- 每个已填写维度独立结果卡
- Badge：比官方便宜 X% / 比官方贵 X% / 与官方持平
- 底部汇总：平均反推倍率 / 最划算 / 最贵

### 3.3 模型定价数据

#### Claude 系列（Anthropic 官方 API · 2026-07）

| 模型 | 上下文 | 输入 $ | 缓存写入 $ | 缓存读取 $ | 输出 $ |
|------|--------|--------|-----------|-----------|--------|
| Claude Opus 4.8 | 1M | 5 | 6.25 | 0.5 | 25 |
| Claude Opus 4.7 | 1M | 5 | 6.25 | 0.5 | 25 |
| Claude Sonnet 5 | 1M | 2 | 2.5 | 0.2 | 10 |
| Claude Sonnet 4.6 | 1M | 3 | 3.75 | 0.3 | 15 |
| Claude Haiku 4.5 | 200K | 1 | 1.25 | 0.1 | 5 |

> ⚠️ Claude Sonnet 5 限时价至 2026-08-31，之后 $3/$15（需在 UI 中标注）

#### GPT / Codex 系列（OpenAI 官方 API · 2026-07）

| 模型 | 上下文 | 输入 $ | 缓存读取 $ | 输出 $ |
|------|--------|--------|-----------|--------|
| GPT-5.5 | ~1.05M | 5 | 0.5 | 30 |
| GPT-5.4 | ~1.05M | 2.5 | 0.25 | 15 |
| GPT-5.2 | 400K | 1.75 | 0.175 | 14 |
| GPT-5.2 Codex | 400K | 1.75 | 0.175 | 14 |
| GPT-5.1 | 400K | 1.25 | 0.125 | 10 |
| GPT-5.4 mini | 400K | 0.75 | 0.075 | 4.5 |

> GPT 系列无缓存写入项（`null`），缓存读取为输入价的 10%。

### 3.4 名词解释

可折叠面板，术语：

| 术语 | 解释 |
|------|------|
| 充值金额 | 实际花费的人民币金额 |
| 到账金额 | 充值后到账的美元余额 |
| 分组倍率 | 平台对模型分组设置的计费倍数，越低扣费越少 |
| 充值比例 | 充值金额 ÷ 到账金额，即每 1 美元实际成本 |
| 占官方成本 | 实际成本相对于官网价的百分比 |
| 输入 / 输出 | 输入 = 发给模型的内容，输出 = 模型回复，通常输出更贵 |
| 缓存写入 / 读取 | 写入 = 存储可复用内容，读取 = 复用内容，读取更便宜 |
| 1M tokens | 计费用量单位，约一百万个文本片段 |

底部附加"为什么要算最终使用倍率？"说明框。

---

## 四、页面布局

```
┌─────────────────────────────────────────────────────┐
│  Header: RateLens 标题 + 副标题 + 🌓 主题切换       │
├─────────────────────────────────────────────────────┤
│  GlossaryPanel: ▶ 名词解释（可折叠）                 │
├─────────────────────────────────────────────────────┤
│  ModeSwitcher: [倍率正算] [扣费反推] 胶囊            │
├─────────────────────────────────────────────────────┤
│  StepIndicator: ① → ② → ③                          │
├─────────────────────────────────────────────────────┤
│  PresetButtons: 快捷预设                            │
├─────────────────────────────────────────────────────┤
│  FundingInputs + ExchangeRate + 模式专属输入         │
├─────────────────────────────────────────────────────┤
│  ResultCards（Forward or Reverse）                   │
├─────────────────────────────────────────────────────┤
│  ConclusionPanel                                    │
├─────────────────────────────────────────────────────┤
│  ModelProviderSelector + PriceTable（仅正算）        │
├─────────────────────────────────────────────────────┤
│  Footer                                             │
└─────────────────────────────────────────────────────┘
```

**响应式策略：**

| 断点 | 布局 |
|------|------|
| < 768px | 单列堆叠，价格表水平滚动 |
| 768–1024px | 输入区 2 列，结果卡 2–3 列 |
| > 1024px | 输入区多列，`max-w-4xl` 居中 |

---

## 五、全球约束

- **纯前端**：零后端，所有计算客户端完成
- **汇率**：自动获取 + 手动输入双模式，失败默认 7.2（多 API fallback）
- **无构建时计算按钮**：所有结果通过 `useMemo` 实时响应
- **主题**：Dark 默认，LocalStorage 持久化
- **Git**：`main` 初始开发 → 首次部署后 `dev` 分支后续开发
- **测试**：每个 Task 对应 Gate 门禁，Gate 不过不进下一步
- **国际化**：MVP 中文，架构预留 i18n 扩展点

---

## 六、后续扩展（不在 MVP）

| 功能 | 优先级 | 说明 |
|------|--------|------|
| 多站对比模式 | P1 | 多组充值/到账/倍率对比表 |
| URL 参数预填充 | P1 | 通过 query string 分享计算配置 |
| PWA 离线支持 | P2 | Service Worker |
| 模型价格自定义 | P2 | 手动编辑/新增定价 |
| i18n 英文界面 | P2 | 完整英文翻译 |
| 历史记录 | P3 | 多组计算历史回溯 |
| 数据导出 | P3 | CSV / 截图导出 |
