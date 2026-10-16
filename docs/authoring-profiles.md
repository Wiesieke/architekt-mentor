# ArchitectMentor — authorship and profiles

- ArchitectMentor is an independent educational and editorial brand, not a claim that multiple contributors already work with it.
- Wiesław Ejsymont is the founder with a dedicated bilingual individual profile.
- Existing articles retain their previously displayed founder credit, now stored explicitly as `authorId: 'wieslaw-ejsymont'`. Review each credit editorially if needed.
- Exercises and anti-patterns without verified personal attribution use the publishing *organisation* `architectmentor`; this is not a fictitious person.
- Author IDs resolve via `src/data/authors.ts`. An invalid ID raises an error.
- Onboarding: verify contributor name, biography and approval for publishing; add their profile with PL/EN fields to authors; set authorId on each publication; confirm both profile URLs and metadata.
- Articles: authorId is mandatory in both language indices. Exercises: set authorId in `data/puzzles.json` after verification; EN translation inherits it. Anti-patterns: set authorId in `data/antywzorce.json`; EN inherits it.
- Daily index links to canonical publications: authorship belongs to articles, puzzles and anti-patterns, not a duplicated issue manifest.
- Do not imply specific personal approval of AI-generated content without evidence. Follow the public editorial policy.
- Collaboration form uses existing SMTP/API workflow; four new categories are recognised alongside prior selections.
