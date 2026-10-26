# Switching it off does not undo its effects

ArchitectMentor Weekly candidate. Editorial workshop, not a published issue. Updated on 26 October 2026; release date not assigned.

## From the editor

A switch labelled “Off” is reassuring. It is simple, visible and someone has tested it. But what does it stop: incoming requests, queue workers, database writes, or further questions?

This workshop separates three jobs: stopping new work, handling work already accepted, and repairing its effects. They are not three names for one rollback. Each needs its own success condition. Our goal is to replace “we can always go back” with a procedure that accounts for every class of operation.

## This week's reading: two selections and a deeper exercise

1. [A feature flag is not a rollback plan](/en/foundations/feature-flags-operational-contract/) — published on 24 October. Start with ownership, scope and fallback behaviour. Instead of repeating its six-field contract, the new exercise tests it against incompatible data.
2. [A log is not an audit trail](/en/foundations/business-audit-events/) — published on 21 October. During recovery, knowing who pressed the switch is insufficient: establish which operations actually happened. This article helps identify the evidence.
3. The new exercise and workshop below produce a compatibility matrix, an ADR and a rehearsal plan. They deepen the earlier work rather than republish it.

The 19 October Weekly, “Green does not mean complete”, remains unchanged. It is not a new issue and does not count as new material.

## Architecture puzzle: the feature flag is off. What happens to the queue?

Fictional educational scenario. It describes no real organisation, incident or first-hand experience. Intermediate level. Learning goal: align a recovery decision with compatibility across code, data and in-flight work.

A portal accepts applications. A new path records an additional state, `awaiting-check`, and queues a job. The old worker cannot interpret this state. The new worker supports both formats. The previous data field still exists, but that does not make every new record usable by the old logic. There is no confirmed defect in the new worker; reports concern results produced by the new intake path. Whether all those results are wrong is still unknown. New traffic must stop entering that path, while manual intake should remain available. Exercise assumptions: processing deadlines allow a short hold on affected applications, and the application identifier connects each record to its queued job.

### Quick decision — choose one of three options

A. Disable the new path and immediately roll back both application and worker binaries. This removes new code but requires evidence that the old release can read the new states and jobs.

B. Disable the new path for incoming applications, retain the compatible worker and separately identify in-flight work for review. This limits further exposure but requires state tracking and can delay some applications.

C. Pause all intake and processing until reconciliation is complete. This simplifies incident containment but also stops safe manual intake. It is justified if affected operations cannot be reliably separated or the defect's scope is unknown.

### Feedback on each option

B is the best starting point under these assumptions: a compatible worker exists and applications can be separated. That does not mean blindly draining the queue. Identify work from the new path and hold operations whose correctness is uncertain.

A can work after backward compatibility has been established or data has been migrated to a state the old release can handle. Neither is true here. Rolling back binaries does not create compatibility.

C is sensible containment when there is no reliable boundary around the affected work. Under the stated assumptions it costs more than B. If separation proves unreliable, reconsider C. A sound decision includes a condition for changing it.

### Mentor workshop

Use two or three sentences to explain what you stop, which code you retain and how you determine the fate of accepted work. Guiding question: “Can the old release interpret every state that now exists in the database or queue?”

Three criteria, each scored 0–2; maximum 6:

| Criterion | 0 points | 1 point | 2 points |
| --- | --- | --- | --- |
| Compatibility | Equates switching off with rollback | Mentions data | Addresses the unsupported state and queued-job format |
| Containment | Continues without control | Stops work without separating it | Separates intake, compatible processing and uncertain work |
| Evidence | Proposes no check | Suggests general monitoring | Proposes a new-state test and reconciliation of queued work |

The mentor assesses reasoning, not the chosen letter. A justified C is not penalised merely for being C. A cannot receive full credit without resolving the explicit incompatibility. This is the feedback design; this preview has no mentor API connection or automated scoring.

### Senior analysis and proposed ADR

First contain further exposure and preserve evidence. Enumerate applications accepted by the new path, their state, job version and confirmed effects. Do not replay the entire queue from the beginning: repeated execution may duplicate a business effect. Decide separately which states permit resumption, manual resolution or compensation. Do not promise automatic compensation when business rules do not permit it.

ADR — proposed. Context: the old worker cannot interpret an existing state; the new worker supports both formats. Decision: restrict new intake through the feature flag, retain compatible processing and isolate uncertain work. Consequences: retain the new code during recovery and maintain an inventory of accepted operations. Reconsideration condition: unreliable separation or a shared-mechanism risk requires a full pause. Verification: rehearse a new-format record, delayed job and retry without a duplicate effect. This is a proposal for a fictional project, not a decision implemented by the author.

## Forty-minute workshop: three plans instead of one rollback

Use the same fictional scenario. Produce one working sheet rather than five presentations. The outcome should be a procedure someone can execute without guessing what its author intended.

### 1. Scope and compatibility matrix — ten minutes

List incoming requests, records, jobs and external effects. For each, record producer and consumer versions, identity source and behaviour on an unknown format. Test meaning, not merely successful deserialisation: software can parse a state and still interpret it incorrectly.

### 2. Three separate actions — ten minutes

The first plan stops new work entering the risky path. The second defines what can finish: the retained worker, selective holds and cases needing a decision. The third repairs effects through correction, resumption or compensation where the process permits it. The service owner defines the acceptable business outcome; an operator should not infer it from a column name.

### 3. Rehearse the switching boundary — fifteen minutes

In an isolated environment, include work accepted both before and after the switch. Stop configuration delivery to one instance, delay a message and deliver it again. Check the behaviour actually executed and the final application state, not just the feature flag value. Derive time limits from project requirements rather than borrowing an arbitrary number from an exercise.

Evidence consists of test identifiers, expected and observed states, and a list of discrepancies. Missing measurements are not zero failures. Do not use real customer data to demonstrate that it is “only a test”.

### 4. Decision threshold — five minutes

Record who may stop the service, who verifies data compatibility and which rehearsal result blocks release. Remove old paths only after the compatibility window closes and outstanding work has been checked. A feature flag is a control mechanism, not a time machine for the database.

## Architecture in motion — selection, not filler

Microsoft lists event-driven cache updates as new Architecture Center guidance in October 2026. This is guidance, not a new service's GA or Preview announcement. The exact publication day has not been established; the topic remains a radar candidate, not a release-ready news item. A future analysis should examine a stale cache fill overwriting a newer update. Test a delayed old-version read finishing after a newer cache write: it must not replace the newer value.

GitHub Actions lockfiles were already covered on 19 October; they are not new again. Lambda Web Functions has a 12 October announcement, but an announcement alone does not justify a migration recommendation. We are not claiming there is no architectural news: this section has not yet completed selection and QA.

## Sources and boundaries

Checked on 25 October 2026: [OpenFeature evaluation API](https://openfeature.dev/specification/sections/flag-evaluation/), [provider events](https://openfeature.dev/specification/sections/events/), [Unleash evaluation consistency guidance](https://docs.getunleash.io/guides/best-practices-using-feature-flags-at-scale), [Azure Architecture Center changelog](https://learn.microsoft.com/en-us/azure/architecture/changelog). The specification does not supply data rollback or business compensation. The scenario, matrix, ADR and rehearsal are original educational synthesis, not a deployment report. No rehearsal or AI call described here was executed.
