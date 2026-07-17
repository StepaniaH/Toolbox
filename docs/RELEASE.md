# Toolbox 发布流程

这份文档固定维护者从本地开发到生产上线的推荐路径。默认目标是：**本地先看、远端再验证、合并不自动上线、部署必须再次手动确认**。生产有两个静态目标：面向公众的 Cloudflare Pages 与保留的 VPS 站点；二者可以单独发布，也可以接收同一份已验证 artifact。

## 一、四个位置分别代表什么

| 位置 | 用途 | 会不会改变线上网站 |
|------|------|--------------------|
| 本地 `newdev/<tool-id>` | 新工具实现、预览、测试和本地候选提交；默认不 push | 不会 |
| 本地 `dev` | 仓库维护，以及经明确授权后审核/合并新工具 | 不会 |
| 远端 `origin/dev` | 保存待发布提交，并触发 GitHub CI | 不会 |
| 远端 `main` | 已批准的稳定发布线 | 合并本身不会；仍需手动部署 |
| Cloudflare Pages | 面向公众的 `toolbox.stepaniah.me` 静态站点 | 只有手动选择 Pages 部署成功后才会改变 |
| VPS 站点 | 朋友使用与备用的静态站点 | 只有手动选择 VPS 部署成功后才会改变 |

这里的“推送”只是把 Git commit 上传到 GitHub。`git push origin dev` 不会部署网站。

GitHub CI 是一台临时 Linux 机器重新执行安装、构建、测试、浏览器 smoke 和 lint。它能发现“本机通过、换台机器失败”的问题，但当前仓库**没有公开的远端预览网址**。页面视觉仍应在本地预览中确认。

## 二、固定推荐流程

### 1. 在本地开发和预览

先确认分支和工作区：

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

在本地浏览器检查需要修改的页面、明暗主题、中英文和桌面/移动端。只有维护者确认页面符合预期，才进入下一步。

新工具是例外：实现 Agent 从干净 `dev` 创建本地 `newdev/<tool-id>`，完成本地提交后停止，
默认不 push。维护者明确要求审核/合并时，高能力模型才检查本地候选并合入 `dev`，删除临时
handoff、更新长期文档并重跑全仓门禁。候选分支不需要先上传远端。

### 2. 提交前跑本地门禁

跨应用、共享包和发布改动至少执行：

```bash
pnpm check:privacy
pnpm check:contracts
pnpm build
pnpm test
pnpm test:browser
pnpm lint
```

全部通过后提交到 `dev`。提交是本地历史记录，仍不会上传或部署。

### 3. 推送 `dev`

```bash
git push origin dev
```

推送后在 GitHub 仓库的 **Actions** 页面打开 **CI & Manual Deploy**。这次由 `push` 触发的运行只执行 `build-and-test`，不会执行 `deploy-vps` 或 `deploy-pages`。

新工具工作流也只在本地合并完成、全仓门禁通过且维护者明确要求后推送 `dev`；不要把
`newdev/*` 当作默认远端协作分支。

必须等 CI 变绿。如果失败，回到本地 `dev` 修复、提交、再次推送；不要为了通过而跳过失败步骤。

### 4. 在 GitHub 创建 `dev → main` Pull Request

在 GitHub 创建 PR：

- base：`main`
- compare：`dev`

检查 Files changed、CHANGELOG、CI 结果和是否包含意外文件。推荐使用 **Create a merge commit**，保留已经验证过的阶段提交和 `dev`/`main` 的祖先关系；不建议日常使用 squash 或 force push。

CI 全绿且维护者确认后，手动点击 Merge。合并只更新稳定分支，**不会自动部署生产**。

### 5. 手动触发生产部署

在 GitHub：

1. 打开 **Actions**。
2. 选择 **CI & Manual Deploy**。
3. 点击 **Run workflow**。
4. 分支必须选择 `main`。
5. 勾选 `deploy_production`。
6. 在 `deploy_target` 选择：
   - `pages`：只发布 Cloudflare Pages；
   - `vps`：只发布 VPS；
   - `both`：同一次运行把同一份 artifact 发布到两边。
7. 点击运行。

工作流会先从头执行 privacy、contracts、安装、build、test、browser smoke 与 lint。全部通过后才把各应用 `dist/` 组装为一个短期 GitHub artifact；VPS 与 Pages 只下载这份 artifact，不再各自重新构建。部署任务还要求当前 ref 是 `main`，并通过 `production` environment。两个目标各自有独立 concurrency，同一目标的两个生产发布不会互相覆盖。

如果 GitHub 仓库为 `production` environment 配置了 Required reviewers，工作流会在真正部署前再次等待人工批准。单人项目也建议保留手动 `Run workflow` 这一层确认。

### 6. 部署后验证

至少检查：

- 本次选择的每个站点首页都能打开且工具链接正确。
- 本次受影响的工具页面能打开。
- SaneUnits 的 `/sane-units/storage` 等深层路径刷新后仍能打开正确工具页。
- 明暗主题与中英文可切换。
- 浏览器控制台没有新的业务错误。
- CHANGELOG 记录了这次发布内容。

确认无误后记录发布的 `main` commit SHA；它是最明确的回滚点。

## 三、为什么 GitHub Actions 要固定 commit SHA

工作流里的 Action 是 CI 使用的第三方程序，例如拉取代码、安装 Node、连接部署网络。

```yaml
# 可移动标签：容易读，但标签维护者理论上可以改变它指向的代码
uses: actions/checkout@v6

# 不可变 commit：永远对应同一份代码
uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
```

普通应用依赖由 `pnpm-lock.yaml` 锁定；Action 的 SHA 相当于 CI 依赖自己的锁文件。固定 SHA 的价值在部署任务里尤其高，因为部署任务能读取 SSH 和网络连接 secrets。

版本注释（例如 `# v4`）保留可读性。以后升级 Action 时，应先查看官方 release，再把 SHA 改成新版本对应的 commit，让变化出现在 PR diff 中；不要为了“自动最新”改回浮动标签。

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

### Cloudflare Pages 首次配置

Pages 使用 **Direct Upload**：GitHub 完成构建与门禁，Wrangler 只上传预构建静态目录。不要为这个新项目启用 Cloudflare 的 Git 自动构建，否则会绕过仓库的手动生产门禁并重复构建。

1. 在本机终端执行一次 `npx wrangler@4.94.0 login`，再执行 `npx wrangler@4.94.0 pages project create <PAGES_PROJECT_NAME> --production-branch main`，把占位符替换为准备使用的项目名。这一步只创建空的 Direct Upload 项目，不上传本站。不要用 Dashboard 的 Drag and drop 完成首次创建：Direct Upload 项目不能在 Dashboard 中配置 production branch；如果已经用拖拽方式创建，需先通过 Cloudflare Pages API 把 `production_branch` 更新为 `main`，再运行本仓库工作流。
2. 在 Cloudflare Account API Tokens 创建 **Custom Token**，权限只给目标 Account 的 **Cloudflare Pages: Edit**。不要使用 Global API Key。
3. 记录 Account ID；在 GitHub 仓库的 **Settings → Environments → production** 添加：
   - `CLOUDFLARE_ACCOUNT_ID`：Account ID；
   - `CLOUDFLARE_API_TOKEN`：上一步的最小权限 Token；
   - `CLOUDFLARE_PAGES_PROJECT`：Pages 项目名，不是域名。
4. 从 GitHub Actions 的 `main` 手动运行一次，勾选 `deploy_production`，选择 `pages`。
5. 首次发布成功后，在 Pages 项目的 **Custom domains** 添加 `toolbox.stepaniah.me`。如果该 zone 已由同一 Cloudflare 账号管理，按界面确认 DNS 与证书即可；源码和工作流不需要硬编码域名。

Direct Upload 项目以后不能原地切换成 Git integration；如果未来确实要改为 Cloudflare 自动构建，应新建项目并重新审核门禁。已经误建为 Git integration 的项目可以关闭 production/preview 自动构建，再用 Wrangler 上传，但新项目优先直接选择 Direct Upload。

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

不要用 `git reset --hard`、force push 或移动旧 tag 改写已发布历史。

推荐回滚方式：

1. 在 GitHub 对有问题的合并 PR 使用 Revert，生成一个回滚 PR；或在 `dev` 创建明确的 revert commit。
2. 让回滚提交经过同样的 CI。
3. 合并回 `main`。
4. 再次手动运行 **CI & Manual Deploy**，选择受影响目标或 `both`，部署新的回滚 commit。

如果只是部署过程失败而 `main` 内容正确，不需要回滚 Git；修复部署环境后重新手动运行同一个 `main` workflow 即可。

## 七、最短检查清单

- [ ] 本地 `dev` 页面确认完成。
- [ ] 本地完整门禁通过。
- [ ] 推送 `dev` 后 GitHub CI 全绿。
- [ ] `dev → main` PR 内容和 CHANGELOG 已复核。
- [ ] Merge 后记录 `main` commit SHA。
- [ ] 从 `main` 手动运行部署 workflow，并明确选择 `pages`、`vps` 或 `both`。
- [ ] 所有已选择目标的生产关键页面检查通过。
- [ ] 如有问题，使用 revert commit 后重新走相同流程。
