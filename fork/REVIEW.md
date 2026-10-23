# Initial review — 23 October 2026

Baseline: upstream commit `87d790a30d8c072c7d84041afce3bc84528f1118` (application version 3.2.1).

This is an initial source and dependency review, not a penetration test or a claim that the application is secure.

## Confirmed source finding addressed

PDF form-button JavaScript was passed to `new Function` after a keyword blacklist. That blacklist did not isolate document code from the application's JavaScript environment. A harmless isolated baseline probe confirmed access outside the supplied mock PDF API. Exploitation in the packaged Mac app, access to native capabilities and data exfiltration were not tested.

The fork removes evaluation from that path. A full-string recogniser translates only supported single Print, Save and Reset commands into application actions. Expressions, arguments, multiple statements and unknown scripts are rejected with a user-facing warning. Tests cover supported commands and rejection of unsupported code. This reduces script compatibility intentionally; it is not a replacement Acrobat JavaScript interpreter.

## Dependency scan

The locked frontend dependency audit returned 33 affected package entries: 5 critical, 24 high and 4 moderate. These are dependency graph counts, not 33 independently exploitable application vulnerabilities.

With development dependencies omitted, the audit returned 8 affected package entries: 7 high and 1 moderate. Entries included follow-redirects, http-cache-semantics, React Router, smol-toml, source-map-js and Vue-related packages. Some packages are bundled only for particular environments or reached indirectly. Reachability and platform impact remain to be assessed before assigning application severity.

The critical findings in the full audit involved development tooling, including Storybook and the tinypool dependency chain. Development servers should remain local while these are triaged. No automatic major-version upgrades were applied.

An OSV scan checked 666 registry packages from the Rust desktop lockfile and returned advisory matches for 27 package/version entries. Matches include unmaintained dependencies, platform-specific dependencies and security advisories; multiple IDs can describe the same issue. Rust package matches are not automatically Mac vulnerabilities. Tauri, TLS/HTTP and archive dependencies should be prioritised for applicability review.

The Java dependency graph and native PDF/OCR binaries have not yet received a resolved-version vulnerability scan. A complete dependency review remains outstanding.

## Secret scan

Gitleaks 8.30.0 scanned approximately 87 MB of working-tree content and returned 28 redacted candidates. Paths include test certificates/private keys, test credentials, documentation, workflow strings and public client/analytics keys. These are candidates requiring triage, not 28 verified leaked production secrets. No credential was tested, used, rotated or published by this review.

## Other source boundaries inspected

- The PDF external-link helper already restricts protocols to HTTP, HTTPS and mailto.
- The desktop local binary proxy validates loopback hosts and disables redirects.
- Markdown ZIP extraction normalises paths and checks that extracted entries remain within its temporary directory.

Those observations describe the inspected paths, not a guarantee about all equivalent paths or all input validation.

## Verification

- New focused regression suite: 21 tests passed (OCR loading/retry/ordering/selection and PDF button command recognition).
- Core and default frontend TypeScript checks passed.
- Frontend lint and format checks passed.
- The required `task frontend:check` ran 7,330 tests: 7,328 passed and two failed under the full run. Both failing files passed on an isolated single-worker rerun (17 tests). The complete gate is therefore recorded as not green, rather than silently treating reruns as a clean full run.
- The two files were `CreateSessionFlow.test.tsx` (timeout) and `PipelineStepSettings.test.tsx` (render assertion).
- The additional final OCR empty-state and script-rejection cases were covered by the focused suite after the full run.
- The locale TOML sorter and comment checks passed.
- `task pre-commit:fix` was attempted but could not start its Python tools because `uv` is unavailable. Locale formatting was checked directly with the repository's sorter instead.
- No Mac build, installer signing, backend integration tests or real-document visual tests were performed. The current deliverable is source changes for review, not a tested replacement desktop release.
