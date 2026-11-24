# ArchitectMentor development in VS Code

Environment setup for private development of **Neuro-Symbolic Architecture Auditor**, first tested in draft PR #102.

## Prerequisites

- Personal machine and personal GitHub account, unless separate employer permission exists.
- VS Code, Git, Node.js **24** (matches `.node-version`), and npm.
- Connect VS Code to your personal GitHub account.
- Never paste credentials, client HLD/ADR or employer documents into Copilot, Codex, GitHub issues or public examples.

## Clone the existing repository – don't fork or duplicate it

Via VS Code Command Palette: **Git: Clone**:

```text
https://github.com/Wiesieke/architekt-mentor.git
```

Or in a local terminal:

```powershell
git clone https://github.com/Wiesieke/architekt-mentor.git
cd architekt-mentor
git fetch origin
git switch feature/neuro-symbolic-auditor-poc
npm ci
```

The `feature/neuro-symbolic-auditor-poc` branch contains the initial auditor PoC. The `main` branch does not yet contain it.

## Running locally

Select **Terminal > Run Task** in VS Code and choose from `.vscode/tasks.json`.

- **ArchitectMentor: auditor demo (offline)**: prints a synthetic evidence-graph report; no paid API.
- **ArchitectMentor: auditor tests**: verifies domain rule, source references and mocked AI adapter.
- **ArchitectMentor: local site (Astro)**: displays the existing website locally, normally at `http://localhost:4321`.
- **ArchitectMentor: build**: creates static site output in `dist`.
- **ArchitectMentor: full test suite**: runs Node test suite.

The Astro development command does *not* automatically emulate Cloudflare Pages Functions. For integration smoke tests use documented Cloudflare Pages tooling only after a local build and with no production secrets. The current PoC does not expose a public auditor endpoint.

To run the extractor against a *real* OpenAI API (only synthetic test documents; uses paid tokens), set `OPENAI_API_KEY` in your local session, never in Git, and run `node scripts/auditor-poc-demo.mjs --live`. Explicit authorization and provider usage budget required.

## Daily collaboration and Git

1. `git fetch origin` and `git pull --ff-only` when your working tree is clean.
2. Use a new feature branch for a separate change. Keep one small goal per PR.
3. Run the appropriate tests and `npm run build`.
4. Review `git diff`, then commit and `git push -u origin <branch-name>`.
5. Open a **draft pull request** to `main`.
6. Review CI, code and a protected Cloudflare preview; approval is required before merge.
7. Do not run any Cloudflare production deploy commands from local VS Code.

**Important:** Cloudflare Pages usually creates previews automatically for PR/branch pushes, but its production branch and branch build controls are determined by the Cloudflare dashboard, not by the name `main`. Existing repo recovery docs dated 2026-11-20 describe an emergency deployment branch. Verify current production branch in Cloudflare before changing Pages settings or merging a PR. Restrict preview access with Cloudflare Access before exposing sensitive code or documents.

## AI coding agents

- For personal work use an account licensed for personal development, e.g. **Codex (OpenAI)** signed into your ChatGPT account, or a personally licensed GitHub Copilot. VS Code extensions are optional.
- For **employer-paid GitHub Copilot** do not assume a personal repo is covered: first confirm written authorization for private/commercial projects and check employment IP, acceptable-use, data and billing rules.
- **Microsoft 365 Copilot** differs from **GitHub Copilot**; the Microsoft 365 chat product does not automatically provide a VS Code coding agent.
- Give coding agents narrow, reviewable tasks, never broad permissions to deploy, merge, delete, access secrets or introduce dependencies without review.

## Working agreements

- Do not modify the production website while developing the auditor.
- Architecture Auditor is provider-neutral: OpenAI adapter is replaceable by future local Llama/Qwen adapter.
- No real internal client/employer HLD/ADR in test cases. Use synthetic, clearly licensed data.
- Extracted evidence must be checked against source text; no false `FAIL` for missing documentation.
- No separate Hallucination Detector, database cluster, model fine-tuning or Neo4j in PoC 0.1.
- Use small incremental PRs with automated tests and an explicit human approval gate.
