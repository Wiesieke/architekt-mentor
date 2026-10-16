# ArchitectMentor Daily — 16 October 2026 (EN draft)

## Can retries make an overloaded dependency worse?

Learning goal: assign a single retry owner and measurable attempt budget.

Fictional educational scenario: an API calls an intermediary, which calls a catalogue service. Both layers make up to three attempts. During a persistent failure, one user operation may produce nine catalogue calls (3 × 3). This is a model, not a production measurement.

Option A: every layer retries — attempts multiply. Option B: one retry owner — shared deadline and attempt budget. Option C: no retries — appropriate when side effects cannot be repeated safely.

Decision: choose B conditionally. The catalogue adapter alone may retry safe reads. Upstream layers propagate the deadline and do not retry. Use capped backoff with jitter and concurrency controls. Do not retry unsafe writes without an idempotency or outcome-lookup contract.

Evidence gate: inspect SDK and gateway policies; test 429/503 with and without Retry-After. Count attempts per user operation, latency and recovery time. Retry-After is advice, not a command to retry or override the deadline.

Primary sources: Amazon Builders’ Library (2019), RFC 9110 §10.2.3 (2022), RFC 6585 §4 (2012). Verify original URLs before publication.

Related: idempotency and lookup, bulkhead, SLO. Status: draft, not deployed.
