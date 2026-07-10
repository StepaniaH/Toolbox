# Monitor Choice

显示器参数理解与选择参考工具。

**[English](README.md)**

## 功能

- **清晰度实验室**：实时 PPI/PPD 计算 + 像素级文字渲染对比
- **尺寸与距离**：交互式 3D 房间场景，可拖拽旋转透视投影；FOV/THX/SMPTE 观看距离建议
- **色彩空间**：CIE 1931 色度图，交互式色域叠加（sRGB / DCI-P3 / Rec.2020）
- **场景参考**：9 个实际使用场景的参数选购指导
- **面板百科**：IPS / VA / OLED / Mini-LED 技术深度解析，含接口带宽计算器

## 运行

无需构建，无需依赖，直接打开：

```bash
open index.html
# 或
python3 -m http.server 8080
```

## 隐私

零外部请求、零追踪、零 Cookie、零第三方脚本。所有计算均在本地浏览器完成。设置仅在用户主动启用时存储于 `localStorage`，可随时清除。

## 技术栈

HTML + CSS + Vanilla JavaScript (Canvas 2D)，零依赖。

## 许可证

[MIT](LICENSE) © 2026 Stepania H
