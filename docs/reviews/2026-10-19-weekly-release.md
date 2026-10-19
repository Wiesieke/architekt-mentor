# ArchitectMentor Weekly — review record — 19 October 2026

Decision: **draft; human review and approval of the final SHA are pending. Do not merge or publish.**

## Scope and learning goal

Theme: **Green does not mean complete / Zielony nie znaczy zakończony**.

The issue teaches readers to distinguish a healthy component from completed business work, then applies the same evidence-and-control principle to AI actions and CI/CD dependencies.

Five PL/EN pairs:

1. Existing Practice from 15 October: stalled asynchronous process despite green health checks.
2. New Foundation: an evidence ladder from liveness and readiness through progress to the user outcome.
3. New anti-pattern: aggregating component health into a claim that the service works.
4. Existing Architect + AI tutorial from 18 October: action gateway and independent authorisation.
5. New Architecture in motion: GitHub Actions workflow dependency lockfiles, announced 14 October 2026.

Original contribution: the evidence ladder, negative-test plan, operational interpretation of process completion, and a cautious lockfile adoption plan. The Weekly hub connects existing Daily materials without changing their publication dates.

## Provenance and confidentiality

- Practice, Foundation and anti-pattern use a **fictional educational scenario**. They do not claim a particular organisation, client or incident.
- No Totalizator Sportowy name, system, vendor relation, internal value, identifier, correspondence or project outcome is used.
- The AI tutorial already labels its scenario fictional and does not claim a real model test or deployment.
- The lockfile article is a sourced product analysis; product facts and editorial interpretation are separated.

## Primary sources checked 19 October 2026

- GitHub Changelog, 14 October 2026: https://github.blog/changelog/2026-10-14-github-actions-workflow-lockfiles-in-public-preview/
- GitHub Docs — workflow dependency lockfiles: https://docs.github.com/en/actions/concepts/security/workflow-dependency-lockfiles
- GitHub Docs — locking dependencies: https://docs.github.com/en/actions/how-tos/secure-your-work/lock-workflow-dependencies
- GitHub Docs — pilot and enforcement: https://docs.github.com/en/actions/how-tos/administer/enforce-workflow-lockfiles
- Google SRE — Monitoring Distributed Systems: https://sre.google/sre-book/monitoring-distributed-systems/
- Google SRE Workbook — Implementing SLOs: https://sre.google/workbook/implementing-slos/
- OpenTelemetry — traces: https://opentelemetry.io/docs/concepts/signals/traces/
- Existing AI tutorial sources: OWASP Agent Control Standard and Excessive Agency, checked in the source article on 18 October 2026.

## Facts and limitations

- Lockfiles are in Public Preview and subject to change.
- GitHub announced availability for Free, Team and GitHub Enterprise Cloud; enforcement capabilities and Evaluate mode differ by plan.
- Lockfiles cover direct and transitive action dependencies, with the documented boundary for dependencies inside reusable workflows.
- A lockfile fixes a resolved commit; it does not establish that the code is safe and does not replace token permissions, runner isolation, secret controls or review.
- No lockfile command was executed against ArchitectMentor. The article describes a proposed pilot, not a reported implementation result.
- Event catalogue content was not changed in this candidate.

## Technical checks

- `node --test tests/*.test.cjs`: 54 passed, 0 failed.
- `VERCEL_ENV=preview npm run build`: passed; 159 pages and moderation context for 90 articles.
- New PL/EN content routes, both Weekly routes and the preserved 11 October Weekly routes were generated.
- GitHub Actions `ArchitectMentor publication gates` and `ArchitectMentor Daily reliability`: passed for verification candidate `a9d6374202885b4d444d79f2497aad2f7c250aa3`.
- Vercel Preview: READY for the verification candidate. Both Weekly hubs, all four new article routes and both preserved 11 October Weekly routes returned HTTP 200.
- The rendered PL and EN Weekly pages were opened in a browser; the language switch and all five material links point to the expected language-specific routes.
- Both home pages expose the new Weekly title. Both RSS feeds contain the new Foundation. The production-mode build contains both new Weekly routes in the sitemap; the Preview sitemap is intentionally empty because Preview carries `noindex,nofollow`.

## Revision and approval state

- Publication instruction for this cycle requires Wiesław's explicit approval of the final version/SHA.
- Checked content revision: `efc0d100a9dbf22eec9da8af651746ffab14867a`.
- Verification candidate: `a9d6374202885b4d444d79f2497aad2f7c250aa3`.
- Final candidate SHA: the current head of draft PR #60 after this verification-only record update; the exact SHA is recorded in the PR description.
- Human reviewer: null.
- Human-reviewed revision: null.
- Personal approval evidence: null.
- Vercel Preview: READY and checked at https://project-ead46-git-editorial-weekly-2026-10-19-outco-b9dc6c-my-c.vercel.app
- Production revision: none.

Changes after approval invalidate that approval unless they are separately reviewed and accepted.
