# Settings

## Brief

```yaml
id: settings
route: /settings/
name: Settings
problem: >
  界面语言、明暗模式、配色风格与首页卡片的显示/顺序/上限此前分散或固定；
  用户需要一个统一入口，且全部偏好只保存在本机。
inputs: >
  读取共享偏好键（toolbox-lang、toolbox-theme、toolbox-theme-family）与
  toolbox-homepage-prefs；通过 @toolbox/i18n core、window.ToolboxTheme 与
  @toolbox/prefs 写入。
outputs: >
  所有稳定应用在加载时消费的本机偏好；设置页自身即时呈现文字与配色变化。
assumptions: >
  共享存储键是唯一事实源；各应用加载时跟随，不再有应用私有覆盖。
  首页按 @toolbox/prefs 的 hiddenIds/order/limit 渲染卡片。
privacy: 纯客户端；无网络请求；无账号或后端
offline_fallback: 默认完全离线可用
non_goals:
  - 账号同步或跨设备持久化
  - 单个工具的私有主题覆盖（一律跟随全局选择）
  - 除首页卡片布局外修改具体工具行为
acceptance:
  - 全部可见文案以 zh、zh-Hant、en 呈现，不出现原始翻译 key
  - 切换配色族后深浅两种模式下页面背景计算值随之改变
  - 切换语言更新 document lang 并在刷新后保持
  - 首页列表即时反映隐藏/显示/排序/上限，并在刷新后保持
```

## 用法

从任意 Toolbox 应用右上角的齿轮图标进入 `/settings/`。

- **外观** — 深色/浅色分段控件；配色色块（Catppuccin、Gruvbox、Solarized）；
  语言列表首行显示该语言自称，副行显示当前界面语言译名。
- **首页展示** — 工具排序、隐藏/显示卡片、限制可见数量、恢复默认。更改立即生效。

## 隐私

全部计算留在浏览器。应用不发起外部请求，只写入上述共享键与自身的
`toolbox.settings.*` 命名空间，不读取其他数据。

## 开发

```bash
pnpm install
pnpm --filter=@toolbox/settings dev
pnpm --filter=@toolbox/settings build
pnpm --filter=@toolbox/settings test
pnpm --filter=@toolbox/settings test:browser
pnpm --filter=@toolbox/settings lint
```

生产态 browser smoke 直接驱动真实控件（明暗分段、配色色块含背景计算值断言、
语言列表、刷新持久化），并断言原始翻译 key 不会出现在 DOM 中。
