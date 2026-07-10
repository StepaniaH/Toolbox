# RateLens

> AI 模型价格倍率计算器 —— 把你实际付的钱和官方 API 定价直接对比。
>
> English: [README.md](./README.md)

RateLens 是一个纯前端的 AI 模型 API 计费计算器，支持两种模式：

- **倍率正算** —— 输入充值金额、到账金额与平台分组倍率，得到充值比例、1:1 等效倍率、占官方成本百分比，以及每个模型的实时价格表。
- **扣费反推** —— 选择参照模型，输入实际扣费（¥/1M tokens），反推真实分组倍率、等效倍率，并逐维判定比官方便宜 / 持平 / 贵。

零后端、零追踪，所有计算在浏览器本地完成。

## 功能

- **双计算模式**，充值 / 到账 / 汇率输入共享
- **实时价格表**：Claude（5 款）与 GPT & Codex（6 款），语义化 pill（绿=便宜 / 黄=持平 / 红=贵）+ 每格计算公式
- **自动汇率**，多端点 fallback，支持随时手动覆盖
- **Catppuccin 主题**：Frappe（深色，默认）/ Latte（浅色），localStorage 持久化，跟随系统偏好
- **响应式**：375 / 768 / 1024 / 1440 四断点；移动端价格表横向滚动
- **状态持久化**：刷新后输入值、模式、价格表选择自动恢复
- **根级 ErrorBoundary**；汇率离线时回退默认值

## 技术栈

| 层 | 选型 |
|------|------|
| 框架 | React 19 + TypeScript 5.9 |
| 构建 | Vite 7 |
| 样式 | Tailwind CSS v4 + shadcn/ui (new-york) |
| 主题 | Catppuccin Frappe / Latte（CSS 自定义属性） |
| 图标 | lucide-react |
| 测试 | Vitest 3 + @testing-library/react + jsdom |

## 快速开始

```bash
npm install
npm run dev        # 启动开发服务器 (http://localhost:5173)
npm run build      # 类型检查 + 生产构建到 dist/
npm run preview    # 预览生产构建
npm test           # 运行单元/UI 测试套件（55 个用例）
```

## 项目结构

```
src/
├── calc/          # forward.ts, reverse.ts — 纯计算逻辑
├── components/    # 功能组件 + layout/ + ui/ (shadcn)
├── data/          # models.ts — Claude 与 GPT/Codex 定价数据
├── hooks/         # use-theme, use-local-storage, use-exchange-rate
├── lib/           # utils.ts — cn, parseNum, 格式化, classifyVerdict
├── types/         # TypeScript 领域类型
└── __tests__/     # 单元 + 渲染测试（9 文件，55 用例）
```

设计规格：[`docs/spec.md`](./docs/spec.md) · 实施计划：[`docs/plan.md`](./docs/plan.md) · 任务追踪：[`TASKS.md`](./TASKS.md)

## 测试

- `calc/` 与 `lib/` 由单元测试覆盖（公式、边界、verdict 判定）
- 功能组件（`ForwardCalculator`、`ReverseCalculator`、`App`）由渲染测试覆盖，复用同一套计算函数
- `useLocalStorage`（持久化）与 `useTheme`（深/浅色切换）由 hook 测试覆盖

## 许可证

[MIT](./LICENSE)
