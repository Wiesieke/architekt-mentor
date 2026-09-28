import patterns from '../../data/antywzorce.json';

const translations: Record<string, { title: string; summary: string; content: string }> = {
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
