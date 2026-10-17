# ArchitectMentor editorial policy

Effective 2 October 2026. Approved by Wiesław Ejsymont. Applies to articles, exercises, anti-patterns, tutorials and event recommendations in both languages.

## Purpose and original contribution

Publish to help a reader make a concrete architectural decision. Each item must identify its learning goal and contribute a useful example, reasoning, consequences, a comparison or a way to verify the result. Generic summaries, cosmetic rewrites and pages created mainly to capture search traffic do not qualify. Check the existing catalogue; improve or consolidate a useful article rather than duplicate it. There is no minimum publication quota.

## Evidence and provenance

Check technical claims in primary sources. Link to relevant documentation, incidents or organizer pages; record dates and distinguish fact, interpretation and assumption. Never invent references, benchmark results, model calls, client projects, outcomes or first-hand experience. Use “Practice-inspired educational scenario” only when a confirmed source supports the scenario. Otherwise explicitly use “Fictional educational scenario” or “Composite educational scenario”. Remove confidential and identifying details; anonymization alone does not prove a source is safe to publish.

## Human editorial approval and publication gate (effective 17 October 2026)

ArchitectMentor is an independent expert-education publication. AI tools may support research, drafting, translation, illustrations, editing and technical checks. AI is not the publisher and may not certify that a human reviewed any text.

The publisher and editor responsible, Wiesław Ejsymont, reviews, corrects and makes the final decision on each new publication, in both PL and EN. Explicit approval must identify the exact final commit SHA and cover both language versions and associated assets. A new content revision invalidates that approval and requires a new decision. A general standing authorization is not approval of a specific issue.

Until approval, ChatGPT may create a branch, draft PR and Vercel Preview; GitHub Actions may run tests. It must not merge, promote a deployment to production or mark a draft as published. Approval must be recorded as genuine evidence (e.g. a publisher-authored PR approval or an explicit approval in a conversation referencing the exact SHA); never invent a human reviewer or infer approval from successful CI.

On production, publish a public PL/EN editorial manifesto that accurately explains AI assistance and the publisher's responsibility. Do not retroactively assert personal review of historic articles without evidence. Public structured data should identify genuine authors and publisher, not claim human authorship for unreviewed drafts.

The intended enforced control is a GitHub branch ruleset on main requiring pull requests, successful checks and a review by an authorized human other than the automation actor; stale approvals must be dismissed on new commits, bypass restricted, and direct pushes disabled. Repository text and CI alone are not an adequate substitute for an enforced branch rule. Configure in GitHub Settings and verify the rule is active before relying on it.

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
Personal approval evidence: null unless actually provided
Quality/technical checks: actual outcomes, failures and limitations
Deployed revision and production verification: pending until deployed

An unresolved quality or technical check is a blocking state. Absent personal review is not a blocker under the current authorization. AI checks remain AI checks; record their outcomes honestly. Publish only the checked scope, verify production and record the deployed revision.

## Corrections, transparency and commercial relationships

Explain AI assistance and responsibility on /jak-powstaja-materialy/ and /en/editorial-policy/. Label the provenance of individual scenarios accurately. Material corrections should identify what changed and when; do not refresh dates without a substantive change. Allow substantive criticism and reports of errors. Sponsors and partnerships must be clearly disclosed and must not override editorial judgment. Do not promise search rankings or revenue.

## Existing catalogue and recurring work

Maintain a review backlog for existing materials, starting with factual claims, first-hand narratives, external news and diagram accuracy. Do not claim the backlog is completed. The existing task schedule controls preparation; this policy does not create a new schedule. Publish after the quality and technical gate, even when this reduces frequency. Check organizer facts again before publishing event recommendations. The event pilot plan and technical measurement details belong in internal documentation, with appropriate data notices on the dedicated public page.

Reference guidance checked 2 October 2026:
- https://developers.google.com/search/docs/fundamentals/using-gen-ai-content
- https://developers.google.com/search/docs/essentials/spam-policies
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content

## Publication report and optional personal review

The run summary includes titles and permanent PL/EN pairs, a verified readable Preview URL, GitHub PR, exact checked/deployed commit, primary sources, checks and remaining limitations. Never present production as a preview of unpublished content. If Preview is unavailable, record that technical block and keep the candidate unpublished.

Wiesław may request edits, review a specific revision or narrow/revoke authorization at any time. Record an actual personal review only when it happens. Under the current authorization, a missing personal review does not prevent publishing a candidate that passes all other gates. Preserve the evidence of checks and corrections for each release.
