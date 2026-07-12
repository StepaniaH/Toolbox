# Toolbox Agent Entry Point

Read [docs/AGENTS.md](./docs/AGENTS.md) before editing this repository. Its branch,
privacy, architecture, design, testing, and release rules are mandatory.

## Branch protection

- `main` is the deployed stable branch. Never edit, commit, merge, rebase, or deploy it
  unless the maintainer explicitly asks for that exact release operation.
- `dev` is the maintainer-controlled integration branch. Repository maintenance may be
  performed there when explicitly requested, but new-tool implementation must not be.
- Every new tool starts from a clean `dev` and is implemented only on
  `newdev/<tool-id>`. Do not commit new-tool work to `dev` or merge it yourself.
- Preserve unrelated user changes. Never hide them with stash, reset, checkout, or clean.

## New tools

When adding, scaffolding, reviewing, or continuing a tool under `apps/`, explicitly use
the repository skill at
[`.agents/skills/develop-toolbox-tool/SKILL.md`](./.agents/skills/develop-toolbox-tool/SKILL.md)
and follow [docs/NEW_TOOL.md](./docs/NEW_TOOL.md). The skill is procedural; the document
is the canonical product and platform contract.
