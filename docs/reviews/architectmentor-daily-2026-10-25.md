# ArchitectMentor Daily — 2026-10-25 — editorial evidence (draft / blocked)

This is a machine-prepared, non-human review record. It does not authorize release. The exact final commit SHA and CI run IDs must be attached in a subsequent PR comment after all edits. Any later commit invalidates those results.

## Scope and original contribution
- PL: `/podstawy-architektury/baggage-nie-jest-autoryzacja/`
- EN: `/en/foundations/baggage-is-not-authorization/`
- Goal: distinguish W3C/OpenTelemetry telemetry propagation from authorization context at multi-tenant trust boundaries.
- Fictional scenario: an invented multi-tenant application portal. No customer or employer-specific infrastructure or incidents.
- Added value versus catalogue: the existing tenant-isolation article covers end-to-end access boundaries; this issue focuses on an untrusted telemetry header crossing a boundary, with three architectural options, a boundary contract and five concrete acceptance tests. Not a rewrite of the earlier article.

## Source verification — 25 October 2026
1. W3C Baggage, https://www.w3.org/TR/baggage/ — Security Considerations, Information Exposure and Privacy sections describe propagation risks and trust boundaries.
2. OpenTelemetry Baggage, https://opentelemetry.io/docs/concepts/signals/baggage/ — describes key/value propagation, potential sensitive-data exposure and lack of built-in integrity protection.
3. OpenTelemetry Context Propagation, https://opentelemetry.io/docs/concepts/context-propagation/ — separates trace propagation from arbitrary baggage and warns about untrusted inbound and outbound context.
The proposal to derive authorization context from verified identity and to prohibit baggage from granting access is the article's architectural recommendation, not a quoted normative requirement of W3C Baggage.

## Editorial / rights / confidentiality
- Original PL/EN explanatory prose and invented scenario; no quoted long passages, reused diagrams or images. No third-party graphics included; image licence clearance not applicable.
- No internal company names, confidential project details, identifiable persons or unpublished vendor information.
- No external plagiarism-detection service run; originality assessment is a catalogue and source-comparison review, not a guarantee.
- Both language versions written and cross-checked for equivalent examples, alternatives, caveats and tests by AI. **Independent PL/EN language edit is not evidenced.**
- Human author/reviewer: null. Human approval: null. Delegated decision: **BLOCKED**, not a release authorization.

## Technical and governance blockers
- PR #65 delegation policy was merged on 2026-10-25; CI on the new article must be checked against the exact final SHA.
- GitHub rulesets endpoint returned an empty array; classic branch-protection read returned HTTP 403 to the integration. Non-bypassable branch protection and required check enforcement cannot be verified.
- Preview can report READY and protected-preview CI can pass, but direct external PL/EN HTTP access has not been independently verified.
- No merge, production release, newsletter or email may occur until all editorial, independent-language, rights, technical, preview and governance gates are verified and recorded.
