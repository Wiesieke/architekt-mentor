# Weekly preparation record — 25 October 2026

Status: blocked editorial workshop, not an issued Weekly. Continue PR #67; do not create a duplicate issue PR. No delegated release approval has been granted by this run.

## Scope

- New PL/EN draft: Switching it off does not undo its effects / Wyłączenie nie cofa skutków.
- Queue P07 developed into a three-option exercise, three distinct 0–2 mentor criteria, senior reasoning and proposed ADR.
- New 40-minute workshop: compatibility matrix, containment, in-flight work and repair/compensation.
- Curation of 21 October audit and 24 October feature flag publications; no duplication of Weekly 19 October (PR #60 merged and published).
- Preview-only reading routes: `/redakcja/weekly-candidate/pl/` and `/redakcja/weekly-candidate/en/`. No production registration, edition date, RSS entry or official issue number.
- The exercise is a textual candidate, not integrated into starter-exercises or mentor API. Quick-choice interaction, input persistence, API rubric parity and keyboard interaction remain release blockers.

## Source and originality review

Checked 25 October 2026 in primary sources: OpenFeature evaluation API and events, Unleash feature flag best practices, Azure Architecture Center changelog and event-driven cache update reference architecture, AWS Lambda Web Functions announcement of 12 October.

Source URLs are included in the drafts and queue. No third-party images, quotations or copied diagrams. Scenario, options, matrix, rubric and ADR are original fictional educational synthesis; no employer project details, correspondence, identifiers or claimed personal experience. Existing 24 October article covers the operating contract; this candidate adds explicit incompatible state handling, rollback alternatives and a structured rehearsal.

News selection: GitHub lockfiles already covered on 19 October, excluded as a repeat. Azure cache guidance is listed in October but an exact publication day is not established; it remains a radar item, not a GA/Preview service announcement or a verified weekly news article. AWS announcement exists but a full limits/status/architecture analysis has not been completed. Do not claim there is no worthwhile news; research is incomplete.

## Language review

PL/EN drafts compared in this authoring pass for assumptions, options, scope and the 6-point rubric. A separate independent language review is NOT completed or evidenced. Human reviewer: null. Publisher personal approval: null. No claim that CI establishes language quality or factual correctness.

## Technical checks performed locally

- 54 tests passed, 0 failed (`node --test tests/*.test.cjs`).
- Preview build passed: 167 pages. Production-mode build passed: 165 pages.
- Both workshop paths exist in the Preview build and are absent from the production build.
- Production-mode `scripts/check-editorial-publishing.mjs` passed for existing catalogue.
- `git diff --check` passed.
- No generator API calls, emails, newsletter or new schedule.
- Remote exact-SHA CI and readable Vercel Preview must be recorded in PR #67 after push; this document does not pre-certify those outcomes.

## Policy and operational blockers

- PR #65 merged to main as `088b86d3734e7cefa3de5b168c8740b4fcde24ba`; delegated policy now exists on main.
- Public GitHub rulesets endpoint returned HTTP 200 and an empty array. Public classic main protection endpoint returned HTTP 401 (authentication required). These observations do not establish whether classic protection exists. Earlier PR #65 records a 403 on its authenticated protection check.
- No callable GitHub connector operation for reading/configuring protection was available in this run. Do not infer enforcement from mergeability or successful CI; do not change access rules or bypass main protection.
- Current workflows run build/route/Preview checks. They do not establish independent editorial approval or a mandatory exact-SHA release-evidence status by themselves.
- Publication remains BLOCKED pending verified enforcement, independent language QA, complete news selection (if included), integration of the exercise and full issue-level QA on one exact SHA.

The next change must continue this workshop, integrate verified candidates into ONE new-number PR when ready, run all required checks again and preserve existing issues. Documentation preparation is not permission to publish.
