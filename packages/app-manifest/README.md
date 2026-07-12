# @toolbox/app-manifest

Canonical public catalog for Toolbox applications. It owns app identity, route,
navigation labels, short descriptions, canonical outline icons, and release visibility.

- `hidden` is the default for new entries.
- Only `stable` entries appear in the Homepage and global navigation.
- `TOOLBOX_RELEASE` is the shared user-facing release label; the contract checker keeps it aligned with the root package version.
- The manifest contains public product metadata only; deployment and environment
  details do not belong here.
