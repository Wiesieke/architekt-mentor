import puzzles from '../../data/puzzles.json';

type EnglishDecisionRecord = { context:string; decision:string; consequences:string; verification:string; openQuestions:string };
const translations: Record<string, { title:string; scenario:string; question:string; hints:string[]; analysis:string; difficulty:string; decisionRecord?:EnglishDecisionRecord }> = {
  '2026-10-01-cache-bez-tenanta': {
    title:"The cache knows the report, but not the tenant. What will tenant B see?",
    difficulty:"Advanced",
    scenario:"**Fictional example.** A SaaS application serves multiple companies. A token carries user and tenant identifiers, while the gateway validates its signature and expiry. Report numbers are allocated independently inside each company, so tenants A and B can both have report `42`.\n\nThe `GET /reports/42` endpoint first looks in a shared cache under `report:42`. Only on a miss does it query the database with a tenant filter. A user from tenant A opens their report and warms the cache. Shortly afterwards, an authorised user from tenant B requests their own report `42` and receives the cached response. The team says, “But the gateway checked authorisation.”",
    question:"Where did tenant isolation break? How will you change authorisation, the cache key and tests so the fix covers the whole path rather than this endpoint alone?",
    hints:["Does a valid token prove access to a particular report?", "Which values identify a report uniquely across the system?", "Is access checked on a cache hit as well as a miss?", "How will two tenants with the same local report number expose a regression?"],
    analysis:"### Authentication is not resource authorisation\n\nThe gateway established who the user is and that the token is valid. It did not establish permission to read this report. The application omitted tenant scope from its fastest path: a cache hit. That is enough to break isolation.\n\n### Repair the boundary, not one symptom\n\n1. Derive the active tenant context from trusted identity, then verify membership and the operation on the resource. Do not treat a tenant parameter as authoritative.\n2. Include the tenant in the key namespace, for example `tenant:{tenantId}:report:{reportId}`, or use physically separate caches if the risk warrants it. A longer key does not replace authorisation.\n3. Make the access decision before returning a cache hit. The data layer should also enforce tenant scope as defence in depth, not as an alternative to application checks.\n4. Purge or version old entries. Inspect adjacent paths: lists, exports, search, thumbnails and asynchronous jobs. Defects rarely respect controller boundaries.\n5. Add a negative test with two tenants that both own report `42`: warm the cache with A, call it as B, and expect denial or B's data. Repeat after role change and access revocation. Observe denials and unusual collisions without logging report contents.\n\nIf exposure may already have occurred, a code fix does not close the matter. Preserve evidence, establish scope, invoke the appropriate security process and do not invent an impact assessment.\n\n> A cache accelerates a wrong decision too. The security boundary must therefore operate before the shortcut.",
    decisionRecord:{context:"Reports use tenant-local identifiers while a shared cache omits tenant context and can return an entry before resource authorisation.", decision:"Derive tenant context from trusted identity, authorise the resource and include that context in every cache namespace and data query.", consequences:"Existing entries must be purged or versioned; adjacent caches, exports, search and asynchronous jobs require review.", verification:"Run an automated negative test with two tenants and colliding identifiers after cache warm-up, role change and access revocation.", openQuestions:"Which other components build keys without tenant context? Can logs establish possible exposure without retaining report data?"}
  },
  '2026-09-30-odtwarzanie-po-awarii': {
    title:"The database is back; attachments are not. Do you reopen the portal?",
    difficulty:"Advanced",
    scenario:"**Fictional example.** A portal accepts applications. It stores metadata in a database, attachments in object storage and sends a queue message after submission. The team declares an RPO of five minutes and an RTO of 30 minutes. Database backups run every five minutes, but files have a separate schedule. Nobody has rehearsed full recovery. After a regional outage the operator restores the database; the portal starts, but some attachments are missing and the processing state of some applications is uncertain.\n\nThe business owner asks whether traffic can resume. The 30-minute target runs from outage detection to restoration of the user journey, not merely database startup.",
    question:"What must be restored and checked before you resume submissions? How will you verify a five-minute RPO and 30-minute RTO for the whole service?",
    hints:["Does the database RPO also cover attachments and the queue?", "When is the service restored: at database startup or after a user-journey test?", "What happened to messages published just before the outage?", "How will you measure data loss and elapsed time since detection?"],
    analysis:"### The target belongs to the service, not a single server\n\nRPO is the allowed gap between the most recent recovered, valid state and the outage. RTO is the time to restore the agreed function. A database backup every five minutes proves neither target: it might not restore, while attachments and messages follow separate timelines.\n\n### Before reopening traffic\n\n1. Define the service boundary: submission, attachment association and downstream processing. Name who approves reopening and how users will learn about any limitation.\n2. Find the last **consistent** recovery point for metadata and files. Sample application and attachment IDs and count missing objects. Matching timestamps are not a transaction across stores.\n3. Reconcile published, unacknowledged and restored messages. Replaying the queue can create duplicates. Consumers must recognise already processed applications; missing work must be reconciled against the database and replayed deliberately.\n4. Check encryption keys, permissions, dependency configuration and traffic routing. Submit and later read an application with its attachment. Only then decide whether the service is ready.\n\n### Prove the objective\n\nRehearse an outage in an isolated environment with representative data volume. Record detection, decision, restoration and successful user-journey test times. Calculate the oldest missing valid write in each store and measure the achieved RPO and RTO. Repeat after material architecture changes. If measurements exceed the targets, change the design or agree more honest targets; numbers in an HLD do not make recovery faster.\n\n> “The database is running” is a progress report, not evidence that users can safely return.",
    decisionRecord:{"context": "The portal stores metadata, attachments and messages separately; its five-minute RPO and 30-minute RTO have not been demonstrated by a drill.", "decision": "Reopen traffic only after a consistent recovery point, message reconciliation and a successful end-to-end submission and retrieval test.", "consequences": "Recovery needs cross-store reconciliation, a rehearsed runbook and an authorised decision maker.", "verification": "Time recovery from detection through a successful user journey; measure missing or duplicate records in every store.", "openQuestions": "Can attachments meet the five-minute RPO? Who accepts any loss or prolonged outage?"}
  },
  '2026-09-29-expand-contract': {
    title:'Two application versions, one schema. How do you deploy without downtime?', difficulty:'Advanced',
    scenario:`**Fictional example.** A case-management application runs on six instances. The team wants to replace a \`status\` column with \`state\`, change its allowed values and immediately remove the old field. The rollout is gradual, so old and new application versions run together for several minutes.

The new version reads only \`state\`; the old version reads only \`status\`. Backfilling several million rows will take longer than the code rollout. The team plans to roll back the application if needed, but has not explained what happens to the database change or to records written during the transition.`,
    question:'How do you split this change into safe stages? When may writes to the old field stop, when may the field be removed, and how do you test rollback?',
    hints:['Which code version must work with which schema state?','How will you handle writes that happen while historical rows are being backfilled?','Will rolling back code work after an irreversible column removal?','What evidence permits the move from expand to migrate and contract?'],
    analysis:`### Name the coexistence window

A rolling deployment means old and new code use the same database for a while. Dropping \`status\` first breaks the old version, and rolling code back cannot restore removed data.

### Use parallel change: expand, migrate, contract

1. **Expand:** add \`state\` compatibly. Keep old code on \`status\`; introduce transitional code that handles both fields. Make the owner of dual writes or value translation explicit.
2. **Migrate:** backfill in resumable, idempotent batches. Account for records written during the backfill and measure discrepancies.
3. **Switch reads:** read \`state\` only after completeness checks pass. Monitor missing or unknown values and retain old-code compatibility for the agreed rollback window.
4. **Contract:** stop writing \`status\` when no supported version needs it. Remove it in a later deployment, after the rollback window and recovery plan are closed.

Each transition needs evidence: every eligible row has a valid \`state\`, discrepancies remain at zero for an agreed window, all instances run compatible code, and rolling deployment plus rollback has been rehearsed. Dual writes can also fail, so limit the transition and monitor it.

> Enable version coexistence first, move data and traffic next, and remove the old contract last.`,
    decisionRecord:{
      context:'Old and new application versions coexist during a rolling deployment, while backfilling several million records takes longer than the code rollout.',
      decision:'Use expand, migrate and contract phases. Remove the old column in a separate deployment after the rollback window closes.',
      consequences:'Two fields and extra consistency checks exist temporarily. The backfill needs telemetry, resumability and explicit completion criteria.',
      verification:'Rehearse rolling deployment and rollback on representative data; check backfill completeness, field discrepancies, errors in both versions and database lock time.',
      openQuestions:'How long must rollback remain possible? Where is value translation owned? Which thresholds permit the contract phase?',
    },
  },
  '2026-w40-izolacja-zasobow': {
    title:'Reports block checkout. What do you isolate?', difficulty:'Intermediate',
    scenario:`**Fictional example.** A shop application calls two external services: one calculates delivery prices and the other generates reports for sellers. Both use the same pool of 40 outbound connections and the same worker queue.

When reporting slows down, its requests wait 20 seconds and occupy most of the pool. Customers cannot complete orders, even though the delivery pricing service responds normally. The team proposes doubling the pool and retrying every call three times. You do not yet know the traffic distribution or agreed response targets for either function.`,
    question:'How will you stop reports from affecting checkout? What limits, overload behaviour and measurements will you define before changing the connection count?',
    hints:['Which resources are actually shared and may be exhausted?','Do reports and checkout have the same priority and response-time target?','What happens to traffic when every slow request is retried three times?','How will you show that isolation works when one provider slows down?'],
    analysis:`### Start with the failure boundary

The slow reporting provider is only part of the problem. A shared pool and queue transfer its slowdown to the critical checkout path. Measure the request time budget, concurrency and traffic by function. Confirm which workers are actually shared.

### An architecture decision

1. Separate connection pools or concurrency limits for reports and delivery pricing. Reports can have a smaller cap and a separate queue; order resources should remain available when reporting stalls.
2. Set justified timeouts and bounded queues. When a reporting limit is reached, defer the work or explain unavailability instead of waiting indefinitely.
3. Avoid unconditional retries. They amplify load during a failure; allow only safe operations, with a retry budget and backoff.
4. Define distinct service objectives and measure pool saturation, queue depth, timeouts, rejections and user latency.
5. Test a reporting slowdown under representative load. Reports may lag while checkout meets its agreed objective.

A larger common pool might postpone failure but does not create a boundary. Select actual limits from traffic and tests; the information given cannot justify “40 versus 80”.

> Isolate lower-priority work before its failure consumes the capacity needed by critical work.`,
  },
  '2026-w39-anon-managed-platform': {
    title:'The offer works, but diverges from the architecture requirement', difficulty:'Advanced',
    scenario:`**Anonymised case.** Inspired by a real offer-review dilemma; no implementation outcome is asserted.

An organisation is selecting a system for internal processes. Its architecture requirements say that the application layer should use managed cloud services and that the solution must integrate with an existing integration platform.

A supplier proposes a hybrid solution: the application runs on virtual machines while some data services are managed. Documentation describes a general integration capability, but only a portion has been confirmed. Business stakeholders want to continue because the offer covers important functional needs.

You are reviewing the offer at this stage. You do not yet have a complete implementation design or evidence for every connection. Identifying details have been removed.`,
    question:'How do you separate requirements compliance from the decision to keep evaluating the offer? What would you recommend, and what evidence is needed before approving the implementation architecture?',
    hints:['Does “cloud services” mean the same as managed application hosting?','Which requirements are mandatory and which express a preference?','Does a general integration claim prove specific interfaces and error handling?','What can the offer demonstrate, and what requires a full HLD?'],
    analysis:`### Separate two decisions

Permission to continue evaluating an offer is not approval of its implementation architecture. The offer may be functionally promising while leaving important gaps.

1. Map each requirement to a proposed component and its evidence. Mark compliance, deviations and unknowns separately.
2. Examine the implications of virtual-machine hosting for scaling, availability, patching, operations and cost. Managed data services do not by themselves demonstrate compliance for the application layer.
3. For each integration request contracts, data flows, authentication, error handling, monitoring and a test plan.
4. Distinguish conditions required before selection from those to confirm in HLD and testing. Formal procurement decisions belong to the appropriate process.

A conditional opinion could say that the proposal merits further review **if** the application-hosting deviation is resolved and required integrations are demonstrated; the current material does not support unconditional architecture approval. Give each condition an owner, deadline and objective closure test.

> A claim of possibility is not evidence of implementation. Name the gap and the next decision point.`,
  },
  '2026-w27-dual-write': {
    title:'The order was saved, but the warehouse never saw it', difficulty:'Intermediate',
    scenario:`**Fictional teaching scenario.** This is not an account of a particular deployment.

You are building an order service. After checkout it must **(1)** save the order in a database and **(2)** publish an \`OrderPlaced\` event to a queue consumed by the warehouse and notification services.

The team writes an \`INSERT\`, then calls \`publish()\` in the same service method. It works in a demo. In production, a customer sometimes gets confirmation but the warehouse never receives the order. In other cases the warehouse receives an event for an order that is absent from the database.`,
    question:'Why can this happen? How would you make the database change and event publication reliable? Why does swapping their order not solve it?',
    hints:['What if publish fails after a successful INSERT?','What if the process dies between the two calls?','Does swapping their order solve the problem or reverse the symptom?','Does the database transaction cover the broker?'],
    analysis:`### The dual-write problem

The database and broker do not share one transaction. A crash or timeout between their writes leaves inconsistent state. Reversing the calls only reverses the failure case.

### Transactional outbox

1. Save the order **and** an outbox event in the same database transaction.
2. A separate relay or CDC process publishes committed outbox entries to the broker with at-least-once delivery. Monitor backlog and failures.
3. Consumers must handle duplicate events, for example by tracking event IDs. Plan replay and recovery.

Try/catch cannot roll back an already published event and cannot catch a process crash. A distributed transaction may be impractical or unsupported; evaluate it only if the actual systems and operating constraints warrant it.

> Reduce two independent writes to one atomic local write, then publish reliably and process duplicates safely.`,
  },
  '2026-w39-retry-idempotency': {
    title:'The client retried a payment. Will you charge twice?', difficulty:'Advanced',
    scenario:`**Fictional teaching scenario.** This is not an account of a particular deployment.

You design an API that accepts payments for orders. The application calls \`POST /payments\`. The server sends the request to a payment provider and records the result. Sometimes the provider charges the customer, but the response is lost to a timeout and the application retries.

The team proposes retrying every error after checking whether the order is marked paid. Early tests pass, but production sees concurrent requests for the same order and delayed provider confirmations.`,
    question:'How will you make retries safe and avoid starting a second charge? What happens when the first call has an unknown outcome?',
    hints:['Are the status check and provider call atomic?','How do you distinguish a retry from a deliberate new attempt?','Does the provider support idempotency keys, and for how long?','What do you return when a charge may have succeeded but its response is lost?'],
    analysis:`### A timeout means unknown, not failed

Two requests can both read an unpaid order before either writes a result. A status check alone does not prevent a second charge.

1. Give each logical payment attempt a stable idempotency key and persist it with a uniqueness constraint. Bind it to order, amount and currency. An intentional new attempt needs a separate decision and key.
2. If the provider supports idempotency, pass a stable key and verify its scope and retention period. An internal API key alone cannot guarantee provider behaviour.
3. For a repeated request return the stored result or an in-progress/unknown state. After timeout reconcile with the provider by attempt ID or a trusted callback. Process repeated or out-of-order callbacks idempotently.
4. Define when a new attempt is allowed and how exceptions or refunds are handled. Monitor unknown results and discrepancies.

Do not promise a global exactly-once guarantee. If the provider supports neither idempotency nor status lookup by attempt, record that as a material design limit.

> When an external response is lost, reconcile the unknown result before starting another operation.`,
  },
};

export const englishPuzzles = puzzles.map(puzzle => ({ id:puzzle.id, week:puzzle.week.replace(/TYDZIEŃ/i, 'WEEK'), date:puzzle.date, coach:Boolean(puzzle.coach), ...translations[puzzle.id] }));
export const latestEnglishPuzzle = [...englishPuzzles].filter(p => p.coach).sort((a,b) => b.date.localeCompare(a.date))[0];
export const englishPuzzleUrl = (id:string) => id === latestEnglishPuzzle.id ? '/en/practice/' : `/en/practice/${id}/`;
