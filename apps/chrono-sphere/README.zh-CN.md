# ChronoSphere

ChronoSphere 是一款本地优先的日期工具，支持时区感知的日期偏移、日期区间、DST 审计和中国农历换算。

所有计算都在浏览器本地完成，不需要登录，也不会上传输入内容。

[English README](./README.md)

## 核心功能
- 日期偏移：输入基准日期，计算向前或向后偏移 X 日后的公历与农历结果。
- 日期区间：支持双时区区间计算、日历天数差、绝对流逝时间，以及工作日 / 双休日统计。
- 时区搜索与 DST 审计：可按国家、城市或 IANA 时区搜索，并自动标记夏令时切换。
- 中国农历：支持农历年、月、日和闰月换算，并展示干支、生肖、节气、节日与黄历宜忌。
- 双语与主题：支持简体中文和英文界面，以及浅色、深色和系统主题。

## 隐私
ChronoSphere 不会把你的日期、时区或农历输入发送到后端。浏览器只保存语言和主题偏好。

## 部署
这是一个静态站点，可直接将 `dist/` 部署到 Caddy、Nginx 或其他静态托管环境。若使用单页应用路由，请将未知路径回退到 `index.html`。

## 本地开发
```bash
npm install
npm run dev
```

生产构建：
```bash
npm run build
```

本地预览生产构建：
```bash
npm run preview
```

## 许可
MIT License. See [LICENSE](LICENSE).

## 开源仓库
[StepaniaH/chrono-sphere](https://github.com/StepaniaH/chrono-sphere)
