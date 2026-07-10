# Monitor Choice

显示器参数理解与选择参考工具。

**[English](README.md)**

## 功能

- **清晰度实验室**：实时 PPI/PPD 计算 + 像素级文字渲染对比
- **尺寸与距离**：交互式 3D 房间场景，可拖拽旋转透视投影；FOV/THX/SMPTE 观看距离建议
- **色彩空间**：CIE 1931 色度图，交互式色域叠加（sRGB / DCI-P3 / Rec.2020）
- **场景参考**：9 个实际使用场景的参数选购指导
- **面板百科**：IPS / VA / OLED / Mini-LED 技术深度解析，含接口带宽计算器

## 开发

通过仓库 workspace 运行，使 Vite 能解析共享 Toolbox 平台包：

```bash
pnpm --filter=@toolbox/monitor-choice dev
pnpm --filter=@toolbox/monitor-choice build
pnpm --filter=@toolbox/monitor-choice test
pnpm --filter=@toolbox/monitor-choice lint
```

生产产物输出到 `dist/`，base path 为 `/monitor-choice/`。

## 隐私

零外部请求、零追踪、零 Cookie、零第三方脚本。所有计算均在本地浏览器完成。设置仅在用户主动启用时存储于 `localStorage`，可随时清除。

## 技术栈

Vanilla JavaScript + Vite + CSS + Canvas 2D。主题、导航与语言状态由 workspace 共享包提供，并在构建时打包到本地静态产物。

## 许可证

[MIT](LICENSE) © 2026 Stepania H
