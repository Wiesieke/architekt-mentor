# ArchitectMentor — Neuro-Symbolic Architecture Auditor (Evidence Model v0.2.2)

Status: experimental; no production deployment. Scope: 1 rule (ARCH-001), synthetic HLD/ADR.

## Objectives

- Use an AI extractor to identify grounded facts (flows, duplicate message delivery, exactly-once business-effect requirements, and documented protection mechanisms).
- Validate every extracted quotation against its source document.
- Build a provider-independent graph: document, flow and claim nodes with evidence and scope edges.
- Evaluate deterministic rule ARCH-001 across HLD and ADR for the **same flow and business effect**.
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

Run live only with explicit approval and an agreed spending limit. Never commit an API key. The live path reads it from an environment variable and does not approve any of the extracted facts.

## Architecture and contracts

- src/lib/auditor/openai-extractor.mjs: first adapter of the model gateway, Structured Outputs with a strict JSON schema; no OpenAI SDK dependency. Responses API response persistence is disabled (store:false); provider data-handling policies still apply.
- src/lib/auditor/core.mjs: deterministic source verification, graph construction, and first rule.
- scripts/auditor-poc-demo.mjs: one end-to-end demonstration, offline by default; --live explicitly enables OpenAI.
- [tests/auditor.test.mjs](../tests/auditor.test.mjs): regression tests and provider stub.
- [auditor-benchmark.mjs](../tests/fixtures/auditor-benchmark.mjs): 24 synthetic HLD/ADR pairs with manually annotated facts, source quotes and expected findings. Synthetic signing keys exist only in memory during the tests and offline demo. These fixtures test the rule, not model accuracy.

This is deliberately **not** yet a public endpoint or user-facing page. The application production deployment is untouched.

### Evidence contract and trust boundary

- Each input document has an `id`, `version`, and `text`. The core computes SHA-256 (`documentHash`, lowercase hex) over the complete UTF-8 text. Reusing the version label after editing does not preserve a review.
- Each flow and claim has `documentId`, `documentVersion`, `documentHash`, a verbatim `quote` and a zero-based half-open `[start, end)` range measured in JavaScript UTF-16 code units. The range must match exactly. OpenAI proposes quotes; the adapter computes hashes and offsets locally and rejects missing or ambiguous matches. Other adapters can supply precise offsets and use `hashDocument`.
- A claim adds `flowId`, `effectId`, `kind`, and `status` (`existing`, `planned`, `negated`, `unclear`). `effectId` is scoped to the flow; use `null` for unknown scope, never as a match for every effect. Incident claims use `incidentState` (`current_unresolved`, `historical`, `resolved`, `unclear`); all other claims set it to `null`.
- `audit(documents, extraction, {reviews, trustedReviewers, authorizedReviewers})` takes reviews separately from extraction. A review has `claimId`, `reviewerId`, `assessment`, and a Base64URL Ed25519 `signature` over `reviewPayload(claim, flow, review)`. The versioned signature binds identity, the claim and flow (including both source hashes), and the assessment. The assessment independently rates `kind`, `status`, `flow`, `effect` and (for incidents) `incidentState` as `confirmed`, `partial` or `unsupported`. Set `assessment.incidentState` to `null` for non-incidents.
- The trusted host supplies a `Map` of reviewer IDs to Ed25519 public `KeyObject`s and separately a `Set` of caller-authorized reviewer IDs. **Never** build either from model or user-submitted review data. `signature_valid` proves only that a configured key signed this exact payload; `reviewer_authorized` is the caller's independent authorization decision; `evidence_sufficient` additionally requires complete, consistent confirmation of all dimensions. The PoC has no real identity verification or enrollment mechanism and cannot claim that a signer is an authorized human architect. The offline demo authorizes synthetic fixture identities only; by default neither keys nor authorizations are supplied.
- The report marks evidence quality as `quote_verified` or `reviewed`, with completeness `unknown`, `partial`, `sufficient`, or `unsupported`. Completeness concerns the specific claim, not the whole extraction. Identical signed reviews are idempotent; competing authorized assessments produce `CONFLICTING_REVIEWS`, not an exception. Rejection or partial confirmation of kind, status, flow, effect or incident state does not silently remove potentially relevant evidence: unresolved scope blocks `PASS`. The graph records the evidence; ARCH-001 evaluates the claims, not paths in the graph.

### ARCH-001

| Result | Condition |
| --- | --- |
| `PASS` | Authorized, signed and sufficient reviews support possible duplicate delivery, an exactly-once business-effect requirement, and a current safeguard for that same flow and effect; no unresolved or conflicting evidence was presented. This is a documentary result only. |
| `FAIL` | Sufficient reviewed evidence supports both premises and an explicitly current, unresolved instance of that same business effect being repeated. A historical or resolved incident alone does not establish a current failure or a current safeguard. |
| `NOT_APPLICABLE` | Reviewed evidence explicitly rules out a premise without a relevant contradiction. |
| `NEEDS_REVIEW` | No flow, missing premises, no current safeguard, historical incident without confirmed current protection, or unresolved/conflicting evidence or reviews. An existing safeguard conflicts with planned, negated or unclear protection claims for the same flow and effect. A safeguard for another flow or effect does not count. |

## Known limitations

1. Quotation verification does not establish semantic accuracy or detect omitted facts. A legitimate reviewer can still make a semantic error. The PoC has no external identity or key-management system.
2. The graph is currently a minimal *evidence and business-flow* graph, not yet the full C4 component graph.
3. The rule is narrowly scoped; absence of a documented mechanism is a question to investigate, not proof the mechanism is absent.
4. The synthetic examples are regression tests, not evidence of accuracy on real documents. Future work requires independent annotation, false-positive tracking, and a baseline LLM comparison.
5. For confidentiality use only synthetic or cleared documentation. No file upload, persistence, public API endpoint or database is included.

## Next gated iteration

1. After approval, compare live extraction against independently reviewed annotations for the synthetic HLD/ADR pairs and fix extraction coverage.
2. Add typed C4 components and relations with provenance and consistency checks.
3. Add two more formally specified rules with a human-reviewed test set.
4. Only then add an authenticated Cloudflare preview UI and per-request limits. Do not deploy to production without approval.
