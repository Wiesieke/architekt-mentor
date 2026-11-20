# CHECKPOINT — Weekly workshop — 26 October 2026

Publication decision: BLOCKED. This records real preparation, not a complete issue, human approval or delegated release. Human reviewer: null; personal publisher approval: null; delegated release approval: null.

## Starting point and scope

- Main read at `088b86d3734e7cefa3de5b168c8740b4fcde24ba`; policy PR #65 is merged.
- PR #67 read with comments and three successful historical workflow runs for `a6d0f2e280065433d9c1fff96524c2a366917753`. Preserve those historical results; they are not evidence for this new revision.
- PR #60 is merged; Weekly 19 October is not republished or relabelled.
- Current candidate is still a workshop in PR #67, with no public issue date or index entry. Its exact new SHA and fresh remote check results are recorded in the dated PR checkpoint after push.

## Three stages completed in this pass

1. Interactive quick choice: no-selection guidance, three options, explanation per option, repeatable choices, toggleable hint and focused feedback. This evaluates only a selected option; it does not score reasoning.
2. Separate initial and follow-up reasoning fields: users do not have to overwrite their first answer. Switching modes hides panels without rebuilding them. The drafts stay in memory only; no network call, cookies or browser storage. Reloading/changing language clears them; the UI says so explicitly. There is no fake AI mentor or automated reasoning score.
3. Five new tests in the existing CI-discovered `comments*.test.cjs` suite, plus fresh local tests and builds. This naming keeps them in the existing test command without changing CI permissions or publication gates.

New files: `src/data/weekly-decision.json`, `src/lib/weekly-decision.mjs`, `src/components/WeeklyDecision.astro`, `tests/comments-weekly-preview.test.cjs`.

The workshop route embeds the component before the full textual options/analysis. The text is retained as a JavaScript-free fallback. This is intentionally not registration in the production exercise/mentor API datasets.

## Editorial/factual review performed

Authoring pass only: PL/EN choice IDs, preferred option B, conditional validity of A/C, incompatible `awaiting-check` state and manual-intake assumption are aligned. Replaced Polish “pracowników kolejki” with “procesy obsługujące kolejkę”, “cofnięcie binariów” with an explicit reference to restoring the previous code release, and corrected “nieopublikowany”. This is not an independent language review.

Primary sources reopened 26 October 2026:

- https://openfeature.dev/specification/sections/flag-evaluation/ — evaluation/fallback behaviour, not a business rollback guarantee.
- https://openfeature.dev/specification/sections/events/ — provider state events, not evidence that all business work has stopped.
- https://docs.getunleash.io/guides/best-practices-using-feature-flags-at-scale — distributed evaluation consistency guidance.

The scenario, choices, conditional ADR and rehearsal remain fictional educational synthesis. No employer project data, identifiable cases, quotations, third-party graphics, asserted implementation results or new AI calls. Rights/confidentiality authoring check: passed for the changed scope. No artwork is required for this interaction; no asset-rights claim is inferred for the rest of the catalogue.

Architecture in motion remains TODO for the complete issue. No news has been approved by this pass and no claim is made that no worthwhile news exists. Renew facts/status/dates before eventual publication.

## Actual local verification before push

- `node --test tests/*.test.cjs`: 59 passed, 0 failed (54 existing + 5 new).
- `VERCEL_ENV=preview npm run build`: passed, 167 pages, moderation context for 94 articles.
- `VERCEL_ENV=production PUBLIC_SITE_INDEXABLE=true npm run build`: passed, 165 pages.
- Both editorial reading routes are absent from the production-mode output.
- `node scripts/check-editorial-publishing.mjs`: passed for the existing latest exercise, not a certification of this draft's production API registration.
- `git diff --check`: passed.
- New event-contract tests use a small DOM fake; they do not constitute mobile, rendering or full accessibility QA. Live browser results must be recorded separately in the PR checkpoint.

## Operational gate

26 October read-only GitHub API checks: rulesets HTTP 200 with empty list; classic main protection HTTP 401 requiring authentication. This does NOT prove protection is absent, nor verify enforcement. No credentials extracted, rules changed or bypass attempted. Existing green CI alone is insufficient to close the enforcement gate.

## Remaining work, in order

1. Independently review PL/EN wording and assumptions, with actual reviewer/tool provenance; do not self-certify independence.
2. Select and fully source one useful Architecture in motion analysis, or explicitly approve an issue without it. Review current catalogue before adding content.
3. Integrate the approved exercise into the existing production datasets/mentor API contract; test API error paths and both languages without changing model configuration.
4. Confirm enforced main protection and the exact-SHA release-evidence gate; then run complete issue-level technical/editorial QA. Until then, keep PR #67 draft.

No merge, production deployment, newsletter, email, additional schedule or generator API invocation in this pass.
