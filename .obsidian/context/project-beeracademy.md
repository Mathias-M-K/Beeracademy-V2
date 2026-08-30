# Beeracademy — Project Context

## What It Is
Multiplayer online card game backend. Players connect via WebSocket to play in real-time. Sessions and game snapshots live in **Redis**; only lobbies are in-memory. See [[redis-state-store]] (supersedes [[no-database]]).

## Stack
- **Runtime**: Quarkus + Java 21
- **Build**: Gradle
- **WebSocket**: Quarkus WebSockets Next
- **Auth**: JWT (MicroProfile JWT), returned as HTTP-only cookies (not headers), 5-hour expiry. See [[jwt-in-cookies]].
- **API docs**: SmallRye OpenAPI at `/q/openapi?format=json`, Swagger UI at `/q/swagger-ui/`
- **Tests**: JUnit 5, Mockito, REST Assured, JaCoCo coverage
- **Deploy**: Docker → Kubernetes (`kubectl apply -f ../deployment/backend`)

## Current Branch (as of 2026-08-25)
`party-id-introduction` — unifying `lobbyId`/`gameId` into a single `partyId`. See
[[party-id-unification]] and [[party-id-lifecycle]].

Previously `improvement/better-lobby-logic` (merged): kicking participants when the lobby
leader leaves, lobby WebSocket improvements, `AbstractLobbySessionManager`, `Map`-based
participant management, `RoleNotFoundException`.

## Frontend
Angular v20 (standalone, signals) in `frontend/`. Talks to the backend over the
same lobby/game WebSockets. For how transient per-target events (e.g. emoji
reactions) are routed from a service to a single dumb child component, see
[[frontend-reaction-routing]].

The backend URL is **not** compiled into the bundle — it is fetched from `/config.json` at
startup, which the container's entrypoint rewrites from `API_URL` at boot. To repoint an
environment you edit `deployment/frontend/deployment.yaml`, not the frontend source. The same
mechanism drives `npm run start:mock` against an Insomnia mockbin server. See
[[frontend-runtime-config]].

## Game Flow
1. Host creates a **lobby** via `POST /lobbies`; gets a `partyId` and a JWT cookie
2. Participants register via `POST /lobbies/{partyId}/register` and connect to `/ws/lobby`
3. Host starts the game → the lobby is deleted, a Game is created under the **same**
   `partyId`, and everyone reconnects to `/ws/game`. See [[party-id-lifecycle]].
4. State changes broadcast to all clients as domain events. See [[domain-events]].

Note: games are **only** ever created from a lobby — `LobbyService.createGame` is the sole
caller of `GameService.createGame`. There is no lobby-less game-creation path, and
`GET /games/{partyId}/claim` is unreachable as a result (see [[known-issues]]).

## Key Packages
| Package | Purpose |
|---|---|
| `api/` | REST endpoints (auth, lobby, game, ping) |
| `common/dto/` | Shared DTOs |
| `domain/game/` | Pure domain models — deck, events, player, timer. Knows **only** about the Game: no lobby/party/websocket/API concepts, and keeps `gameId` internally. See [[party-id-lifecycle]]. |
| `services/lobby/` | Lobby management |
| `services/session/` | WebSocket session managers. See [[websocket-session-managers]]. |
| `services/game/` | Game business logic. `GameService` = commands (session-free); `GameSessionService` = the layer that joins Game state + Session info (DTO reads + claim commands). See [[game-query-service]]. |
| `services/auth/` | JWT generation/validation |
| `websocket/` | WebSocket handlers |


`services/party/` + `api/party/` (new on `party-id-introduction`): `PartyService.getPartyState`
resolves a `partyId` to a single `PartyDto` for the frontend `/join` page — GAME branch first
(`gameService.gameExists`), then LOBBY (`lobbyService.lobbyExist`), else `PartyNotFoundException`
(404). Lobby participants are sorted by position; game participants keep `Game.getPlayers()` order.
Covered by `PartyServiceTest` / `PartyApiTest` as of 2026-08-29.

Open: `PartyService` imports `api.party.models.PartyDto` — a service depending outward on the API
layer, against [[rules]] §1. Cross-layer DTOs belong under `common/dto/`.

## Dev Commands
```bash
./gradlew quarkusDev       # dev mode with live reload
./gradlew test             # run tests
./gradlew manual_deploy    # full deploy pipeline
```

## Rules
Architectural conventions this codebase is held to — domain isolation, the `partyId`
boundary, wire contracts, test style: see [[rules]].

## Known Issues
Problems that are documented but not fixed: see [[known-issues]].
