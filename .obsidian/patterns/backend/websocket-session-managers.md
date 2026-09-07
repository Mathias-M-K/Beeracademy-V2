---
type: pattern
layer: backend
updated: 2026-09-04
tags: [pattern, backend, websocket]
---

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

## Close Codes Are a Wire Contract With Two Test Sites

`WebsocketCodes` (`websocket/game/models/`) is the single source of truth: `WebsocketCodeSchemaFilter`
reads `values()` at OpenAPI-generation time and rewrites the schema into an integer enum for the
frontend generator.

**Adding a value breaks `WebsocketCodeSchemaFilterTest`.** That test asserts the numeric codes and the
`x-enum-varnames` list *explicitly* (deliberately — the wire contract should not be derived from the
same enum it verifies), so a new constant means updating three lists in it: the fixture names, the
codes, and the PascalCase varnames. `PLAYER_RELINQUISHED(4040)` was added on
`session-ownership-transfer` and this is exactly what broke.

`AbstractGameSessionManager.disconnectAndReleasePlayer(playerId, WebsocketCodes, reason)` takes the
close code from the caller, so `PlayerClientSessionManager.onConnectionClosed` can tell a kick
(`KICKED`) apart from an ordinary leave and stay quiet about the former — the game client has already
been told. Tests must therefore pass a real `CloseReason`, never `null`.

## Related