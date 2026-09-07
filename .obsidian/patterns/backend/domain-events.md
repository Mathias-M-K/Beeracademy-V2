---
type: pattern
layer: backend
updated: 2026-09-04
tags: [pattern, backend, events]
---

# Pattern: Domain Events

## Structure
- Interface: `GameEventEmitter` (in `domain/game/events/emitter/`)
- Implementation: `GameEventEmitterImpl`
- Event classes live in `domain/game/events/`

## Known Events
`StartGameEvent`, `EndGameEvent`, `DrawCardEvent`, `ChugEvent` (and others)

## Adding a New Event
1. Create event class in `domain/game/events/`
2. Add emit method to `GameEventEmitter` interface
3. Implement in `GameEventEmitterImpl`
4. Handle in relevant session managers (broadcast to WebSocket clients). See [[websocket-session-managers]].

## Notes
Events are fire-and-forget broadcasts — no persistence, no replay, no event store. The *events*
are transient; the state they mutate is not. Game snapshots and sessions live in Redis — see
[[redis-state-store]], which supersedes the older [[no-database]] ADR this note used to cite.

`GameEventEmitterImpl` imports CDI annotations, which is one of the two recorded exceptions to
domain isolation — see [[rules]] §1 and [[known-issues]] #6.

## Related
- [[websocket-session-managers]] — where events are broadcast to clients
- [[redis-state-store]] — where the state the events mutate actually lives
- [[reaction-routing]] — the frontend equivalent mental model for transient events
- [[rules]] — §1 domain isolation
- [[README]] — vault index
