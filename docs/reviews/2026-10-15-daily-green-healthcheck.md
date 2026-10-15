# ArchitectMentor Daily — preflight, 15 October 2026

Material:
- PL: /lamiglowki/2026-10-15-zielony-healthcheck-przerwany-proces/
- EN: /en/practice/2026-10-15-zielony-healthcheck-przerwany-proces/

Learning goal: distinguish component uptime from completion of a user-visible asynchronous workflow; select safe, measurable acceptance signals and a negative test.
New contribution: a three-option decision, error-specific feedback, learner mentor criteria, a controlled failure experiment and PL/EN equivalence.
Provenance: fictional educational scenario, no identified client, technology provider, project or actual incident.
Primary sources: not applicable to this fictional, vendor-neutral design problem; no product announcement, benchmark or historical event claimed.
Duplication: separate from earlier notifications, RPO/RTO, SaaS and cache-isolation exercises; this scenario centres on service SLI and liveness-to-outcome gap.
Confidentiality: no organisational facts or identifiers, no sensitive details.
Linked learning: SLO and asynchronous integration; indexed in editions.ts, Weekly candidate recorded.
Publication authorization: docs/publication-authorization.json
Human reviewer: null
Human-reviewed revision: null
Personal approval: null
Technical checks: pending PR CI, fresh Astro build, Preview PL/EN and production verification. Do not merge while pending.
Checked revision: pending final branch SHA and technical checks.
Decision: draft, technically blocked until verifications pass.
Deployed revision: pending.

## CI outcome 2026-10-15
- Checked branch revision: 28314ae3eed5720a8f8b3d2ab4c3bfe47817afcd
- Workflow: ArchitectMentor publication gates, run 38698343978.
- editorial-quality: SUCCESS (npm ci, npm run test:comments, PUBLIC_SITE_INDEXABLE=true npm run build, scripts/check-editorial-publishing.mjs).
- protected-preview: FAILURE at credentials preflight. GitHub Actions secrets VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID are empty in that run; first specific reported failure is "Missing Actions secret VERCEL_TOKEN".
- Authenticated Preview HTTP check was not performed. No human review or approval claimed.
- Decision: BLOCKED. Do not merge until protected-preview succeeds for latest SHA. Production verification pending.
