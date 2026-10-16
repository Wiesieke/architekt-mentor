# ArchitectMentor Daily automation — operator setup

## Current scope

GitHub Actions workflow `.github/workflows/daily-draft.yml` prepares a bilingual **draft PR** daily. It does not publish automatically. The existing publication quality gates, checked Vercel Preview, human-review metadata rules, and production verification remain mandatory. The companion `daily-reliability.yml` runs tests/build and checks the index daily; it does not publish either.

## Required configuration

1. In GitHub repository Settings → Secrets and variables → Actions, create `OPENAI_API_KEY` as a repository secret. Never paste it into PRs, issues, logs or chat. Ensure OpenAI API billing/quota are active. ChatGPT subscription does not fund API usage.
2. In Settings → Actions → General, allow workflows to create pull requests (if repository policy permits). The workflow uses scoped `GITHUB_TOKEN` and never requires a personal access token.
3. Verify GitHub Actions scheduled runs are enabled. Schedule `10 4 * * *` is **04:10 UTC**, not 04:10 Warsaw; this corresponds to 06:10 CEST / 05:10 CET. GitHub scheduled execution can be delayed.
4. Run the workflow manually using Actions → ArchitectMentor Daily draft → Run workflow. Confirm a single draft PR, two Markdown drafts and successful diagnostics. Re-running on the same date must not create a duplicate PR.
5. Review and implement the missing publication adapter: convert verified drafts to public Astro pages and index entries, then run CI and inspect an authorized Vercel Preview for the same SHA. No auto-merge until these gates and post-deployment verification are implemented and tested.

## Failure handling

Missing key, API quota/billing error or invalid response: leave production unchanged, open a diagnostic issue when permitted. A failed workflow does not disable future schedules. Investigate GitHub Actions run logs and close resolved diagnostic issues. The system currently checks for an existing PR but does not recover an orphan branch with no PR; that remains a known operational limitation.

## Verification required before declaring end-to-end automation

- Passing Actions on exact head SHA and a successful manual draft generation.
- Correct PL/EN routes, editions index, RSS and sitemap.
- Authorized Vercel Preview and production project mapping.
- Verified production deployment SHA and rendered pages.
- Recovery drill for API outage, duplicate run, failed CI, and missing Preview.
