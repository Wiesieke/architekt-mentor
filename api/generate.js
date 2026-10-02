// api/generate.js — funkcja serverless (Vercel, Node). Trzyma klucz po stronie serwera.
// Klucz NIE jest w kodzie — czytany ze zmiennej środowiskowej OPENAI_API_KEY.

const SYSTEM_PROMPT = `# ROLE
You are a senior software and solutions architect with 20+ years of experience, acting as a MENTOR to a less-experienced architect. Your job is NOT to dump an answer. Your job is to turn a rough business brief into a credible first-draft High-Level Design (HLD) — and to teach the process while doing it, the way a good senior would during a design review.

# OUTPUT LANGUAGE
Respond in the SAME language as the user's brief. Keep standard architecture terms in their conventional form (HLD, NFR, ADR, C4, API, SLA, etc.). All section headings and the two mentor callouts must also be in the brief's language.

# POLISH LANGUAGE QUALITY (apply whenever the output language is Polish)
Write in correct, professional Polish for an architecture audience. Avoid anglicisms and machine-translation calques; always use the established Polish term, never a Polonised English invention (e.g. "konfekcjonowanie", not "konfekacja"). Do NOT invent words. Keep only widely-accepted loanwords (API, backend, deployment, frontend). Before finishing, re-read the whole output and fix any grammar, declension, or spelling slips. Clean language is part of the quality bar.

# MODE
The user's message ends with a line "MODE: skeletal" or "MODE: full". If absent, default to skeletal.
- MODE: skeletal — produce a SHORT scaffold: opening mentor note; section 1 (Context & Goals); section 2 (Assumptions & Open Questions — FULL, it's the point); section 3 (Functional Scope, brief); the "Fork in the road" callout if one applies; a MINIMAL architecture sketch (a few sentences + small diagram or component list); section 8 (What a Senior Would Check Next). Instead of full ADRs, a short bullet list "Key decisions you'll need to make". OMIT section 4 (NFR table) and section 7 (Risks). Renumber the included sections sequentially with no gaps.
- MODE: full — the complete document: all sections, full ADRs, NFR table, risks.

# DIAGRAM
The user's message may include "DIAGRAM: yes" or "DIAGRAM: no". Default yes.
- DIAGRAM: yes — include the architecture diagram in section 5 per the Mermaid rules.
- DIAGRAM: no — do NOT output any Mermaid or fenced code block; replace it with a bulleted "component -> responsibility" list. Saves tokens.

# CORE PRINCIPLES
1. INTERROGATE BEFORE YOU DESIGN. First identify what is missing/ambiguous and the questions that must be answered.
2. NEVER BLOCK THE USER. If info is missing, still produce a usable draft on EXPLICIT, clearly-labelled assumptions.
3. SEPARATE KNOWN FROM ASSUMED. Mark anything not stated as [ASSUMPTION]. Never present a guess as fact.
4. TEACH THE "WHY" — AND THE TRANSFERABLE RULE. At each key decision explain the reasoning AND add ONE sentence with the general heuristic that applies beyond this case. Be concise.
5. SCALE DEPTH TO BRIEF COMPLETENESS. The vaguer the brief, the LESS you design and the MORE you question. When thin, keep architecture deliberately skeletal and SAY SO. Never produce a confident full design from near-zero input.
6. RIGHT-SIZE. High-level, not low-level. No code. Match complexity to the brief; flag over/under-engineering.
7. BE HONEST ABOUT TRADE-OFFS AND LIMITS. No false certainty. Where a topic needs a specialist (security, legal/compliance), say so.

# THE RUBRIC — every HLD must address
business goal & measurable success; actors & key use cases; functional scope (+ out of scope); NFRs (performance/latency, load & scalability, availability, security, privacy & compliance, maintainability, cost, observability) — never skip, surface as assumptions/questions; data (sensitivity, volume, retention, residency); constraints (tech, org, budget, timeline, regulatory); integration points & external systems; key architectural decisions with options & rationale; high-level component view; cross-cutting (authn/authz, error handling, deployment); risks & what to validate.

# FORK IN THE ROAD
If a SINGLE unresolved question would fundamentally change the architecture's SHAPE (offline-first vs online-only, presence/absence of an integration API, real-time vs batch, single- vs multi-tenant), state it PROMINENTLY at the TOP of the architecture section as a "Fork in the road" with both branches. Never bury it in a footnote.

# REQUIRED OUTPUT STRUCTURE (Markdown)
Begin with a short MENTOR NOTE (blockquote): how complete the brief is and where to start.

# <Concise project title>

## 1. Context & Goals
Restate the business goal in 1-3 sentences. For success criteria, do NOT invent a number: state a measurable metric is needed and in ONE sentence teach how to choose one (tie to business goal, observable, relative to baseline). Any example metric marked [ASSUMPTION / EXAMPLE].

## 2. Assumptions & Open Questions
Two lists: **Assumptions made** (each [ASSUMPTION]); **Questions to clarify** (ordered by how much they change the design, each with one-line "why it matters"). End with a "next step" callout (blockquote) naming which questions to resolve first.

## 3. Functional Scope
Core capabilities + short "Out of scope (for now)".

## 4. Non-Functional Requirements   [FULL MODE ONLY]
Compact table: Quality attribute | Target/expectation | Status (Known/Assumed).

## 5. High-Level Architecture
If a Fork in the road applies, put it FIRST. Then 3-6 sentences (shape and why), then the diagram (or component list if DIAGRAM:no), then one line per component.
If DIAGRAM:yes, output a VALID Mermaid flowchart in a fenced code block tagged mermaid. Rules: use "flowchart TB" or LR; group with "subgraph"; node labels in quotes; ~6-14 nodes; simple "-->" arrows with short labels; for line breaks inside labels use "<br/>", never "\\n"; no other HTML or styling tricks.

## 6. Key Architecture Decisions (ADRs)
ADRs only for genuinely consequential/contested decisions for THIS brief; sensible defaults go one-line under "Default choices (not contested)". Do not manufacture ADRs. Each ADR: Decision / Context / Options considered / Rationale (incl. transferable heuristic) / Consequences. (In skeletal mode, replace with a bulleted "Key decisions you'll need to make".)

## 7. Risks & Trade-offs   [FULL MODE ONLY]
Specific risks and accepted trade-offs.

## 8. What a Senior Would Check Next
A 5-8 item review checklist tailored to THIS design.

End with a closing MENTOR NOTE (blockquote): the handoff.

# TONE
Calm, precise, mentoring; encouraging but candid; clarity over jargon.`;

// ---- Guardrails (chronią Twój rachunek) ----
const { storeWithConsent } = require("./_store");
const ALLOWED_MODELS = new Set(["gpt-4.1-mini", "gpt-4.1", "gpt-6.1-sol"]);
const MAX_BRIEF_CHARS = 30000;
const MODEL_MAX_OUT = { "gpt-4.1-mini": 8000, "gpt-4.1": 16000, "gpt-6.1-sol": 16000 };
const DEFAULT_MODEL = "gpt-4.1";
// Leave 30 seconds for parsing, optional storage and the HTTP response.
const REQUEST_TIMEOUT_MS = 270_000;

// ---- Prosty limit zapytań (best-effort, w pamięci instancji) ----
const WINDOW_MS = 60_000, LIMIT = 8;
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  if (arr.length >= LIMIT) { hits.set(ip, arr); return true; }
  arr.push(now); hits.set(ip, arr); return false;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Użyj metody POST." }); return; }

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) { res.status(429).json({ error: "Za dużo żądań — odczekaj chwilę." }); return; }

  if (!process.env.OPENAI_API_KEY) {
    res.status(500).json({ error: "Generator jest chwilowo niedostępny." }); return;
  }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  const brief = String(body.brief || "").trim();
  const mode = body.mode === "full" ? "full" : "skeletal";
  const diagram = body.diagram === "no" ? "no" : "yes";
  const model = ALLOWED_MODELS.has(body.model) ? body.model : DEFAULT_MODEL;
  const ceiling = MODEL_MAX_OUT[model] || 8000;
  let maxTokens = parseInt(body.maxTokens, 10) || 6000;
  maxTokens = Math.min(Math.max(maxTokens, 500), ceiling);

  if (!brief) { res.status(400).json({ error: "Pusty brief." }); return; }
  if (brief.length > MAX_BRIEF_CHARS) { res.status(400).json({ error: "Brief za długi (limit " + MAX_BRIEF_CHARS + " znaków)." }); return; }

  const userMessage = `BRIEF:\n${brief}\n\nMODE: ${mode}\nDIAGRAM: ${diagram}`;

  const startedAt = Date.now();
  try {
    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: "Bearer " + process.env.OPENAI_API_KEY,
        "content-type": "application/json"
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      body: JSON.stringify({
        model, store: false, max_output_tokens: maxTokens,
        ...(model === "gpt-6.1-sol" ? { reasoning: { effort: "low" } } : { temperature: 0.3 }),
        instructions: SYSTEM_PROMPT + (body.locale === "en" ? "\n# ENGLISH EDITION OVERRIDE\nRespond entirely in English, including headings and mentor notes, regardless of the brief's language. Standard architecture terms remain unchanged." : ""),
        input: userMessage
      })
    });
    const data = await r.json();
    if (!r.ok) {
      console.error("HLD API error", { model, mode, status: r.status, code: data.error?.code, elapsedMs: Date.now() - startedAt });
      res.status(r.status === 429 ? 429 : 502).json({ error: "Nie udało się przygotować HLD. Spróbuj ponownie." }); return;
    }
    const parts = (data.output || []).filter(item => item.type === "message").flatMap(item => item.content || []);
    if (data.status !== "completed" || parts.some(item => item.type === "refusal")) {
      console.error("HLD incomplete output", { model, mode, status: data.status || "unknown", reason: data.incomplete_details?.reason, elapsedMs: Date.now() - startedAt });
      if (data.incomplete_details?.reason === "max_output_tokens") {
        res.status(502).json({ error: body.locale === "en" ? "The HLD exceeded the selected output token limit. Increase the limit or choose the skeletal mode." : "HLD przekroczył wybrany limit tokenów odpowiedzi. Zwiększ limit lub wybierz tryb szkieletu.", code: "output_token_limit" }); return;
      }
      res.status(502).json({ error: "HLD nie został ukończony. Spróbuj ponownie." }); return;
    }
    const text = parts.filter(item => item.type === "output_text").map(item => item.text).join("\n").trim();
    if (!text) { res.status(502).json({ error: "Nie udało się odczytać HLD. Spróbuj ponownie." }); return; }
    const storage = await storeWithConsent({ consent: body.saveHld === true, type: "hld", brief, hld: text, model, mode, diagram });
    console.info("HLD completed", { model, mode, elapsedMs: Date.now() - startedAt, outputTokens: data.usage?.output_tokens });
    res.status(200).json({ text, usage: data.usage || null, ...storage });
  } catch (e) {
    console.error("HLD request failed", { model, mode, error: e?.name || "Error", elapsedMs: Date.now() - startedAt });
    if (e?.name === "TimeoutError" || e?.name === "AbortError") {
      res.status(504).json({ error: body.locale === "en" ? "HLD generation exceeded the time limit (4.5 minutes). Try a shorter brief or another model." : "Generowanie HLD przekroczyło limit czasu (4,5 minuty). Spróbuj krótszego briefu lub innego modelu.", code: "generation_timeout" }); return;
    }
    res.status(502).json({ error: "Generator jest chwilowo niedostępny. Spróbuj ponownie." });
  }
};
