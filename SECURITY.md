# Security Policy

Toolbox is a static, client-side tool suite. There is no first-party backend,
no accounts, and no telemetry. Most attack surface is therefore browser-local:
file parsers (PDF, ZIP, XLSX, HEIC, images), markup sanitization, and the
shared platform packages.

## Supported versions

Only the latest tagged release (`vX.Y.Z` on `main`) receives security fixes.

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting
(**Security → Report a vulnerability** on this repository) rather than a public
issue. Include the affected app or package, a reproduction (input file, URL, or
patch), and the release you tested against.

You can expect an initial response within 7 days. We will credit reporters in
the release notes by default; say so explicitly if you prefer to remain
anonymous.

## Scope notes

- **In scope**: any client-side code execution, sandbox escape in rendered or
  converted output (HTML preview, SVG, PDF), path traversal or decompression
  bombs in archive handling, privacy regressions such as new network requests
  that exfiltrate user input, and supply-chain issues in dependencies.
- **Out of scope**: bugs that require a malicious first-party server (none
  exists), missing features, and self-XSS where the only attacker is the user
  pasting content into their own session.

RateLens is the one approved exception to the no-network rule: it fetches the
current USD/CNY rate from disclosed public services, never sends page input,
and falls back to manual entry. Reports about that flow are welcome too.

## Privacy claims

Privacy is a product guarantee here. If you find any tool sending data beyond
what its UI discloses — including via `config/external-origins.json` gaps —
please report it as a vulnerability.
