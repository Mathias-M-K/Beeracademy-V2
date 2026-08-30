# Pattern: WebSocket Session Managers

## Structure
Each client type gets a concrete session manager extending an abstract base:
- `AbstractSessionManager` (game websocket base)
- `AbstractLobbySessionManager` (lobby websocket base, added 2026-06)

Concrete managers implement `onMessage()` with a switch/case over action envelopes.

## Adding a New WebSocket Action
1. Create action envelope in `services/session/envelopes/`
2. Add case to `onMessage()` in the relevant session manager
3. Implement action logic in the manager or delegate to a service

## Lobby Participant Management
Lobby uses a `Map` (not a `List`) for participant tracking — O(1) lookup by participant ID. Introduced in `improvement/better-lobby-logic`.

## Leader Departure
When the lobby leader disconnects, all connected participants are kicked. Implemented in `LobbyService` / lobby WebSocket handler.

## Related
- [[domain-events]] — events emitted after session manager actions
- [[project-beeracademy]] — overall architecture context
