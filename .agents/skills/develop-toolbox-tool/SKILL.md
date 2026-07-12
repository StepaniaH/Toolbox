---
name: develop-toolbox-tool
description: Develop, scaffold, continue, or review a new application in the Toolbox monorepo. Use whenever work adds a tool under apps/, changes a new tool on a newdev/* branch, prepares its handoff for dev integration, or reviews whether a candidate tool satisfies Toolbox theme, navigation, i18n, privacy, documentation, testing, and isolation contracts.
---

# Develop Toolbox Tool

Keep new-tool experimentation isolated while inheriting the stable Toolbox shell and
quality gates. Treat the repository documents and platform packages as sources of truth;
do not copy implementations from existing applications.

## 1. Load the contract

Before changing files, read these files completely:

1. `../../../docs/NEW_TOOL.md`
2. `../../../docs/DESIGN_SYSTEM.md`
3. `../../../docs/AGENTS.md`
4. `../../../packages/theme/README.md`
5. `../../../packages/nav/README.md`
6. `../../../packages/i18n/README.md`
7. `../../../packages/app-manifest/README.md`

Read the target app's README and `NEW_TOOL_HANDOFF.md` when continuing or reviewing an
existing candidate.

## 2. Enforce the branch gate before edits

Run `git status --short --branch` and `git branch --show-current`.

- For a new implementation, require a clean worktree on `dev`, then create
  `newdev/<tool-id>` from the local `dev` HEAD before editing.
- For continued implementation, require the current branch to be exactly
  `newdev/<tool-id>`.
- Never edit on `main` or implement a new tool directly on `dev`.
- Never merge, rebase, deploy, force-push, stash, reset, or clean on the user's behalf.
- If uncommitted work exists before the branch is created, stop and report it.

## 3. Build the smallest isolated tool

Use Vite and the root workspace catalog. Choose Vanilla TypeScript for small tools and
React TypeScript for interaction-heavy tools. Keep business logic pure and separate from
rendering. Add only the target directory, its manifest entry, and genuinely necessary
platform changes.

From the first screen:

- consume `@toolbox/theme`, `@toolbox/nav`, and `@toolbox/i18n`;
- register a canonical icon, localized metadata, localized search keywords, and
  `status: "hidden"` in `@toolbox/app-manifest`;
- use `toolbox.<tool-id>.*` for private storage;
- keep inputs local and make external network access an explicit reviewed exception;
- use system fonts and shared tokens; do not add remote fonts or copied color palettes.

## 4. Maintain the handoff artifacts

Create both localized README files and a temporary `NEW_TOOL_HANDOFF.md` using the schema
in `docs/NEW_TOOL.md`. Keep the handoff factual: scope, decisions, files, tests, network,
known limits, and exact deletion/migration steps for the integration reviewer.

Do not add completed new-tool work to the root changelog from the candidate branch. The
integration reviewer owns release notes and deletes `NEW_TOOL_HANDOFF.md` after moving any
durable information.

## 5. Validate proportionally

During implementation, run only the candidate app's `dev`, `build`, `test`, `lint`, and
`test:browser` scripts. Before handoff, also run root privacy and contract checks. Run the
full workspace gates only after the candidate is complete or when platform packages were
changed.

Do not weaken, skip, snapshot-update, or delete a failing test merely to obtain green
output. Report any pre-existing or unrelated failure separately.

## 6. Review for integration without merging

When asked to review a candidate, compare its branch against `dev`, verify the handoff,
run all gates listed in `docs/NEW_TOOL.md`, and report blockers. Do not merge into `dev`,
promote manifest status, edit `main`, or deploy unless the maintainer explicitly requests
that distinct integration or release operation.
