# Toolbox Agent Entry Point

Read [docs/AGENTS.md](./docs/AGENTS.md) before editing this repository. Its branch,
privacy, architecture, design, testing, and release rules are mandatory.

## Branches and releases

- `main` is the published stable branch. Never edit, commit, merge, rebase, or deploy it
  unless the maintainer explicitly asks for that exact release operation.
- `dev` is the only development branch and exists only on this machine; it is never
  pushed. All implementation work lands on it as focused commits.
- The only remote branch is `origin/main`. Releases are recorded by tagging `main` with
  `vX.Y.Z`; tags are created only after a maintainer-reviewed merge from `dev` and only
  when the maintainer explicitly asks for that release.
- Merging into `main`, pushing `main`, and creating a tag are three separate
  authorizations. Never perform one because another was granted.
- Preserve unrelated user changes. Never hide them with stash, reset, checkout, or clean.

## New tools

When adding, scaffolding, reviewing, or continuing a tool under `apps/`, explicitly use
the repository skill at
[`.agents/skills/develop-toolbox-tool/SKILL.md`](./.agents/skills/develop-toolbox-tool/SKILL.md)
and follow [docs/NEW_TOOL.md](./docs/NEW_TOOL.md). The skill is procedural; the document
is the canonical product and platform contract.

The maintainer only needs to describe the desired tool in ordinary product language. The
agent must invoke the skill itself, infer the internal brief and safe defaults, and avoid
asking the maintainer to repeat repository rules or fill out a template. Tool work is
committed to local `dev`; review against `main`, the merge itself, the push, and the
release tag are separate maintainer-controlled steps described in
[docs/RELEASE.md](./docs/RELEASE.md).
