# Toolbox Agent Entry Point

Read [docs/AGENTS.md](./docs/AGENTS.md) before editing this repository. Its branch,
privacy, architecture, design, testing, and release rules are mandatory.

## Branch protection

- `main` is the deployed stable branch. Never edit, commit, merge, rebase, or deploy it
  unless the maintainer explicitly asks for that exact release operation.
- `dev` is the maintainer-controlled integration branch. Repository maintenance may be
  performed there when explicitly requested, but new-tool implementation must not be.
- Every new tool starts from a clean `dev` and is implemented only on
  `newdev/<tool-id>`. In development mode, do not commit new-tool work to `dev` or merge
  it. An integration agent may merge locally only after the maintainer explicitly asks.
- Preserve unrelated user changes. Never hide them with stash, reset, checkout, or clean.

## New tools

When adding, scaffolding, reviewing, or continuing a tool under `apps/`, explicitly use
the repository skill at
[`.agents/skills/develop-toolbox-tool/SKILL.md`](./.agents/skills/develop-toolbox-tool/SKILL.md)
and follow [docs/NEW_TOOL.md](./docs/NEW_TOOL.md). The skill is procedural; the document
is the canonical product and platform contract.

The maintainer only needs to describe the desired tool in ordinary product language. The
agent must invoke the skill itself, infer the internal brief and safe defaults, and avoid
asking the maintainer to repeat repository rules or fill out a template. New-tool branches
stay local by default; do not push them. A reviewed candidate is merged locally into `dev`,
and only `dev` is pushed when the maintainer explicitly asks.
