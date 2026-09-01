# Architecture tests (ArchUnit)

Status: **started 2026-09-01** — first rules landed, list below is unfinished.

Machine-enforced version of [[rules]]. Where a rule in that file carries a `grep` as its
**check**, the goal is to replace it with an ArchUnit rule that fails `./gradlew test`.
A grep you have to remember to run is not a check.

## Current state

- Dependency: `com.tngtech.archunit:archunit-junit5:1.3.0` (`testImplementation`, `build.gradle`)
- Tests live in `src/test/java/dk/mathiaskofod/architecture/`
- First test: `SseEventPublisherAccessTest`
  - `SseEventPublisher.playerConnectionEventStream` — only callable from `dk.mathiaskofod.api..`
  - `SseEventPublisher.publishNewConnectionEvent` — only callable from `dk.mathiaskofod.services..`

Origin: `SseEventPublisher` was originally written in `api/events/` and injected into
`PlayerClientSessionManager`, making `services` depend on `api` — backwards through the
layers. The class was moved to `services/event/publisher/`, and these tests exist so the
same drift cannot recur silently.

## TODO

- [ ] **Layer rule** `Api → Services → Domain`, `Api` accessed by no layer.
      Would have caught the `services.session → api.events` import that started this.
- [ ] **Rule 1 of [[rules]] — domain isolation.** Replace the two greps with
      `noClasses().that().resideInAPackage("..domain..").should().dependOnClassesThat()
      .resideInAnyPackage("..services..", "jakarta.enterprise..")`.
      Must encode the known exceptions (`GameEventEmitterImpl`, `BaseException`) as explicit
      allowances, or the rule fails on day one — see [[known-issues]] #6.
- [ ] **Rule 2 — `grep -rn "lobbyId"` returns nothing**, and `gameId` appears only under `domain/`.
- [ ] **JAX-RS annotations only in `api..`** — stops endpoints appearing in the service layer.
- [ ] **Wire-type annotations** (`@Category`/`@ActionType`/`@EventType`, rule 4) present on
      every envelope/action record implementing the marker interfaces.

## Gotchas

- **Always `ImportOption.DoNotIncludeTests`.** Without it, a unit test of the class under a
  rule violates that rule, and the pressure becomes to weaken the rule rather than fix the code.
- **Verify every new rule by temporarily introducing a violation.** A rule whose matcher
  selects nothing passes silently and green-washes forever. This was done for both existing
  rules: a deliberate `playerConnectionEventStream` call was added inside
  `PlayerClientSessionManager`, confirmed to fail, then reverted.
- **Bytecode, not source.** ArchUnit sees direct invocations; reflection and some method
  references are invisible to it. This is drift protection, not a security boundary.
- Quarkus CDI client proxies are generated during augmentation and are not in
  `build/classes/java/main`, so they do not pollute the analysis.

## Why this over the alternatives

Java has no per-caller access control. Package-private is package-scoped (would require
colocating the service with its API), `sealed` restricts *implementation* not *invocation*,
and JPMS `exports … to …` is module-level and impractical under Quarkus's classpath model.
Gradle subprojects would work but are a large restructuring. ArchUnit is the only option
that expresses "only this layer may call this method" at the granularity wanted.

## Related
- [[rules]] — the conventions these tests are meant to enforce
- [[known-issues]] — violations tolerated today; encode them as allowances, not as weakened rules
- [[project-beeracademy]] — layer layout
