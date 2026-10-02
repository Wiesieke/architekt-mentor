# ArchitectMentor editorial policy

Effective 2 October 2026. Approved by Wiesław Ejsymont. Applies to articles, exercises, anti-patterns, tutorials and event recommendations in both languages.

## Purpose and original contribution

Publish to help a reader make a concrete architectural decision. Each item must identify its learning goal and contribute a useful example, reasoning, consequences, a comparison or a way to verify the result. Generic summaries, cosmetic rewrites and pages created mainly to capture search traffic do not qualify. Check the existing catalogue; improve or consolidate a useful article rather than duplicate it. There is no minimum publication quota.

## Evidence and provenance

Check technical claims in primary sources. Link to relevant documentation, incidents or organizer pages; record dates and distinguish fact, interpretation and assumption. Never invent references, benchmark results, model calls, client projects, outcomes or first-hand experience. Use “Practice-inspired educational scenario” only when a confirmed source supports the scenario. Otherwise explicitly use “Fictional educational scenario” or “Composite educational scenario”. Remove confidential and identifying details; anonymization alone does not prove a source is safe to publish.

## Human review is the publication gate

AI may research, draft, translate and perform preliminary checks. These checks are not human editorial approval. Wiesław must review the specific final material before publication. Existing general permission to publish on a schedule does not satisfy this gate. Daily and weekly runs prepare draft PRs and a review summary; they must not merge, deploy the content to production or send a newsletter while awaiting approval.

Approval must identify the material or PR and revision reviewed. Subsequent substantive edits require renewed review. Technical fixes to an approved article may proceed within the authorized scope; a new claim, changed recommendation or new scenario is substantive. Record approval in the PR or review record, not in a fabricated byline. Never add a “Reviewed by” label to an item without evidence of that review. Existing articles are not retroactively marked reviewed.

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
- Human approval of this revision is recorded before production publication.

## Review record (include in the draft PR)

Material and permanent PL/EN URLs:
Learning goal and original contribution:
Provenance (confirmed practice / composite / fictional / sourced report):
Primary sources and dates checked:
Checks completed and remaining uncertainties:
Human reviewer: pending
Reviewed revision: pending
Decision: draft / changes requested / approved
Approval evidence: pending

Pending is an actual blocking state. A checkbox completed by AI cannot replace the human fields. After approval, publish only the reviewed content, verify production and record the deployed revision.

## Corrections, transparency and commercial relationships

Explain AI assistance and responsibility on /jak-powstaja-materialy/ and /en/editorial-policy/. Label the provenance of individual scenarios accurately. Material corrections should identify what changed and when; do not refresh dates without a substantive change. Allow substantive criticism and reports of errors. Sponsors and partnerships must be clearly disclosed and must not override editorial judgment. Do not promise search rankings or revenue.

## Existing catalogue and recurring work

Maintain a review backlog for existing materials, starting with factual claims, first-hand narratives, external news and diagram accuracy. Do not claim the backlog is completed. Prepare daily; publish after the gate, even when this reduces frequency. Events follow the same review rule, with organizer facts checked again before publication. The event pilot plan and technical measurement details belong in internal documentation, with appropriate data notices on the dedicated public page.

Reference guidance checked 2 October 2026:
- https://developers.google.com/search/docs/fundamentals/using-gen-ai-content
- https://developers.google.com/search/docs/essentials/spam-policies
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content

## How Wiesław reviews a draft

The run summary must include permanent titles and PL/EN pairs, a readable Vercel Preview URL, the draft GitHub PR, the reviewed commit, and a short review checklist. Verify that Preview actually displays the draft; never present the production page as a preview of unpublished content. State any access restriction and provide a readable draft as a fallback. Wiesław can review prose in Preview without reading code. His response in the conversation or on the PR can approve a specific PR/revision, request edits or approve only named materials. Record that response and the revision before merging. Partial approval requires publishing only approved items, with a separate commit/PR if needed. Recheck the final diff against the approval; substantive later edits require a new review.
