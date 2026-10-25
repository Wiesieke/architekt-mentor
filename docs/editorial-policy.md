# ArchitectMentor editorial policy

Effective 2 October 2026. Approved by Wiesław Ejsymont. Applies to articles, exercises, anti-patterns, tutorials and event recommendations in both languages.

## Purpose and original contribution

Publish to help a reader make a concrete architectural decision. Each item must identify its learning goal and contribute a useful example, reasoning, consequences, a comparison or a way to verify the result. Generic summaries, cosmetic rewrites and pages created mainly to capture search traffic do not qualify. Check the existing catalogue; improve or consolidate a useful article rather than duplicate it. There is no minimum publication quota.

## Evidence and provenance

Check technical claims in primary sources. Link to relevant documentation, incidents or organizer pages; record dates and distinguish fact, interpretation and assumption. Never invent references, benchmark results, model calls, client projects, outcomes or first-hand experience. Use “Practice-inspired educational scenario” only when a confirmed source supports the scenario. Otherwise explicitly use “Fictional educational scenario” or “Composite educational scenario”. Remove confidential and identifying details; anonymization alone does not prove a source is safe to publish.

## Delegated editorial approval and publication gate (effective 25 October 2026)

ArchitectMentor is an independent expert-education publication. AI tools may support research, drafting, translation, illustrations, editing and technical checks. AI is not the publisher and may not certify that a human reviewed any text.

Wiesław Ejsymont remains the responsible publisher and retains the right to intervene, edit, pause or revoke the mandate. By explicit publisher instruction on 25 October 2026, routine Daily and Weekly releases may be approved by the delegated editorial automation without Wiesław's per-commit approval, but only after all mandatory editorial, linguistic, legal, technical and production-preview checks pass on the exact release SHA. This is delegated release authority, not a claim that Wiesław personally reviewed an issue. Every commit change requires a fresh full gate.

Before a successful quality decision, automation may only create/edit a branch, draft PR and Vercel Preview. Merge and production release require an exact SHA-bound release record containing primary-source verification, PL/EN independent language review, provenance/confidentiality/legal and image-rights review, content quality assessment, passing automated checks, working PL/EN Preview and explicit no-blockers verdict. Record the decision as `delegated-automation`, reviewer `null`, publisher personal approval `null`, with actual timestamps and evidence; never invent human review or infer editorial quality from CI alone. Material marked uncertain or failing a gate must remain draft.

On production, publish a public PL/EN editorial manifesto that accurately explains AI assistance and the publisher's responsibility. Do not retroactively assert personal review of historic articles without evidence. Public structured data should identify genuine authors and publisher, not claim human authorship for unreviewed drafts.

The intended enforced control is a GitHub branch ruleset on main requiring PRs, successful checks and the release-evidence check for the exact SHA; direct pushes and bypasses should be restricted. Human review remains optional for routine delegated releases but mandatory for publisher-paused, confidential, protected/third-party or otherwise escalated material. GitHub repository text and CI alone are not adequate substitutes for enforced branch protection: verify ruleset settings before relying on them. If enforcement cannot be verified, report this as an operational gap and do not claim an end-to-end hardened automatic release.

## Publication checklist

- Learning goal, audience and concrete added value are stated.
- Provenance is supported and honestly labelled; confidentiality is checked.
- Key facts, sources, dates and uncertainty are checked.
- Architectural alternatives, applicability and consequences are explained where relevant.
- PL and EN have equivalent assumptions and correct, natural language.
- Diagrams render and agree with the described responsibilities; rendering alone does not validate an architecture.
- Exercise choices, feedback and evaluation criteria agree; links and build pass.
- Title and promises match the content. HLD output is a draft requiring review, not organizational approval.
- No unnecessary duplication, keyword padding or public indexing of raw user-generated HLDs.
- Applicable publication authorization, exact checked revision, actual checks and deployed revision are recorded.

## Review record (include in the draft PR)

Material and permanent PL/EN URLs:
Learning goal and original contribution:
Provenance (confirmed practice / composite / fictional / sourced report):
Primary sources and dates checked:
Checks completed and remaining uncertainties:
Publication authorization: docs/publication-authorization.json
Checked revision: exact commit SHA
Decision: draft / blocked / ready / published
Human reviewer: null unless an actual review occurred
Human-reviewed revision: null unless an actual review occurred
Delegated publication decision and evidence: null until verified; personal approval evidence: null unless actually provided
Quality/technical checks: actual outcomes, failures and limitations
Deployed revision and production verification: pending until deployed

Any unresolved editorial, language, legal, provenance, artwork, technical, preview or authorization check is a blocker. Delegated approval requires an evidence-linked decision for the final SHA, covering PL and EN and associated assets; it never means human-reviewed. Any later content change invalidates the gate. Publish only the validated scope, verify production and record the deployed revision.

## Corrections, transparency and commercial relationships

Explain AI assistance and responsibility on /jak-powstaja-materialy/ and /en/editorial-policy/. Label the provenance of individual scenarios accurately. Material corrections should identify what changed and when; do not refresh dates without a substantive change. Allow substantive criticism and reports of errors. Sponsors and partnerships must be clearly disclosed and must not override editorial judgment. Do not promise search rankings or revenue.

## Existing catalogue and recurring work

Maintain a review backlog for existing materials, starting with factual claims, first-hand narratives, external news and diagram accuracy. Do not claim the backlog is completed. The existing task schedule controls preparation; this policy does not create a new schedule. Publish only after full editorial, legal, language, technical and preview gates and an exact-SHA delegated release decision. The publisher may require personal approval for any material or pause publication, even when this reduces frequency. Check organizer facts again before publishing event recommendations. The event pilot plan and technical measurement details belong in internal documentation, with appropriate data notices on the dedicated public page.

Reference guidance checked 2 October 2026:
- https://developers.google.com/search/docs/fundamentals/using-gen-ai-content
- https://developers.google.com/search/docs/essentials/spam-policies
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content

## Publication report and delegated release evidence

The run summary includes titles and permanent PL/EN pairs, a verified readable Preview URL, GitHub PR, exact checked/deployed commit, primary sources, checks and remaining limitations. Never present production as a preview of unpublished content. If Preview is unavailable, record that technical block and keep the candidate unpublished.

Wiesław may request edits, review a specific revision or narrow/revoke authorization at any time. Record an actual personal review only when it happens. Under the 25 October authorization, a missing exact-SHA delegated gate report or any unresolved check prevents merging and publishing. Do not claim personal review unless Wiesław actually performed it. Preserve the evidence of checks and corrections for each release.
