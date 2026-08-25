---
name: develop-toolbox-tool
description: Turn an ordinary natural-language product request into a complete isolated Toolbox application on the local development branch, or review and integrate pending work under apps/. Use automatically whenever the user asks to create, add, continue, or review a new tool under apps/, even if the user does not mention this skill, a branch name, a framework, a brief, tests, documentation, privacy, theme, navigation, or i18n.
---

# Develop a Toolbox Tool

Let the maintainer describe the product naturally. Translate that description into the
repository's implementation contract without making the maintainer fill out an internal
form or repeat platform rules.

## 1. Load the repository contract

Before changing files, read these files completely:

1. `../../../docs/NEW_TOOL.md`
2. `../../../docs/DESIGN_SYSTEM.md`
3. `../../../docs/AGENTS.md`
4. `../../../packages/theme/README.md`
5. `../../../packages/nav/README.md`
6. `../../../packages/i18n/README.md`
7. `../../../packages/app-manifest/README.md`

When continuing or reviewing existing tool work, also read its localized READMEs.

## 2. Convert the request into an internal brief

Infer a coherent first version from the user's normal description. Derive a concise
kebab-case tool id, inputs, outputs, assumptions, non-goals, privacy model, fallback, and
3–8 verifiable acceptance criteria. Record these in the Brief section at the top of
`apps/<tool-id>/README.md` (with a Chinese summary in `README.zh-CN.md`); do not ask the
user to provide the schema or restate information already implied by the request.

Use these defaults unless the user says otherwise:

- pure client-side and no external business requests;
- no account, backend, telemetry, ads, remote fonts, or cookies;
- `status: "hidden"` and no production/deployment changes;
- Vite with Vanilla TypeScript for a small tool or React TypeScript for richer state;
- Chinese and English from the first implementation;
- shared theme, navigation, footer, icon, manifest, and storage contracts;
- the smallest complete primary workflow, with speculative features listed as non-goals;
- local persistence only when it materially improves the workflow.

Make reasonable reversible product choices and document them. Ask one concise question
only when a missing decision would materially change calculation correctness, sensitive
data handling, paid/external service use, or the core product direction. External network
access always requires explicit maintainer approval.

## 3. Enforce the local branch gate

Run `git status --short --branch` and `git branch --show-current` before edits.

- All implementation work happens on the local `dev` branch; require a clean working
  tree and switch to `dev` when coming from another branch.
- Never implement anything directly on `main`.
- Preserve unrelated work; never stash, reset, clean, rebase, force-push, or deploy.
- Stop if a required branch transition would overwrite uncommitted work.
- `dev` is never pushed. Merging into `main`, pushing `main`, and creating release tags
  are separate maintainer authorizations described in `docs/RELEASE.md`; do none of them
  in development mode.

## 4. Build the smallest isolated tool

Keep business logic pure and separate from rendering. Limit changes to the target app,
its manifest entry, its tests and documentation, and genuinely necessary compatible
platform extensions.

From the first screen:

- consume `@toolbox/theme`, `@toolbox/nav`, and `@toolbox/i18n`;
- register a canonical icon, localized metadata and search keywords as `hidden`;
- use `toolbox.<tool-id>.*` for private storage;
- use system fonts and semantic tokens, never copied palettes or navigation code;
- validate query/storage input and recover safely from corrupt state;
- keep external data behind an injected adapter with timeout and offline/manual fallback.

Do not import another app or generalize a shared component before three stable consumers
demonstrate the same semantics.

Prefer the repository generator (`scripts/new-app.mjs`) to scaffold the skeleton once it
is available; keep its output aligned with `docs/NEW_TOOL.md` rather than hand-copying an
existing app.

## 5. Own documentation

Create `README.md` and `README.zh-CN.md` as specified in `docs/NEW_TOOL.md`, carrying the
Brief permanently at the top. Keep them factual: inferred assumptions, decisions,
network/storage/query behavior, known limits, and the visual matrix. Do not make the
maintainer maintain these documents. Do not edit the root changelog version sections,
promote the app, merge branches, push, tag, or prepare a repository release in
development mode.

## 6. Validate and stop locally

During development, prefer the target app's `dev`, `build`, `test`, `lint`, and
`test:browser`. Before completion, run privacy/contracts/release checks and the full
workspace gates listed in `docs/NEW_TOOL.md`.

Fix failures instead of weakening tests, lint, privacy, or contract checks. Once complete,
create focused local commits on `dev` so each commit is a reviewable rollback boundary.
Then stop and report the commits, checks, assumptions, and remaining risks. Do not push
and do not tag.

## 7. Integrate only on explicit request

Treat “review”, “merge into main”, “push main”, and “tag a release” as separate
permissions.

When explicitly asked to review, compare local `main...dev`, independently verify product
correctness, privacy, visual behavior, dependencies, and all quality gates. Report
blockers without merging.

When explicitly asked to merge, require clean branches, merge `dev` into local `main`
with a merge commit, move durable information into READMEs/CHANGELOG/TASKS, decide
manifest promotion only from verified evidence and maintainer intent, then rerun full
gates. Never deploy.

Push `main` only when the maintainer explicitly asks for that push. Create and push a
`vX.Y.Z` tag only when the maintainer explicitly asks for that exact release, after the
version-preparation commit keeps package version, `TOOLBOX_RELEASE`, and CHANGELOG in
sync (enforced by `pnpm check:release`).
