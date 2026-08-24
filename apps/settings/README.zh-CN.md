# Settings

## Brief（产品契约）

```yaml
id: settings
route: /settings/
problem: （描述工具解决的用户问题）
inputs: （用户输入）
outputs: （工具输出）
assumptions: （会改变结果的假设）
privacy: 纯客户端；无网络请求；无账号或后端
offline_fallback: 默认完全离线可用
non_goals: （首版明确不做的内容）
acceptance:
  - （可验证结果 1）
  - （可验证结果 2）
```

## 使用说明

（首个可用界面完成后补充。）

## 隐私

所有计算都在浏览器本地完成。应用不发起外部请求，私有状态只写入
`toolbox.settings.*`，仅读写共享的 `toolbox-theme` / `toolbox-lang` 偏好键。

## 开发

命令与英文版一致，见 [README.md](./README.md)。
