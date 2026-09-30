# AI-moderated comments

Flow: Turnstile → persistent manual queue → OpenAI Responses API → approved / rejected / manual review.

The comment is never public before the AI decision is applied successfully. The browser refreshes the discussion after approval. Uncertain results, API failures, missing keys, refusals, truncated/malformed output and failed decision writes use manual moderation. Respectful disagreement, technical criticism and brief thanks are allowed; this is moderation, not answer scoring.

## Configuration

Existing LH.pl bridge and schema are reused without an upload or database migration. Existing `TURNSTILE_SECRET_KEY`, `PUBLIC_TURNSTILE_SITE_KEY`, `LH_STORAGE_URL`, `LH_STORAGE_TOKEN` and `COMMENT_ADMIN_PASSWORD` remain required. SMTP is no longer required for new comments.

Set `OPENAI_API_KEY` in Vercel for automated moderation. Optional `COMMENT_MODERATION_MODEL` overrides the default `gpt-4.1-mini`; choose a Responses model that supports structured outputs. With no key the authenticated moderation panel shows a configuration notice and submissions go to manual review. No secret appears in browser code or Git.

`npm run build` regenerates `api/_comment-context.json` from built PL/EN article pages, so the server checks that the article exists and supplies its own context. The visitor cannot supply or override article context. Only comment text and display name are sent to OpenAI, alongside the published article excerpt; email and source hash stay out of the AI request. Requests use `store: false`. Conservative confidence thresholds are subjective model estimates, not measured probabilities or an accuracy promise.

## Compatibility with LH.pl

The deployed schema retains physical states `email_pending`, `pending`, `approved`, `rejected`. New submissions call `create`, then server-side `verify` using a random token that is never sent to the visitor. This moves the stored comment into `pending` before calling AI, so failed AI calls remain available to the moderator. `verified_at` on new records is a technical queue-entry timestamp and does **not** establish ownership of the email address. New comments have no email-confirmation step. Old confirmation links continue to work and lead to manual review.

A failure/crash between create and the queue transition reports failure if possible; the legacy `email_pending` row remains unpublished and is removed by the existing cleanup schedule. No background retry worker is introduced. Decision writes only update `pending` rows, so concurrent manual decisions cannot be overwritten by AI.

The existing durable bridge limit remains three submissions per source hash or email in 24 hours, checked before spending on AI. The existing count-and-insert limit is not transactional and remains best effort under simultaneous requests. No newsletter subscription occurs.

## Moderator and verification

`/api/comment-admin` keeps Basic Auth, same-origin checks, HTML escaping and manual approve/reject. It shows the queue size (first 100), dates and article links. The current bridge exposes only pending comments to this panel; published/rejected history and a persisted AI decision audit require a later bridge upgrade.

Run `npm run build` and `npm run test:comments`. Tests cover decision gates, publish/reject/review, AI failures, refusals, malformed output, storage errors, bot checks, article allowlist and rate limit ordering. Mocks verify that private email/source identifiers are not sent to AI. After deployment submit a real comment in each edition using Turnstile to verify live model access and end-to-end publication. Mock tests do not establish live API availability or moderation quality.
