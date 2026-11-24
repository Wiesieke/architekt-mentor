# ArchitectMentor — Neuro-Symbolic Architecture Auditor (PoC 0.1)

Status: experimental; no production deployment. Scope: 1 rule (ARCH-001), synthetic HLD/ADR.

## Objectives

- Use an AI extractor to identify grounded facts (flows, duplicate message delivery, exactly-once business-effect requirements, and documented protection mechanisms).
- Validate every extracted quotation against its source document.
- Build a provider-independent graph: document, flow and claim nodes with evidence and scope edges.
- Evaluate deterministic rule ARCH-001 across HLD and ADR only within the **same flow**.
- Return NEEDS_REVIEW for a documentation gap rather than asserting an implementation failure.

## How to run

Without API costs (predefined extraction fixture):

```bash
node scripts/auditor-poc-demo.mjs
node --test tests/auditor.test.mjs
```

Optional real-model test with synthetic documents (costs money):

```bash
OPENAI_API_KEY=... node scripts/auditor-poc-demo.mjs --live
```

Never commit an API key. The real-model path reads it from an environment variable.

## Architecture and contracts

- src/lib/auditor/openai-extractor.mjs: first adapter of the model gateway, Structured Outputs with a strict JSON schema; no OpenAI SDK dependency. Responses API response persistence is disabled (store:false); provider data-handling policies still apply.
- src/lib/auditor/core.mjs: deterministic source verification, graph construction, and first rule.
- scripts/auditor-poc-demo.mjs: one end-to-end demonstration, offline by default; --live explicitly enables OpenAI.
- tests/auditor.test.mjs: regression tests and provider stub.

This is deliberately **not** yet a public endpoint or user-facing page. The application production deployment is untouched.

## Known limitations

1. Quotation verification confirms that the quote occurs in the document; it does NOT confirm correct interpretation of that quote. Review extracted claims manually.
2. The graph is currently a minimal *evidence and business-flow* graph, not yet the full C4 component graph.
3. The rule is narrowly scoped; absence of a documented mechanism is a question to investigate, not proof the mechanism is absent.
4. One short example cannot establish a defensible B+R innovation claim. Future work requires an independently annotated benchmark, negative cases, false-positive tracking, and baseline LLM comparison.
5. For confidentiality use only synthetic or cleared documentation. No file upload, persistence, public API endpoint or database is included.

## Next gated iteration

1. Review outputs of live extraction on 10 synthetic HLD/ADR pairs and fix extraction coverage.
2. Add typed C4 components and relations with provenance and consistency checks.
3. Add two more formally specified rules with a human-reviewed test set.
4. Only then add an authenticated Cloudflare preview UI and per-request limits. Do not deploy to production without approval.
