# ArchitectMentor Daily — publication failure recovery

This runbook complements `docs/editorial-policy.md` and `docs/publication-authorization.json`; it never overrides their gates.

1. Read current `main`, publication authorization, Working Context, catalogue, open PRs and recent editions. Prepare at most one candidate per calendar day; reuse an existing candidate instead of creating a duplicate.
2. Create or reuse a dated editorial branch. Record branch, base SHA, candidate paths and expected changes. Before each write, check whether the path exists; update with its blob SHA or create only if absent. Never write to `main` directly.
3. On API errors record operation, HTTP status, message and target path (redact secrets). For 401/403 check connection/permissions and stop on explicit policy denial. For 404 verify repo/ref/path. For 409/422 re-read branch and path, check for already-completed writes and conflicts. For 429 honor retry guidance. For 5xx or transport failures re-read state before bounded retry. Do not bypass security controls or force-push.
4. If a write response is ambiguous, fetch the intended file and compare its content before retrying. If PR creation fails, search for an existing PR with the same head before retrying. Preserve drafts and report unresolved blockers.
5. Run applicable checks against the exact candidate commit: content/provenance/confidentiality, PL/EN parity, duplicates, links, registry, editions.ts, RSS/sitemap, tests and build. Check CI conclusion for the current SHA; an empty workflow_runs list is NOT success.
6. Verify an authorized Vercel Preview for the same SHA and inspect the actual pages. If deployment protection prevents authorized access, stop. Never substitute production for unpublished Preview.
7. Merge only after all applicable gates are green, with actual review metadata (null unless performed). Verify production content and deployed SHA, then add a short topic pointer to the Weekly bank; never copy the full article.
8. A failed publication must not disable the recurring schedule. No email or newsletter sends are part of Daily.

For any failed run report exact operation, error, retained branch/PR, last confirmed SHA, CI/Preview/production state, and next corrective action. Do not claim that a passing connectivity probe proves future reliability.
