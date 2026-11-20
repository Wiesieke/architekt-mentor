# ArchitectMentor — Cloudflare recovery (20 Nov 2026)

## Evidence and scope
- The Astro site is static and may render correctly even when dynamic API routes do not exist.
- The existing `api/*.js` are Vercel Node request/response handlers. The new `functions/api/*.js` map the **same route paths** to Cloudflare Pages Functions, preserving validation, OpenAI model selection, user consent and LH HTTPS storage.
- This change does **not** move MySQL or Desk away from LH.pl; it does not change MailerLite lists.
- Deployment remains **not verified** until preview builds, no-cost method checks, a limited real HLD generation and an opted-in test write pass.
- Do not automatically merge this recovery PR. Do not disable the original site or remove the Vercel domain until Cloudflare production tests pass.

## Prerequisites: Cloudflare Pages
1. The Git-connected `architekt-mentor` Pages project builds `Wiesieke/architekt-mentor` with `npm ci && npm run build && node scripts/cloudflare-static-preflight.mjs` and publishes `dist`. Test the recovery branch in Preview before switching the production branch from `ops/cloudflare-pages-migration-20261115` to `main`.
2. In the Pages **Preview** settings, set the compatibility date to `2026-11-20` or later and add the explicit `nodejs_compat` flag. Pages Git builds used Wrangler `3.114.17`, which could not resolve Node built-ins without the flag even though the newer local test passed. Retry the failed Preview build after saving. Apply the same compatibility settings to **Production** when preparing the verified production deployment.
3. Add secrets in Cloudflare Pages **Production and Preview** settings, not in GitHub or source code: `OPENAI_API_KEY`, `LH_STORAGE_URL`, `LH_STORAGE_TOKEN`. To enable comments also set `TURNSTILE_SECRET_KEY`, `COMMENT_ADMIN_PASSWORD` (and optional `COMMENT_MODERATION_MODEL`). To enable enquiries add `LH_SMTP_HOST`, `LH_SMTP_USER`, `LH_SMTP_PASSWORD`, but validate Nodemailer/TCP support separately; do not assume SMTP works in the edge runtime. Keep the public `PUBLIC_TURNSTILE_SITE_KEY` available during Astro build.
4. Never copy credentials into README, commit history, issues or chat. Rotate any credential accidentally disclosed.

## Smoke tests, in safe order
1. Run the adapter tests, the Astro build and static preflight, and the Pages Functions bundle using the version reported by the Git build. CI checks that bundle using Wrangler `3.114.17` and the explicit `nodejs_compat` flag, then exercises the routes locally.
2. Visit `/api/health`: HTTP 200 with `configured` means **configuration exists**, **not** that OpenAI/LH works. HTTP 503 means required bindings are missing. This endpoint never checks database contents.
3. GET `/api/generate` should yield JSON HTTP 405; GET `/api/evaluate-puzzle` should yield 405. A 404, HTML fallback or Vercel pause screen means Cloudflare Functions are not mounted.
4. Generate one non-sensitive dummy HLD, with saving **off**. Test one short fictional puzzle with `saveAnswer=false`. Verify a real AI response and cost ceiling on the provider side.
5. With explicit operator consent and synthetic data, switch saving on for one HLD and one puzzle. Confirm `saved:true` and records in the separate `serwer428682_architektmentor` MySQL database, then verify 90-day cleanup cron. No real user data in tests.
6. Test comments in PL/EN with Turnstile from the actual preview hostname; add that hostname in Turnstile allowlist and verify consent and moderation. Review cross-origin and rate-limit protection.
7. Confirm MailerLite PL/EN forms load, double opt-in, group assignment, confirmation and unsubscribe. HTML rendering alone does not prove delivery. Check campaign scheduling in MailerLite separately.
8. Test protected LH Desk login/TOTP, Radar RSS and EA, recent imports, MySQL writes and publication queue. Read authenticated `release-cron-status.php` heartbeat; `success` from GitHub may just mean `No pending release`.
9. The existing CI publication gate in `.github/workflows/architectmentor-publication.yml` still depends on **Vercel Preview**. Replace this with an independently validated Cloudflare preview gate **before** resuming auto-merge. This PR intentionally leaves that policy untouched rather than silently bypass approval.

## Rollback
Revert the recovery PR in GitHub and redeploy the previous Cloudflare static build. Do not delete LH database tables or rotate production secrets during rollback. Keep approved content and publication queues intact. If Cloudflare Functions cannot bundle a legacy Node dependency, port that specific endpoint to native Workers instead of disabling input validation or secret protection.
