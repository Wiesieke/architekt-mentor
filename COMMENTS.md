# Moderated comments

This feature is intentionally inactive until the database and secrets are configured. The static pages show “comments will open soon” when `PUBLIC_TURNSTILE_SITE_KEY` is absent. Do not publish a usable form before the bridge, email and bot challenge are ready.

1. Apply only the `mentor_comments` table statement from `storage-bridge/schema.sql` to the existing LH.pl MySQL database. Do not recreate the two existing tables.
2. Upload `storage-bridge/comments.php` and the updated `storage-bridge/cleanup.php` to the same directory as `save.php` on LH.pl. The existing `config.local.php` and `LH_STORAGE_TOKEN` are reused; no credentials go into Git.
3. Create a Cloudflare Turnstile widget for `ejsymont.com`. Set `TURNSTILE_SECRET_KEY` (server secret) and `PUBLIC_TURNSTILE_SITE_KEY` (public sitekey) in the Vercel Production environment. A sitekey is public; the secret must stay on the server. The hostname is checked on the server. No DNS move to Cloudflare is required.
4. Set `COMMENT_ADMIN_PASSWORD` in the Vercel Production environment to a unique random value of at least 24 characters. Existing `LH_STORAGE_URL`, `LH_STORAGE_TOKEN`, and `LH_SMTP_*` settings are reused. Do not send the password in chat or commit it.
5. Redeploy after setting environment variables, then test one comment on each language edition: submission, confirmation mail, pending status, moderation at `/api/comment-admin` (browser Basic Auth; any username and the configured password), public display and rejection. Verify the comments endpoint never returns email addresses.

Moderation remains manual. Only confirmed comments can be approved; no comment is published automatically. Newsletter subscriptions are a separate flow and are not part of this feature.
