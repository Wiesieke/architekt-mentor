# Two-mode educational exercise template

Approved format: 1 October 2026. ArchitectMentor teaches reasoned decisions through approachable, practice-inspired scenarios. Start with one concrete decision, not a full architecture project.

## Editorial brief

- Audience: a reader learning architecture; difficulty Easy or Intermediate.
- One learning objective, a short scenario, one decision question and explicit assumptions.
- Public Polish label: **Scenariusz edukacyjny inspirowany praktyką**. English: **Practice-inspired educational scenario**. Do not add a claim that specific details were changed.
- Remove organisation and product names, personal data, actual transaction identifiers, internal documents, logs, credentials and distinctive operational values. Record source provenance privately; do not turn a proposal or contract discussion into a claimed historical incident.
- Supply both Polish and English versions with equivalent assumptions and learning objectives.
- Link to a specific learning article about the relevant pattern or technique. Explain when the pattern applies and where its guarantees end.

## Two ways to practise

**Quick decision, about two minutes:** three plausible options, one best choice under the stated assumptions, an optional hint and an explanation for every option. An incorrect choice shows its risk and the best choice with reasoning. No AI request, account or answer storage is needed. Avoid obvious joke options; vary the position of the best answer.

**Mentor workshop, about ten minutes:** invite two or three sentences explaining what to do and why. The existing mentor asks one guiding question, accepts a revised answer and scores three reasoning criteria, each 0–2 points, for a maximum of 6. Accept alternative sound decisions supported by the facts. Do not demand a full system design. Senior analysis remains available without AI.

The quick variant is initially visible. Switching modes preserves the typed answer and choice. Feedback receives focus when revealed; after a mentor question focus stays on the mentor response. Every exercise has a permanent named URL in both languages, including the current exercise.

## Authoring fields

Add an entry to `data/starter-exercises.json` with a stable `id` and `pl` and `en` objects. Each locale contains:

| Field | Content |
| --- | --- |
| title, difficulty, goal | Concrete title, Easy/Intermediate level, one observable learning objective |
| scenario, question | Short facts and assumptions, exact educational label, one decision |
| hints, analysis | Guiding prompts; reasoned answer, alternatives, limitations and one useful verification |
| quick.question, quick.hint | One choice question and a clue without a complete answer |
| quick.options | Three unique IDs with text and a separate explanation for each |
| quick.correctId | ID of the best choice for these assumptions |
| criteria | Three unique IDs, reader-friendly labels and scoring guidance |
| learnSlug | Registered learning article slug for this locale |

Register the Polish exercise in `data/puzzles.json` with date, goal, quick data, coach criteria and related learning link. Register English coach content in `data/puzzle-coach-en.json`; the English page imports starter translations through `src/data/puzzles-en.ts`. The mentor API loads these two coach records, so both must agree with the published scenario. The starter file is the editorial reference; registration in the other files is currently explicit, not automatic.

Add the related articles in `src/content/articles/` and `src/content/articles/en/`, register them in `src/data/articles.ts` and `src/data/articles-en.ts`, and include the publication in `src/data/editions.ts`. Use permanent exercise links: `/lamiglowki/{id}/` and `/en/practice/{id}/`. The latest exercise is also exposed at `/lamiglowka/` and `/en/practice/`.

## Review and publication

1. Check anonymisation, source provenance and the precise API or business assumptions. A timeout means an unknown outcome; retry, lookup and compensation depend on the contract. Optional persistence must really be optional before recommending graceful degradation.
2. Verify the three options, every explanation, translated criteria and both learning links. Separate a technique such as change-impact analysis from a formal architectural pattern.
3. Test no selection, every answer, repeated answers, hints and switching modes with an existing draft. Check keyboard focus and mentor error handling.
4. Test hint and score API responses with three criteria, invalid model responses and optional storage consent. Keep older exercises operational.
5. Build, inspect mobile and desktop presentation, check all new internal links, then publish only with production authorisation. Verify the production deployment and all six exercise pages.
6. Update Master Context with the deployed change and the reusable format. Later evaluate completion, use of mentor and return visits before increasing difficulty. These measurements are a roadmap recommendation, not an implemented analytics feature.

## Initial examples

| Exercise | Level | Learning material |
| --- | --- | --- |
| New tablets with the same application | Easy | Change-impact analysis and C4 boundaries |
| A reservation with an unknown outcome | Intermediate | Idempotency, outcome lookup and conditional compensation |
| A usable result when optional saving fails | Easy | Graceful degradation |
