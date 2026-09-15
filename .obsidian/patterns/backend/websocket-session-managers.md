---
type: pattern
layer: backend
updated: 2026-09-15
tags:
  - pattern
  - backend
  - websocket
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

`WebsocketCode` (`websocket/game/models/`, singular since `improved-navigation-between-pages`,
2026-09-15) is the single source of truth: `WebsocketCodeSchemaFilter` reads `values()` at
OpenAPI-generation time and rewrites the schema into an integer enum for the frontend generator.
The filter matches the schema by **name** (`SCHEMA_NAME = "WebsocketCode"`) — renaming the enum
means renaming that constant, or the filter silently no-ops.

Current codes:

| Constant | Code |
|---|---|
| `GOING_AWAY` / `ABNORMAL_CLOSURE` / `SERVICE_RESTART` / `TRY_AGAIN_LATER` | 1001 / 1006 / 1012 / 1013 |
| `SESSION_NOT_FOUND` | 4000 |
| `SESSION_OCCUPIED` | 4001 (frontend-only use: lobby/game state resolvers) |
| `LOBBY_NOT_FOUND` | 4002 |
| `GAME_NOT_FOUND` | 4003 |
| `LOBBY_LEADER_LEFT` | 4010 |
| `KICKED` | 4020 |
| `TRANSITIONING` | 4030 |
| `UNKNOWN` | 4040 |
| `PLAYER_RELINQUISHED` | 4050 |

**Renumbering is a coordinated deploy.** Codes are matched numerically against `CloseEvent.code`; a
frontend built against an older generated client misreads every shifted code. Regenerate the client
and ship both together.

**Adding or renaming a value breaks `WebsocketCodeSchemaFilterTest`.** That test asserts the schema
name, the numeric codes and the `x-enum-varnames` list *explicitly* (deliberately — the wire contract
should not be derived from the same enum it verifies), so a change means updating the fixture names,
the codes, the PascalCase varnames, and the schema key. Broke twice: `PLAYER_RELINQUISHED` on
`session-ownership-transfer`, and the `WebsocketCodes` → `WebsocketCode` rename.

`WebsocketCodeTest` guards the enum itself: codes are distinct, and app-defined codes stay in the
4000–4999 private range.

`AbstractGameSessionManager.disconnectAndReleasePlayer(playerId, WebsocketCode, reason)` takes the
close code from the caller, so `PlayerClientSessionManager.onConnectionClosed` can tell a kick
(`KICKED`) apart from an ordinary leave and stay quiet about the former — the game client has already
been told. Tests must therefore pass a real `CloseReason`, never `null`.

## Related