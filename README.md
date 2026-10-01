# ArchitectMentor

**A bilingual educational magazine for people learning to make better IT architecture decisions.**

ArchitectMentor brings together practical exercises, architecture foundations, anti-patterns and selected technology developments. It connects technical choices with business goals, risks and ways to verify that a solution works.

Visit the magazine: [English](https://ejsymont.com/en/) · [Polski](https://ejsymont.com/pl/)

## Our mission

Help readers develop architectural judgement: ask better questions, recognise trade-offs and explain decisions clearly. We want to make the experience of practising architects accessible to people entering the field, while giving experienced professionals a place to challenge assumptions and exchange ideas.

The learning approach starts with a concrete situation. Readers propose a decision, examine its consequences and compare their reasoning with a senior architect’s analysis. AI provides guiding questions and feedback; readers remain responsible for their own decisions.

## What readers can explore

- **Architecture exercises:** a scenario, a first answer, a mentor’s question, a revised answer and a senior analysis.
- **Anti-patterns:** recurring mistakes, warning signs, consequences and possible alternatives.
- **Architecture foundations:** concepts explained through practical decisions and examples.
- **Architecture in motion:** selected technology developments and their architectural implications.
- **Learning tools:** an HLD generator and an ADR worksheet for structuring a proposal and recording a decision.
- **Discussion and newsletter:** constructive comments and a way to keep up with new material.

Content is available in English and Polish. Scenarios and generated documents are learning aids and starting points for discussion. Applying them to a real project requires its own context, evidence and review. Examples should distinguish fictional scenarios from documented events; confidential project details do not belong in public submissions.

## About the author

The project is created by **Wiesław Ejsymont**, with more than 40 years in IT and over 20 years in solution and enterprise architecture. His career began with earlier computer generations, including the IBM PC 286, and developed through successive changes in hardware, operating systems, networks, software development and architecture, up to contemporary applications of AI. His experience spans industry, telecommunications and aviation.

## How the project works

The magazine uses **Astro** to build static pages and **Vercel serverless functions** for interactive features. A PHP bridge on **LH.pl** connects the backend to MySQL over authenticated HTTPS; the browser never receives database credentials or provider API keys.

| Location | Purpose |
| --- | --- |
| `src/` | Pages, layouts, components and article content |
| `data/` | Exercise scenarios and supporting datasets |
| `api/` | HLD generation, mentor feedback, comments and contact endpoints |
| `storage-bridge/` | PHP storage endpoints, schema and retention cleanup |
| `scripts/` | Build-time generation of article context for comment moderation |
| `tests/` | Comment moderation and interface regression tests |

Comment submissions pass Turnstile, are saved in the database and are evaluated using the **OpenAI Responses API**. Confirmed approvals are published and immediately displayed; clear violations are rejected, and uncertain cases or AI failures go to the manual moderation queue. Email confirmation is not required for new submissions. See [comment moderation](COMMENTS.md) for configuration and limitations.

The HLD generator and exercise mentor currently use **Anthropic**. They are separate from OpenAI comment moderation; changing one provider does not migrate the other features.

## Local development

```bash
npm ci
npm run dev
```

The Astro development server serves the magazine. To exercise the Vercel API functions locally, use a Vercel development environment with the required server-side variables configured.

```bash
npm run build
npm run test:comments
```

The build also generates the server-owned article context used by comment moderation. Automated tests use simulated provider and storage responses; they do not establish live model availability or moderation quality.

## Configuration and storage

Configure secrets in the appropriate Vercel environment; never commit real keys, passwords or `config.local.php`.

| Variables | Used for |
| --- | --- |
| `OPENAI_API_KEY`, optional `COMMENT_MODERATION_MODEL` | AI comment moderation |
| `ANTHROPIC_API_KEY` | HLD generation and exercise mentor |
| `PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Browser challenge and server verification |
| `LH_STORAGE_URL`, `LH_STORAGE_TOKEN` | Authenticated PHP storage bridge |
| `COMMENT_ADMIN_PASSWORD` | Manual moderation panel |
| `LH_SMTP_HOST`, `LH_SMTP_USER`, `LH_SMTP_PASSWORD` | Contact email through SMTP |

For a new storage installation, use a dedicated MySQL database, apply the relevant SQL schema from `storage-bridge/`, and configure the PHP endpoints using `config.example.php`. Keep the real configuration inaccessible over HTTP. Vercel uses the HTTPS bridge and shared token; MySQL credentials stay on LH.pl. Existing installations should be checked before any schema changes.

HLD and exercise storage is optional and requires the visitor’s explicit choice. A storage failure must not withhold an otherwise generated result. Configure the PHP cleanup job and verify it is running before relying on the stated retention periods. The public [data notice](https://ejsymont.com/en/data-notice/) describes the visitor-facing rules.

## Further project notes

- [Comment moderation and configuration](COMMENTS.md)
- [Newsletter](NEWSLETTER.md)
- [English edition](ENGLISH.md)
- [Prototype notes](PROTOTYPE.md)

Production updates are made through reviewed changes in the main branch. Preview deployments are used to inspect proposed changes before publication.
