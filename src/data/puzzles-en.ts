import puzzles from '../../data/puzzles.json';

const translations: Record<string, { title:string; scenario:string; question:string; hints:string[]; analysis:string; difficulty:string }> = {
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
    scenario:`An organisation is selecting a system for internal processes. Its architecture requirements say that the application layer should use managed cloud services and that the solution must integrate with an existing integration platform.

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
    scenario:`You are building an order service. After checkout it must **(1)** save the order in a database and **(2)** publish an \`OrderPlaced\` event to a queue consumed by the warehouse and notification services.

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
    scenario:`You design an API that accepts payments for orders. The application calls \`POST /payments\`. The server sends the request to a payment provider and records the result. Sometimes the provider charges the customer, but the response is lost to a timeout and the application retries.

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
