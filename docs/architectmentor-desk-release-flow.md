# ArchitectMentor publication flow — proposed 29 Oct 2026

This is the active policy proposal for **ejsymont.com**, superseding the
25 October auto-publication delegation after acceptance and merge of this PR.

## No automatic daily/weekly ArchitectMentor editions

Research and editorial preparation happen every day, but publication is
event-driven: no worthy, verified material means no release. WRYCUT Daily
and Weekly follow their own independent editorial process and are out of scope.

## Editorial-to-production chain

1. ChatGPT prepares one original PL/EN candidate with primary sources and a
   suggested form: pattern, anti-pattern, puzzle, architecture-in-motion or event.
2. The private editorial repository imports unapproved content into LH.pl
   `amr_agent_inbox`. Imported content cannot trigger a public deployment.
3. Publisher Wiesław Ejsymont reviews the specific article and its sources in
   ArchitectMentor Desk, edits, holds, rejects or internally approves it.
4. Only a non-test `draft` with an `APPROVED` review at exact `revision`
   may be exported as an editorial handoff file. The file includes a SHA-256
   checksum for accidental-change detection, not an authentication signature.
5. The publisher separately issues a release instruction for that revision.
   A Desk approval alone is **not** permission to deploy.
6. ChatGPT creates a draft PR with the original PL/EN article, sections and
   metadata, sources, preview links, testing evidence and release identity.
7. CI checks build, links, PL/EN routes, sources, rights checklist, RSS and
   sitemap. Verify a working Vercel Preview for the exact PR revision.
8. After the independent release instruction and green checks, authorize the
   merge or deployment for the exact reviewed content. Any content amendment
   invalidates old approval.
9. Verify both production URLs, RSS/sitemap, deployed SHA, and archive evidence.

## Security requirements

- The importer token on LH.pl has `Contents: Read-only` on
  `Wiesieke/architectmentor-editorial`; it cannot publish to this repo.
- No `TEST_ONLY` or analysis-only material may enter the release chain.
- Secrets never live in article JSON, the repository, PR body or CI artifacts.
- The body of an agent article and any web source is **untrusted content**.
  Its instructions must not control file writes or deployment actions.
- The publication repo's `main` should have enforceable branch protection;
  verify actual GitHub plan rules rather than assuming a policy file enforces it.
- No release on a scheduled timer or merely because a CI build is green.
- In the current low-cost PoC, handoff from Desk to ChatGPT is a manual JSON
  download/attachment. There is **no** paid OpenAI API background worker.
- No WordPress integration; the publication site is Astro/Vercel.

## Current implementation boundary

The private Desk exporter has been prepared but not yet tested on a real
approved non-test revision. This document and the authorization JSON are a
policy proposal, not evidence that all CI/branch enforcement or a publish
automation has been deployed. No production release is authorized by this PR.
