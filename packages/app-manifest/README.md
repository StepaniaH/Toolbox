# @toolbox/app-manifest

Canonical public catalog for Toolbox applications. It owns app identity, route,
navigation labels, short descriptions, localized search keywords, canonical outline icons,
and release visibility.

- `hidden` is the default for new entries.
- Only `stable` entries appear in the Homepage and global navigation.
- `keywords.zh` and `keywords.en` contain localized user vocabulary used by the global
  tool search. Keep concepts in their own language and avoid marketing keyword stuffing.
- `TOOLBOX_RELEASE` is the shared user-facing release label; the contract checker keeps it aligned with the root package version.
- The manifest contains public product metadata only; deployment and environment
  details do not belong here.
