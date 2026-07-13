---
name: develop-toolbox-tool
description: Turn an ordinary natural-language product request into a complete isolated Toolbox application, or review and integrate an existing newdev/* candidate. Use automatically whenever the user asks to create, add, continue, or review a new tool under apps/, even if the user does not mention this skill, a branch name, a framework, a brief, tests, documentation, privacy, theme, navigation, or i18n.
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

When continuing or reviewing a candidate, also read its localized READMEs and
`NEW_TOOL_HANDOFF.md`.

## 2. Convert the request into an internal brief

Infer a coherent first version from the user's normal description. Derive a concise
kebab-case tool id, inputs, outputs, assumptions, non-goals, privacy model, fallback, and
3–8 verifiable acceptance criteria. Record these in `NEW_TOOL_HANDOFF.md`; do not ask the
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

- For a new implementation, require a clean local `dev`, derive the tool id, then create
  `newdev/<tool-id>` from the local `dev` HEAD.
- For continued implementation, require exactly the matching `newdev/<tool-id>` branch.
- Never implement a new tool on `dev` or `main`.
- Preserve unrelated work; never stash, reset, clean, rebase, force-push, or deploy.
- Stop if the required branch transition would overwrite uncommitted work.

Candidate branches are local by default. Do not push `newdev/<tool-id>` or create a remote
branch unless the maintainer explicitly requests remote backup for that candidate.

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

## 5. Own documentation and handoff

Create `README.md`, `README.zh-CN.md`, and temporary `NEW_TOOL_HANDOFF.md` as specified in
`docs/NEW_TOOL.md`. Keep the handoff factual: inferred brief, assumptions, decisions,
changed files, network/storage/query behavior, actual test results, known limits, visual
matrix, and integration cleanup.

Do not make the maintainer maintain these documents. Do not edit the root changelog,
promote the app, merge branches, or prepare a repository release in development mode.

## 6. Validate and stop locally

During development, prefer the candidate app's `dev`, `build`, `test`, `lint`, and
`test:browser`. Before handoff, run privacy/contracts and the full workspace gates listed
in `docs/NEW_TOOL.md`.

Fix failures instead of weakening tests, lint, privacy, or contract checks. Once the
candidate and handoff are complete, create focused local commits on `newdev/<tool-id>` so
the integration reviewer receives a clean branch. Then stop and report the local branch,
commits, checks, assumptions, and remaining risks. Do not push by default.

## 7. Integrate only on explicit request

Treat “review”, “merge into dev”, and “push dev” as separate permissions.

When explicitly asked to review, compare local `dev...newdev/<tool-id>`, independently
verify product correctness, privacy, visual behavior, dependencies, and all quality gates.
Report blockers without merging.

When explicitly asked to merge, require clean `dev`, perform a reviewable local merge,
move durable information into READMEs/CHANGELOG/TASKS, delete `NEW_TOOL_HANDOFF.md` and
temporary fixtures, decide manifest promotion only from verified evidence and maintainer
intent, then rerun full gates. Never touch `main` or deploy.

Push only the merged `dev` branch, and only when the maintainer explicitly asks for that
push. Do not push the candidate branch as an intermediate step.
