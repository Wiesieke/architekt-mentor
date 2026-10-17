# Editorial workflow — human-approved publishing (17 October 2026)

## Roles and evidence

ChatGPT: prepares complete PL/EN drafts, source notes, branch and draft PR; runs checks; never records human approval.
Publisher/editor responsible: Wiesław Ejsymont. Edits in VS Code or GitHub, reviews Vercel Preview, checks PL/EN, and explicitly approves the final SHA.
GitHub Actions: technical checks; green checks are not editorial approval.
Vercel: Preview on PR; production only after authorized merge.

## Daily procedure

1. AI opens one draft PR for the day, with final PL/EN pages, source links, quality checklist and Vercel Preview.
2. Publisher opens the PR branch in VS Code (GitHub extension or `git fetch && git switch <branch>`), edits the HTML or submits change requests in the PR. Every edit produces a new commit and re-runs checks.
3. Publisher reads the actual Preview in PL/EN. To approve, record `APPROVE PUBLICATION: <full 40-character HEAD SHA>, PL + EN, <issue/date>` in an authenticated GitHub PR comment or explicitly in conversation. A GitHub APPROVE review on the exact HEAD is preferred, with an independent authorized reviewer if branch rules require one.
4. After approval, verify that the PR HEAD is unchanged, all required CI checks are green and Preview READY for that SHA. Only then may an authorized operator merge. Confirm production SHA and both HTTP pages.
5. If any publication content changes after approval, invalidate the old approval and request a new one. Failed checks or missing approval mean no merge, no release. Keep the PR open.

## Mandatory GitHub repository settings (owner action)

Settings → Rules → Rulesets → New branch ruleset (or Settings → Branches → Add branch protection rule), target `main`:
- Require a pull request before merging; block direct pushes.
- Require at least one approving review from a genuinely authorized human; dismiss stale approvals when new commits are pushed. Do not allow the automation actor to satisfy this requirement.
- Require status checks `ArchitectMentor publication gates` and `ArchitectMentor Daily reliability` (select actual job names from successful PR runs).
- Restrict bypass to the minimum; prevent automation credentials from bypassing the rule.
- Enable the ruleset and test it with an unapproved PR and an outdated approval.
- Check whether the repository plan and ownership support enforced rulesets; if unavailable, treat human approval as a process gate only, not a technical lock.

GitHub does not treat a PR review from its own author as an independent required approval. If Wiesław is also the PR author, arrange a separate authorized reviewer or an enforced custom approval check bound to the publisher's authenticated decision. Do not silently bypass this constraint.

## SEO and transparency

Public pages: /jak-powstaja-materialy/, /en/editorial-policy/, plus dedicated manifesto /o-nas/zasady-redakcyjne/ and /en/about/editorial-policy/. Link from site footer. Structured AboutPage/Organization data must reflect actual roles. Historic issues are not retroactively marked human-reviewed.

## Limitations

A PR containing these policies does not change GitHub Settings or protect `main` until the owner activates the rule. Vercel Preview READY is not proof of publication. Do not merge this governance PR without the publisher's approval.
