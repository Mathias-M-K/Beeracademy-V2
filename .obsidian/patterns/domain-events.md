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
Events are fire-and-forget broadcasts — no persistence, no replay. All state is in-memory. See [[no-database]].
