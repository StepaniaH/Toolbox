# Toolbox 发布流程

这份文档固定维护者从本地开发到生产上线的推荐路径。默认目标是：**开发只在本地 `dev`、
发布事实源是 tag、生产部署必须手动确认**。生产有两个静态目标：面向公众的 Cloudflare
Pages 与保留的 VPS 站点；二者可以单独发布，也可以接收同一份已验证 artifact。

## 一、位置分别代表什么

| 位置 | 用途 | 会不会改变线上网站 |
|------|------|--------------------|
| 本地 `dev` | 唯一开发分支；全部实现以聚焦提交落在这里，不推送远端 | 不会 |
| 本地 `main` | 已批准的稳定发布线 | 不会；合并本身不上线 |
| 远端 `origin/main` | 唯一远端分支；push 后触发 GitHub CI | 不会 |
| `vX.Y.Z` tag | 发布事实源；push tag 触发 Release 工作流并生成 GitHub Release | 不会 |
| Cloudflare Pages | 面向公众的 `toolbox.stepaniah.me` 静态站点 | 只有手动选择 Pages 部署成功后才会改变 |
| VPS 站点 | 备用的静态站点 | 只有手动选择 VPS 部署成功后才会改变 |

GitHub CI 是一台临时 Linux 机器重新执行安装、构建、测试、浏览器 smoke 和 lint。它能发现“本机通过、换台机器失败”的问题。页面视觉仍应在本地预览中确认。

## 二、固定推荐流程

### 1. 在本地 `dev` 开发

```bash
git switch dev
git status
```

启动全部工具或单个工具：

```bash
pnpm dev

# 或只启动一个工具
pnpm --filter=@toolbox/sane-units dev
```

在本地浏览器检查需要修改的页面、明暗主题、中英文和桌面/移动端。实现以聚焦提交落在
`dev`，一个提交对应一个可回滚阶段。

### 2. 提交与集成前跑门禁

跨应用、共享包和发布改动至少执行：

```bash
pnpm check:privacy
pnpm check:contracts
pnpm check:release
pnpm build
pnpm test
pnpm test:browser
pnpm lint
```

`check:release` 校验根 `package.json` 版本、`TOOLBOX_RELEASE` 与 CHANGELOG 最新小节一致；
未进入版本准备阶段时，CHANGELOG 允许处于 `Unreleased` 状态。

### 3. 维护者审核并合并到 `main`

发布前由维护者审查 `dev` 相对 `main` 的完整差异（`git diff main...dev` 或本地 PR 对比），
确认产品、隐私、测试与文档状态后，在本地合并：

```bash
git switch main
git merge --no-ff dev
```

使用 merge commit 保留已经验证过的阶段提交和 `dev`/`main` 的祖先关系；不使用 squash 或
force push。

### 4. 推送 `main` 并等待 CI

```bash
git push origin main
```

推送后在 GitHub 的 **Actions** 页面确认 **CI & Manual Deploy** 全绿。如果失败，回到本地
`dev` 修复、重新走审核与合并；不要为了通过而跳过失败步骤。

### 5. 版本准备与打 tag

服务器就绪且维护者明确要求发布时，在 `dev` 上完成版本准备提交：更新根 `package.json`
的 `version`、`TOOLBOX_RELEASE` 与 CHANGELOG 新小节，重跑全部门禁后按上述流程合并到
`main` 并推送。然后在 `main` HEAD 上打 tag 并推送：

```bash
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin vX.Y.Z
```

push tag 会触发 **Release** 工作流：从头执行 privacy、contracts、release、build、test、
browser smoke 和 lint，全部通过后从 CHANGELOG 提取该版本小节创建 GitHub Release。
`check:release` 会拒绝 tag 与版本号不一致的发布。

### 6. 手动触发生产部署

生产部署仍走 **CI & Manual Deploy** 的手动路径（服务器迁移完成后启用）：

1. 打开 **Actions → CI & Manual Deploy → Run workflow**。
2. 分支选择 `main`，勾选 `deploy_production`。
3. 在 `deploy_target` 选择 `pages`、`vps` 或 `both`。

工作流会先重新执行全部门禁，再把各应用 `dist/` 组装为单一 artifact；VPS 与 Pages 只下载
这份 artifact。部署任务要求当前 ref 是 `main`，并通过 `production` environment。两个目标各自有独立 concurrency，同一目标的两个生产发布不会互相覆盖。

### 7. 部署后验证

至少检查：

- 本次选择的每个站点首页都能打开且工具链接正确。
- 本次受影响的工具页面能打开。
- SaneUnits 的 `/sane-units/storage` 等深层路径刷新后仍能打开正确工具页。
- 明暗主题与中英文可切换。
- 浏览器控制台没有新的业务错误。
- CHANGELOG 与 GitHub Release 记录了这次发布内容。

## 三、为什么 GitHub Actions 要固定 commit SHA

工作流里的 Action 是 CI 使用的第三方程序，例如拉取代码、安装 Node、连接部署网络。

```yaml
# 可移动标签：容易读，但标签维护者理论上可以改变它指向的代码
uses: actions/checkout@v6

# 不可变 commit：永远对应同一份代码
uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
```

普通应用依赖由 `pnpm-lock.yaml` 锁定；Action 的 SHA 相当于 CI 依赖自己的锁文件。固定 SHA 的价值在有 secrets 权限的任务里尤其高。

版本注释（例如 `# v4`）保留可读性。以后升级 Action 时，应先查看官方 release，再把 SHA 改成新版本对应的 commit，让变化出现在 diff 中；不要为了“自动最新”改回浮动标签。

## 四、Secrets 和 production environment

部署使用的真实主机、端口、路径和密钥只保存在 GitHub Secrets 或本机 gitignored 的 `deploy/.env`，不得写进仓库、Issue、PR 或日志。

GitHub Actions 当前需要以下 secrets：

- `TAILSCALE_OAUTH_CLIENT_ID`
- `TAILSCALE_OAUTH_CLIENT_SECRET`
- `VPS_SSH_KEY`
- `VPS_HOST`
- `VPS_USER`
- `VPS_PORT`
- `VPS_WWW`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_PAGES_PROJECT`

把这些 secrets 放入 GitHub 的 `production` environment，并为该 environment 开启 Required reviewers；将允许部署的分支限制为 `main`。不要使用 Cloudflare Global API Key。工作流不会把 Cloudflare 凭据传给 VPS job，也不会把 VPS、SSH 或 Tailscale 凭据传给 Pages job。

### Cloudflare Pages 配置要点

Pages 使用 **Direct Upload**：GitHub 完成构建与门禁，Wrangler 只上传预构建静态目录。不要为这个项目启用 Cloudflare 的 Git 自动构建，否则会绕过仓库的手动生产门禁并重复构建。首次配置步骤：

1. 在本机终端执行一次 `npx wrangler@4.94.0 login`，再执行 `npx wrangler@4.94.0 pages project create <PAGES_PROJECT_NAME> --production-branch main`。这一步只创建空的 Direct Upload 项目。不要用 Dashboard 的 Drag and drop 完成首次创建。
2. 在 Cloudflare Account API Tokens 创建 **Custom Token**，权限只给目标 Account 的 **Cloudflare Pages: Edit**。不要使用 Global API Key。
3. 记录 Account ID；在 GitHub 仓库的 **Settings → Environments → production** 添加 `CLOUDFLARE_ACCOUNT_ID`、`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_PAGES_PROJECT`。
4. 从 GitHub Actions 的 `main` 手动运行一次部署，选择 `pages`。
5. 首次发布成功后，在 Pages 项目的 **Custom domains** 添加站点域名。

Direct Upload 项目以后不能原地切换成 Git integration；已经误建为 Git integration 的项目可以关闭 production/preview 自动构建后再用 Wrangler 上传，但新项目优先直接选择 Direct Upload。

## 五、本地手动部署是备用路径

GitHub Actions 手动部署是推荐主路径，因为它会在干净 Linux 环境重新验证。`deploy/deploy.sh` 保留为 VPS 的 GitHub Actions 故障备用路径；Cloudflare Pages 不读取本机 `deploy/.env`。

备用脚本只接受干净且与 `origin/main` 完全一致的本地 `main`：

```bash
git switch main
git pull --ff-only origin main
git status
bash deploy/deploy.sh
```

脚本不会替维护者切分支，也不会从 `dev` 部署。真实配置只放在 gitignored 的 `deploy/.env`。

## 六、回滚流程

不要用 `git reset --hard`、force push、删除或移动已发布的 tag 改写历史。

推荐回滚方式：

1. 在 `dev` 创建明确的 revert commit，经过同样门禁后按流程合并到 `main` 并推送。
2. 如需标记修正版本，发布新的 patch tag（例如 `v0.3.2`），让 Release 工作流走完整验证。
3. 再次手动运行生产部署，选择受影响目标或 `both`。

如果只是部署过程失败而 `main` 内容正确，不需要回滚 Git；修复部署环境后重新手动运行同一个 workflow 即可。

## 七、最短检查清单

- [ ] 本地 `dev` 页面确认完成，阶段提交聚焦可回滚。
- [ ] 完整门禁通过，包含 `check:release`。
- [ ] 维护者已审查 `main...dev` 完整差异并授权合并。
- [ ] 本地合并 `main` 后 push，CI 全绿。
- [ ] （仅发布时）版本准备提交完成，tag 与三处版本一致。
- [ ] push tag 后 Release 工作流全绿，GitHub Release 内容正确。
- [ ] 生产部署后关键页面检查通过。
- [ ] 如有问题，revert commit 后重新走相同流程。
