---
id: image-converter
route: /image-converter/
name: FormTran / 方转
problem: 用户需要不上传文件即可完成单图或文件夹图片的批量格式、尺寸与文件名转换。
inputs: 单张、多张或文件夹中的 JPEG/PNG/WebP/GIF/BMP/AVIF/SVG；输出、尺寸、画质、透明底色与命名规则。
outputs: PNG/JPEG/WebP 文件，可逐张下载或按相对目录打包为 ZIP。
assumptions: 浏览器负责解码和 Canvas 编码；动画只取首帧；重编码默认移除元数据；输出限制 16384 px/边和 8000 万像素。
privacy: 无业务联网、账号、后端、遥测、广告、Cookie 或远端字体；文件只在内存；仅设置写入 toolbox.image-converter.settings。
offline_fallback: 静态资源已加载后完全离线；不支持的格式逐文件报错并保留原文件。
non_goals: 动画保留、AVIF/JXL/TIFF/HEIC 输出、RAW 显影、HDR/CMYK/ICC 精确保真、元数据编辑、服务端超大文件处理。
acceptance:
  - 单文件、多文件和文件夹输入均进入有预览与状态的本地队列。
  - 浏览器主流输入可转换为 PNG/JPEG/WebP，并可缩放、控制画质和 JPEG 底色。
  - 模板与正则命名提供实时预览、捕获组、序号、变量、文件夹保留和重名消解。
  - 完成项可单独下载或生成保留 UTF-8 文件名的 ZIP。
  - 中英文、明暗主题、桌面/移动端、键盘焦点和悬浮知识说明可用。
  - 未加入文件可查看逐项原因；转换结果有前后对比图库；命名变量可点击插入。
  - 正则命名提供三步引导、常用预设、命中状态和捕获组反馈；知识库位于独立 Tab。
  - 上传和队列在桌面首屏并列并即时反馈；普通命名与高级正则分层；结果可选择文件或 ZIP 下载。
  - 隐私/契约、单工具与全仓质量门禁通过，manifest 保持 hidden。
---

# Candidate handoff

## Decisions and changed scope

- New isolated React + TypeScript + Vite app under `apps/image-converter/`.
- One hidden canonical identity entry in `packages/app-manifest/manifest.js`.
- `docs/PLAN.md` records the requested future browser-local converter family; `docs/TASKS.md` tracks this candidate.
- Text and markup conversion is planned as a separate local-first app so image conversion does not absorb document parsing and round-trip syntax concerns.
- Product identity is now `FormTran / 方转`; the existing technical id and route remain stable.
- Workspace intake and queue share one desktop row with an explicit per-selection result. Naming defaults to a compact template workflow and reveals regex controls only as an advanced section.
- Result delivery is user-selectable: direct file downloads (one direct or many separate) or a single ZIP. Each app tab owns a distinct bottom privacy statement.
- Core conversion, rename, dimension, SVG sanitization, and store-only ZIP code remain app-local. No shared package API changed.

## Data-flow audit

- Network: no `fetch`, XHR, WebSocket, EventSource, beacon, remote font, or third-party runtime asset.
- File bytes: `File` → local object URL / sanitized SVG → browser decoder → Canvas → local Blob → direct download or local ZIP.
- Storage: only JSON preferences at `toolbox.image-converter.settings`; corrupt values recover to defaults. No filenames or image bytes are stored.
- Query: none.
- SVG: raw SVG preview is suppressed; scripts, `foreignObject`, event attributes, and external references are removed before browser decoding.

## Verification results

- `pnpm --filter=@toolbox/image-converter build` — passed; production JS 262.58 kB / 84.32 kB gzip, CSS 41.42 kB / 7.88 kB gzip.
- `pnpm --filter=@toolbox/image-converter test` — passed, 5 files / 20 tests.
- `pnpm --filter=@toolbox/image-converter lint` — passed, 0 warnings.
- `pnpm --filter=@toolbox/image-converter test:browser` — passed with aligned upload/queue and settings/naming cards, mixed-file import feedback, advanced regex expansion, a real PNG → WebP conversion, direct-file and ZIP delivery, comparison dialog, and tab-specific privacy notices.
- `pnpm check:privacy` — passed for 269 tracked or unignored files at the time of the check.
- `pnpm check:contracts` — passed for 6 apps.
- `pnpm build` — passed, 6 app builds.
- `pnpm test` — passed, 986 tests across the workspace after this candidate.
- `pnpm lint` — passed, 0 warnings.
- `pnpm test:browser` — passed for all 6 application suites.
- `git diff --check` — passed.

## Visual matrix

- Automated: light/dark × zh/en at 1440 × 1100 and 390 × 844; shared shell, canonical mark, focusable controls, overflow, console/page/request failures, and real conversion covered.
- Manual: English/light desktop with a mixed upload, expanded advanced-regex desktop, and the 390 × 844 mobile workspace were inspected after the FormTran refinement. Intake/queue visibility, balanced default cards, download controls, privacy notices, action hierarchy, and responsive stacking remained readable without overflow or overlap.
- Temporary screenshots were written outside the repository and were not retained as candidate files.

## Known limits and integration cleanup

- Browser codec support varies; animation becomes one frame; metadata and color-profile fidelity are not preserved.
- ZIP uses the portable store method rather than compression because images are already compressed; this avoids a runtime dependency.
- Before integration, move durable user-facing changes to the release notes/TASKS as appropriate, then delete this temporary handoff file.
- Keep manifest status `hidden` unless the maintainer separately approves promotion after review.
