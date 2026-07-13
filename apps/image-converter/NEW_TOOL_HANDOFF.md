---
id: image-converter
route: /image-converter/
name: FormTran
problem: 用户需要在不上传内容的情况下先识别文件，再从统一入口选择转换、压缩、编辑、拆分、合并、编码、解析或信息查看工具。
inputs: 首页接收混合文件或文件夹并做轻量类型识别；独立工作台接收图片、GIF 帧、PDF、文本/数据或压缩包及对应设置。
outputs: 当前已提供 PNG/JPEG/WebP 文件或 ZIP、GIF89a 动画、TXT/MD/ORG/RST/ADOC/HTML 文本；后续输出按能力阶段单独验收。
assumptions: 首页只识别和推荐，不自动处理；浏览器负责图片解码和 Canvas；已识别不等于可完整处理；GIF 使用固定 3-3-2 调色板；标记转换覆盖公共结构子集；各领域状态隔离并按需加载。
privacy: 无业务联网、账号、后端、遥测、广告、Cookie 或远端字体；所有文件、像素、文本和结果只在内存；仅图片设置写入 toolbox.image-converter.settings。
offline_fallback: 静态资源已加载后完全离线；不支持的格式逐文件报错并保留原文件。
non_goals: 在同一阶段一次性开放全部推荐工具；把扩展名识别伪装成完整兼容；静默服务端降级；未经审计的 PDF/压缩包解析；源动图完整拆帧、逐帧透明/处置方式、高质量自适应 GIF 调色板、RAW 显影、HDR/CMYK/ICC 精确保真、完整标记方言/插件语法和服务端超大文件处理。
acceptance:
  - 单文件、多文件和文件夹输入均进入有预览与状态的本地队列。
  - 浏览器主流输入可转换为 PNG/JPEG/WebP，并可缩放、控制画质和 JPEG 底色。
  - 模板与正则命名提供实时预览、捕获组、序号、变量、文件夹保留和重名消解。
  - 完成项可单独下载或生成保留 UTF-8 文件名的 ZIP。
  - 中英文、明暗主题、桌面/移动端、键盘焦点和悬浮知识说明可用。
  - 未加入文件可查看逐项原因；转换结果有前后对比图库；命名变量可点击插入。
  - 正则命名提供三步引导、常用预设、命中状态和捕获组反馈；知识库位于独立 Tab。
  - 上传和队列在桌面首屏并列并即时反馈；普通命名与高级正则分层；结果可选择文件或 ZIP 下载。
  - GIF 合成可排序 2–100 帧、设置统一画布/延迟/循环、在本地生成可预览与下载的 GIF89a。
  - GIF 大画布跨过 LZW 9/10/11/12 位边界后仍可完整解码到底部，并可一键清空帧队列。
  - 文本与标记转换可批量导入/显示/切换/移除/清空文件，解析六种格式的公共结构，并单独或 ZIP 下载结果。
  - 知识库按图片、动画、文本标记分类，不把未来格式说明平铺在一个长页面中。
  - 隐私/契约、单工具与全仓质量门禁通过，manifest 保持 hidden。
  - 默认文件首页在不自动执行操作的前提下识别混合输入，并按图片、GIF、PDF、文本数据、压缩包或未知类型推荐工具。
  - 每个推荐工具明确标记可用、有限或规划中；兼容输入可由用户主动带入现有工作台。
---

# Candidate handoff

## Decisions and changed scope

- New isolated React + TypeScript + Vite app under `apps/image-converter/`.
- One hidden canonical identity entry in `packages/app-manifest/manifest.js`.
- `docs/PLAN.md` records the requested future browser-local converter family; `docs/TASKS.md` tracks this candidate.
- GIF composition and text/markup conversion are independent business tabs inside FormTran: they share the local-format identity and static knowledge shell while keeping state, parameters, privacy copy, and workflows isolated.
- Product identity is now English-only `FormTran`; the existing technical id and route remain stable.
- Product scope is expanded to a browser-local file workbench. The default home is an identification and recommendation layer; domain workspaces remain isolated and high-risk parsers are not presented as available before implementation and tests.
- File home recognizes supported image signatures plus PDF/ZIP and text/data extensions from at most 64 KiB per file. It warns on signature/extension mismatches, groups recommendations by available/limited/planned status, and never auto-runs a tool.
- Supported files can be handed explicitly to image, GIF, or text workspaces. Image presets remain editable; Data URL generation is capped at 10 MB. TIFF/HEIC/ICO and high-risk PDF/archive operations are recognizable but not falsely exposed as implemented.
- Navigation now supports both discovery paths: automatic identification on File Home and direct manual entry into file-family tabs. The first PDF/archive phase is intentionally read-oriented: PDF inspection and bounded ZIP listing/extraction, not unverified page editing or universal archive support.
- Workspace intake and queue share one equal-width/equal-height desktop row with feedback inside the intake card. Naming defaults to a compact template workflow and reveals regex controls only as an advanced section; the expanded light-theme surface uses the normal raised surface instead of a dark tint.
- Result delivery is user-selectable: direct file downloads (one direct or many separate) or a single ZIP. Each app tab owns a distinct bottom privacy statement.
- Native selects in the main delivery and text format flows were replaced by one app-local, keyboard-accessible theme menu to avoid platform-specific chrome and clipping.
- GIF, text, and knowledge pages now use flat workbench dividers, selectable rows, expandable references, and comparison tables; raised cards are reserved for actual independent image-workspace groups and callouts.
- Core conversion, rename, dimension, SVG sanitization, and store-only ZIP code remain app-local. No shared package API changed.

## Data-flow audit

- Network: no `fetch`, XHR, WebSocket, EventSource, beacon, remote font, or third-party runtime asset.
- Image bytes: `File` → local object URL / sanitized SVG → browser decoder → Canvas → local Blob → direct download or local ZIP.
- GIF bytes: still-image `File` objects → browser decoder → unified RGBA canvases → fixed-palette GIF89a encoder → local Blob preview/download.
- Text: local `File.text()` or pasted string → app-local normalized block AST → target renderer → editor/sandbox preview → local Blob download.
- PDF: local `File` → bounded (32 MB) byte scan → non-authoritative structure hints. No page rendering, rewrite, or persistence occurs.
- ZIP: local `File` → bounded central-directory parser → safe-entry selection → local Store/Deflate extraction → size + CRC verification → direct Blob or locally repackaged ZIP.
- Storage: only JSON preferences at `toolbox.image-converter.settings`; corrupt values recover to defaults. No filenames or image bytes are stored.
- Query: none.
- File-home identification: `File.slice(0, 64 KiB)` → local signature/extension classifier → in-memory recommendation state. The full file is not read until the user opens a compatible tool; filenames and results are not persisted.
- SVG: raw SVG preview is suppressed; scripts, `foreignObject`, event attributes, and external references are removed before browser decoding.

## Verification results

- `node_modules/.bin/vite build` — passed; latest measured production JS 347.07 kB / 110.30 kB gzip, CSS 68.96 kB / 12.16 kB gzip.
- `node_modules/.bin/vitest run` — passed, 11 files / 40 tests, including manual PDF/ZIP workspace flows, ZIP traversal rejection, CRC-verified extraction, and file-home queue preservation.
- `node_modules/.bin/tsc -b` — passed after tightening the existing GIF Blob and markup fence types.
- `node_modules/.bin/oxlint --deny-warnings src tests` — passed, 0 warnings.
- `node tests/browser-smoke.mjs` — passed with file-home signature identification, explicit image handoff, editable presets, equal image cards, custom direct/ZIP delivery menu, text batch import, Markdown → Org conversion, knowledge comparison tables, mobile overflow checks, and a real 64×64 two-frame GIF whose bottom pixel is decoded and validated.
- `node scripts/check-privacy.mjs` — passed for 282 tracked or unignored files at the latest check.
- `node scripts/check-contracts.mjs` — passed for 6 apps.
- `pnpm build` — passed, 6 app builds.
- `pnpm test` — passed, 986 tests across the workspace after this candidate.
- `pnpm lint` — passed, 0 warnings.
- `pnpm test:browser` — passed for all 6 application suites.
- `git diff --check` — passed.
- Current workspace aggregate rerun was attempted twice, but the managed `pnpm` launcher tried to revalidate/download already-installed packages and could not reach the registry. The current app, manifest, privacy, and contract checks were therefore rerun directly and passed; the last complete 6-app workspace gates above remain the baseline.

## Visual matrix

- Automated: light/dark × zh/en at 1440 × 1100 and 390 × 844; file home, shared shell, canonical mark, focusable controls, overflow, console/page/request failures, and real conversion covered.
- Manual: English/light desktop empty and mixed-file home plus 390px mobile home were inspected. The routing surface uses flat dividers, a file rail, tool rows, collapsed future capabilities, and editable preset buttons rather than a new card wall.
- Temporary screenshots were written outside the repository and were not retained as candidate files.

## Known limits and integration cleanup

- Browser codec support varies; image-tab animation becomes one frame; metadata and color-profile fidelity are not preserved.
- The GIF encoder intentionally favors a small auditable implementation over photographic palette quality and advanced per-frame transparency/disposal.
- GIF LZW code-width growth is decoder-aligned; a large deterministic round-trip unit test and bottom-pixel browser test cover the boundary that the original 2×2 smoke missed.
- Markup conversion preserves a documented common structure subset, not every dialect extension or byte-identical round trip.
- ZIP uses the portable store method rather than compression because images are already compressed; this avoids a runtime dependency.
- Before integration, move durable user-facing changes to the release notes/TASKS as appropriate, then delete this temporary handoff file.
- Keep manifest status `hidden` unless the maintainer separately approves promotion after review.
