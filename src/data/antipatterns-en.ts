import patterns from '../../data/antywzorce.json';

const translations: Record<string, { title: string; summary: string; content: string }> = {
  '2026-10-03-zgodnosc-tylko-w-schemacie': {
    title:"Compatible because the generator reported no error",
    summary:"A team treats an additive schema change as safe without running supported consumers or checking contract behaviour.",
    content:"**Fictional educational scenario. It does not describe a particular organisation or incident.**\n\n## Situation\n\nA team adds an optional field to an API response. Its OpenAPI diff tool reports no breaking change, so the server is prepared for universal rollout. Nobody runs the oldest supported mobile app, which rejects unknown properties.\n\n## Where the anti-pattern appears\n\nOne tool result becomes complete evidence of compatibility. A schema check answers an important but narrower question. It does not exercise deserializer configuration, generated code, new enum values, data limits or the meaning a client assigned to the response.\n\n## Warning signs\n\n- “additive” automatically means “safe”;\n- no one owns the supported-client inventory;\n- contract tests run only against the newest SDK;\n- unknown-field behaviour lives in assumptions rather than the contract;\n- rollout targets every consumer because server rollback appears easy.\n\n## Consequences\n\nA formally valid response can become unreadable to a running client. The failure appears on the consumer side and may be blamed on that team even though the producer triggered it. Server rollback helps only if the new field is identified quickly and its exposure is still controllable.\n\n## A better decision\n\n1. Separate source, wire and semantic compatibility. Each needs appropriate evidence.\n2. Maintain an inventory of supported consumers, libraries and deserialization modes.\n3. Test the oldest supported versions, including unknown fields and new enum values.\n4. Roll out progressively and observe failures by client version. Retain a way to stop exposing the new field.\n5. Record contract-evolution rules. If the previous promise cannot be preserved, negotiate a response profile or version the API.\n\n## Boundary\n\nAutomated specification checks remain valuable. The anti-pattern is not the tool; it is promoting a green result into proof that every real consumer works. A green badge is reassuring. Production is under no obligation to care.\n\n> Contract compatibility ends at a working consumer, not at a generator report."
  },
  '2026-10-02-powiadomienie-steruje-transakcja': {
    title:"A notification decides the order outcome",
    summary:"Failure of an auxiliary email makes a successfully committed order look failed and encourages the user to create a duplicate.",
    content:"**Practice-inspired educational scenario. This is a model case, not a report of a confirmed incident.**\n\n## Situation\n\nA service saves an order and calls a mail service within the same request. The order receives a number and the database transaction commits. Email delivery times out, so the API returns a 500 error. The user is told to try again even though the first order already exists. In this process the message is informational and is not a condition for accepting the order.\n\n## Where the anti-pattern appears\n\nAn auxiliary technical effect controls the reported business outcome. The system cannot express two separate facts: “order accepted” and “confirmation pending”. Its retry scope is therefore too broad. It retries order creation instead of repairing notification delivery.\n\n## Warning signs\n\n- an endpoint reports failure after the main transaction has committed;\n- the user receives no identifier for the existing order and is told to try again;\n- email is sent synchronously without a separate state or retry owner;\n- monitoring does not distinguish order-acceptance failure from notification failure;\n- a team proposes a queue but cannot explain a failure between the database commit and message publication.\n\n## Consequences\n\nDuplicate orders can be created and customer support receives contradictory evidence. Increasing retries makes matters worse because the wrong part of the process is repeated. An ordinary queue publish after the database write can also lose the task if the process terminates between the two writes.\n\n## A better decision\n\n1. Define when the business operation is accepted and return its truthful result with an identifier.\n2. Record the intent to notify durably. A task record in the same transaction or a transactional outbox closes the gap between the database and broker.\n3. Retry delivery only. Use a stable identifier, bounded attempts, backoff and an idempotent consumer or deduplication.\n4. Expose operational state: pending tasks, oldest age, attempt counts and permanent errors. Route exhausted tasks to intervention rather than oblivion.\n5. Test mail failure, process termination immediately after commit and duplicate publication. Expect one order and controlled notification delivery.\n\n## Boundary\n\nIf message delivery is a legal or business condition for acceptance, the process needs a different contract. Do not invent that condition merely because two calls were convenient in one request thread.\n\n> Retry the failed effect, not the completed business operation."
  },
  '2026-10-01-autoryzacja-tylko-na-wejsciu': {
    title:"Authorisation checked at the entrance",
    summary:"The gateway validates a token, while downstream layers assume that an authenticated user may access any referenced resource.",
    content:"**Fictional example.** This does not describe a particular organisation or incident.\n\n## Situation\n\nAn API gateway validates the token and forwards a request to services. Teams assume the user is “already authorised”. The reporting service loads a resource by ID, the cache omits tenant identity, and an export worker trusts the tenant identifier in a message. Every component follows its local instruction, but the end-to-end path does not enforce one access boundary.\n\n## Warning signs\n\n- tests cover invalid and valid tokens but never ask whether a valid user can read another tenant's resource;\n- roles such as `admin` are not bound to a tenant or scope;\n- a cache hit, export or search path bypasses the check used for database queries;\n- tenant identity comes from a request parameter or message without being bound to trusted identity;\n- the security review ends at the gateway diagram.\n\n## Consequences\n\nA correctly authenticated user may read or alter another tenant's data. The defect can be hard to see because logs show a valid token and a 200 response. A central gateway creates an impression of control but does not know the meaning of every report, file or job.\n\n## A better decision\n\n1. Define trusted tenant and operation context. Bind roles to scope and decide access for the particular resource.\n2. Enforce scope on every data path: writes, reads, caches, indexes, exports and messages. Add an independent data-layer barrier where risk warrants it.\n3. Deny by default. Missing or ambiguous context stops the operation; it does not select a “default tenant”.\n4. Test identifier collisions, role changes, delayed jobs and warm caches. Observe decisions without copying protected content into logs.\n5. Plan migration after changing the mechanism: invalidate old sessions and cache entries, inspect queued messages and establish the possible scope of prior exposure.\n\nA central policy can reduce drift but must be available, versioned and understandable to services. Local checks may be simpler but need a shared contract and tests. In either design, “the gateway checked it” is not evidence.\n\n> Authentication opens the system door. It does not automatically provide a key to every room."
  },
  '2026-09-30-backup-bez-proby-odtworzenia': {
    title:"A backup nobody has restored",
    summary:"A green backup report does not prove the entire service can return within its recovery target.",
    content:"**Fictional teaching example.** No particular organisation or incident is described.\n\n## Situation\n\nAn operator shows a green report for nightly backups. Asked about restoring the application, files and queue, the team replies, “The backups are there.” The service owner assumes a 30-minute recovery time. Nobody has measured download time, access to encryption keys or whether the stores form a consistent recovered state.\n\n## Warning signs\n\n- Monitoring checks that the backup job finished but never reads from the backup.\n- The runbook names a tool, not the order of recovery, dependencies or who can approve resuming traffic.\n- RPO and RTO describe “the system” although database, files and messages follow separate schedules.\n- The last drill used a small old sample and never tested the full user journey.\n\n## Consequences\n\nA backup may be unreadable, a key unavailable or restored attachments may not match database records. Even a good backup of one component cannot restore the whole service. A green job status then measures the scheduler, not architectural resilience.\n\n## A better decision\n\n1. Define what “service restored” means to a user; set RPO and RTO for that journey.\n2. Check backup retention, integrity, availability and keys when the primary region is unavailable. Restrict access and rehearse in isolation.\n3. Rehearse the entire runbook on representative data volume: database, files, messages, configuration and routing. Restore the function and run a transactional test.\n4. Measure achieved targets, record gaps and owners for remediation. Repeat after material changes and periodically verify that recent backups can be read.\n\nA drill consumes time and infrastructure. Skipping it has a cost too; it merely sends the bill at the worst moment.\n\n> A backup has value when you can use it to restore the required service within the agreed time."
  },
  '2026-09-29-migracja-schematu-jeden-krok': {
    title: 'One-step schema migration',
    summary: 'Code, data backfill and removal of the old contract ship together, preventing version coexistence and leaving rollback with an incompatible schema.',
    content: `**Fictional teaching example.** It does not describe a particular organisation or incident.

## Situation

A team changes the name and meaning of a database column used by several application instances. One deployment adds the new field, rewrites every row, switches the code and drops the old field. The plan assumes every step finishes before traffic resumes.

## Where the anti-pattern appears

The rollout treats code, schema and a multi-million-row backfill as one instant. In practice, instances change gradually, data migration can run for a long time, and one step may need to be reversed independently. Destructive removal prevents the old version from operating and can eliminate a safe rollback path.

## Warning signs

- a migration drops a field or changes its meaning before all consumers have retired;
- there is no compatibility matrix for code and schema versions;
- the backfill must complete in one maintenance window and cannot safely resume;
- rollback covers only the application image, not data written after the change;
- “the script exited successfully” substitutes for completeness and consistency checks.

## A better decision

1. Expand the schema compatibly with the old version.
2. Define transition writes explicitly. Dual writes have a cost: name the transformation owner and measure discrepancies.
3. Backfill in idempotent, resumable batches while measuring locks, load, progress and skipped records.
4. Switch reads only after measurable exit criteria pass. Rehearse mixed-version operation and rollback.
5. Remove the old contract in a later deployment after telemetry shows no consumers and the rollback window closes.

## The trade-off

Parallel change takes longer and temporarily adds complexity. In return, it limits blast radius, makes each stage observable and separates a reversible switch from destructive cleanup. Not every table needs elaborate automation, but every destructive change needs an explicit compatibility analysis.

> Destructive cleanup should not be the first step of a change whose success is still unproven.`,
  },
  '2026-09-wspolna-pula-zaleznosci': {
    title: 'One resource pool for every dependency',
    summary: 'A slow reporting service consumes shared workers and prevents orders from completing.',
    content: `**Fictional teaching example.** It does not describe a particular organisation or incident.

## Situation

An application processes orders and generates reports. Calls to both external services use the same connection pool and queue. When reporting slows down, its requests occupy the workers. Orders begin to wait, even though their own dependency is healthy.

## Where the anti-pattern appears

The configuration assumes sharing resources has no cost. The lower priority of reports is not reflected in technical limits. A slowdown in one dependency consumes the time and concurrency budget of the others. Doubling the common pool might briefly shorten the queue; the problem returns under another traffic spike.

## Warning signs

- Critical and optional calls use one unbounded queue.
- One timeout applies to operations with different service objectives.
- Metrics show only total connections, with no per-dependency view.
- During a provider failure the team increases pool size and retries without testing the impact on other features.

## A better decision

1. Identify which functions must continue when other dependencies fail, and give each a time budget.
2. Add separate concurrency limits, pools or queues where isolation matches that boundary. Size them with measurements.
3. Decide what happens when a limit is reached: reject new work, defer it, or return a partial result. Make the outcome clear to the user.
4. Measure saturation for each segment and exercise a slowdown under load.

Isolation costs capacity: idle resources in one pool may not be available to another. Compare this cost with the price of a shared failure. A small system does not automatically need many pools; priorities and measurements should drive the choice.

## Rule to remember

> If functions must survive different failures, sharing their resource pool needs an explicit justification.`,
  },
  '2026-09-anon-temporary-file-integration': {
    title: 'A temporary file integration without an exit decision',
    summary: 'A quick integration becomes the target architecture when no owner, contract or migration trigger is recorded.',
    content: `> **Anonymised case.** Based on a real architectural dilemma with identifying details removed. This describes a decision risk; it does not claim an unverified failure or outcome.

## Situation

A large project introduces a new back-office system on a tight schedule. The team chooses a familiar integration: one system prepares a file, an intermediary processes it, and another imports the data. Architects review the direction after it has been chosen. They see a short-term benefit in reusing a known flow and a long-term cost in inheriting the old contract's constraints.

## Where the anti-pattern appears

**Files and batches are not inherently wrong.** The problem starts when a launch-time compromise is presented as the final design without an explicit decision about data lag, failures, contract ownership and a path out.

“We will change it someday” is not a migration plan. A late architecture review must distinguish an assessment of an existing decision's risk from unconditional endorsement.

## Questions that expose the risk

- Who owns the format and its versioning rules?
- How are a missing file, duplicate, retry and partial import detected and handled?
- Do consumers depend on internal export structure instead of a stable business contract?
- Who owns migration, what triggers it and when is the decision reviewed?

These are review questions, not claims that every issue occurred in the source project.

## Make the trade-off explicit

1. Call the solution **temporary** if that is its role. Record the reason and the cost of deviating from the intended direction.
2. Specify the data contract, frequency, acceptable lag, completeness checks, retries, idempotency and failure ownership.
3. Compare options against actual needs. An API or events are not automatically better; freshness, scale, resilience and change cost matter.
4. Give the migration plan an owner, triggers, backlog, compatibility tests and a review date.
5. Separate the architecture opinion from the project's decision to accept a deadline and its risk.

## Rule to remember

> A time-bound compromise needs boundaries, an owner and exit conditions. Without them, the interim design can become permanent debt.`,
  },
  '2026-07-rozproszony-monolit': {
    title: 'The distributed monolith',
    summary: 'Services share a database and deploy together, adding network costs without independent change.',
    content: `> **Composite example.** This combines recurring patterns from similar cases. Names are omitted; it is not a report about one identifiable organisation.

## Starting point

A growing commerce monolith still works, but deployments are tense. A team splits it into many services, expecting independent scaling and delivery.

## What the team built

- Services were split along technical entities and layers.
- One request crossed several synchronous service calls in a chain.
- All services shared one database.
- Changes across several services required coordinated deployments.

## Why the design struggled

Network hops added latency and new failure modes. One slow service held up the entire chain. A shared schema created hidden coupling; changing it could break another service. Coordinated deployments removed much of the intended autonomy while keeping the operational burden of distribution.

## Questions to ask early

- Can these services change and deploy independently?
- What happens to the user journey when one dependency fails?
- Why is the database shared and who owns each piece of data?
- Were boundaries chosen by business capability and ownership, or by technical layer?

## Better decision

Start with clear modules and ownership. Extract a service when independent scaling, ownership or deployment has a demonstrated value. Keep write ownership behind a clear boundary. Use asynchronous communication when the business process allows it and failure isolation requires it; account for eventual consistency and operations.

> Distribution is useful when it creates independence. A network boundary alone does not.`,
  },
  '2026-09-wspolna-baza-integracyjna': {
    title: 'A shared database as an integration shortcut',
    summary: 'Direct access turns internal tables into an unversioned API and bypasses the data owner’s rules.',
    content: `> **Teaching scenario.** This is a model case, not a description of a specific deployment or organisation.

## Starting point

An order system needs to expose status to a customer portal. To meet a deadline, the portal receives direct read access to its database. Later it also gets permission to update a delivery address because it seems to be just one column.

## What begins to break

- The portal interprets a status value differently after the source system changes its meaning.
- A schema migration requires coordinated deployments.
- The portal updates addresses without the order system's validation and business rules.
- Database access makes it harder to constrain and audit business operations.

## The decision behind the problem

An internal data model became an integration contract, then another system gained write access to it. Tables and columns became an informal API without versioning or explicit ownership. Controlled analytics or a read replica are different decisions from sharing a transactional database and write logic.

## A better approach

1. Establish who owns orders and delivery addresses. Route writes through that owner's explicit contract and validation.
2. Choose the read mechanism by freshness needs: an API for current status, or events and a portal-owned read model when delay is acceptable.
3. Version contracts and plan compatibility during migration. Monitor lag, errors and discrepancies.
4. If direct access is temporary, limit its scope, set an end date and plan the transition.

## Review questions

Who can change the data? How current must the portal view be? How do both systems survive a change to the schema or status meaning?

> The boundary of data ownership should also be a boundary of writes.`,
  },
};

export const englishAntipatterns = patterns.map(pattern => ({
  id: pattern.id,
  date: pattern.date,
  ...translations[pattern.id],
}));
