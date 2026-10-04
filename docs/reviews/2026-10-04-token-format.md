# Editorial review — 4 October 2026

human review: pending
Base: main 7fcd85c2a06e6f53ba99c61f0c43fec6b7b13b69.

## Scope and contribution

One bilingual Architecture in motion article, not a mandatory four-item batch. This is a concrete verified development following the 3 October API compatibility lesson. It adds an end-to-end credential-path checklist, distinguishes synthetic transport testing from provider acceptance, and checks redaction and renewal. A new generic compatibility foundation/exercise would repeat yesterday's learning goal; the separate least-privilege exercise remains a future proposal. No new puzzle or anti-pattern is claimed in this draft.

PL: GitHub zmienił format tokenów: sprawdź całą ścieżkę poświadczenia
/architektura-w-ruchu/github-tokeny-instalacyjne-format/
EN: GitHub changed its token format: check the complete credential path
/en/architecture-in-motion/github-installation-token-format/

Learning goal: verify storage, transport, masking and renewal after a credential-format change without expanding scope or exposing secrets.
Provenance: primary-source product announcement; explicitly fictional worker example. No confirmed customer outage, private workplace material or author's personal involvement claimed. Proposed test procedure, not an executed integration test.

## Source review

Checked 4 October 2026:
- GitHub announcement, event date 2 October: https://github.blog/changelog/2026-10-02-stateless-github-app-installation-tokens-rolled-out/
- GitHub token issuance and scope: https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app
- Historical temporary-header introduction: https://github.blog/changelog/2026-05-15-github-app-installation-tokens-per-request-override-header/
- OWASP logging: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html

Confirmed: rollout complete; prefix retained; approximately 520 rather than 40 characters; scope, permissions, expiry unchanged; temporary header retirement 30 November. Do not treat 520 as a guaranteed maximum or infer that other token types changed. Recommendations and test design are editorial interpretation.

## News screening, 27 September–4 October

- Selected: GitHub installation tokens, 2 October. Operational compatibility and secret redaction; concrete checks available.
- Candidate: Google Cloud Monitoring legacy-agent end of support, 28 September, and application topology graph GA, 30 September. Source: https://docs.cloud.google.com/monitoring/docs/release-notes . Not fully expanded into a migration article in this revision.
- Candidate: Apigee release 2 October, JWKS cache refresh and policy failure-response changes. Source: https://docs.cloud.google.com/release-notes . Requires product-specific follow-up; not treated as universally available because rollout may take multiple business days.
- Candidate: GitHub security advisory GraphQL fields and comments API public preview, 2 October. Changelog reviewed; lower priority than token handling for this edition.
- AWS/Azure catalogue pages opened but rendered mostly dynamic listings; no verified event selected from them. Kubernetes and OpenTelemetry blog indexes opened; no dated item selected. PostgreSQL news fetch failed. These limitations do not establish that those ecosystems had no news.

## Review decisions

1. Is the distinction between a synthetic transport test and a real provider acceptance test clear enough?
2. Should the scope/expiry paragraph include a stronger reminder that changing token format does not widen authorisation?
3. Does the dry observation about logging a header fit the editorial voice?

## Gate

Human reviewer: pending
Reviewed revision: pending
Decision: draft
Approval evidence: pending
Production and newsletter remain untouched. Existing PR #30 and #3 unchanged.
