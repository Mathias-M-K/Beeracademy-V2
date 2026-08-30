# ADR-003: GameSessionService — unify Game state + Session info

**Date**: 2026-06-19
**Status**: Accepted

## Context
`GameService` is a pure command/domain service (Redis game snapshots) with no session knowledge — correctly so. `SessionRegistry` is the separate source of truth for session/connection state. But the API needs **both** together: read-models (`GameDto`/`PlayerDto` carry per-player and game-level `SessionDto` — `isClaimed`/`isConnected`) and the claim flow (validate game/player, then register a session).

That logic previously lived in `LobbyService` (`getGame`/`getPlayerDtos`/`claimGame`/`claimPlayer`, all `@Deprecated(forRemoval=true)`), forcing the lobby to depend on `GameService` + `SessionRegistry` just to glue things together. `GameClientSessionManager.onNewConnection()` also reached into `lobbyService.getGame()`.

## Decision
Introduce **`GameSessionService`** (`services/game/GameSessionService.java`) — the single layer that joins Game state (`GameService`) with Session info (`SessionRegistry`). It injects both and owns:
- **Reads**: `getGameView(gameId)`, `getPlayerViews(gameId)` — assemble DTOs.
- **Claim commands**: `claimGame(gameId)` (validate + register), `claimPlayer(gameId, playerId)` (validate + register, returns `Player`).

`GameApi` and `GameClientSessionManager` call it. The deprecated methods (and the `AuthenticationService` dependency) were removed from `LobbyService`, which is now purely lobby concerns. `GameApi` no longer depends on `LobbyService`.

**JWT minting stays in the API layer** — `GameApi` calls `AuthenticationService` directly after the claim, mirroring the existing `LobbyApi`/`LobbyService` split. `claimPlayer` returns the `Player` so the API can mint the player token from `player.name()`.

### Considered and rejected
- A separate `SessionService` for claims + keeping a read-only `GameQueryService` (CQRS split). Rejected as over-segmented: the claim service had one caller and two methods, and both reads and claims need the exact same two collaborators (`GameService` + `SessionRegistry`). One cohesive class that names the unification (`GameSessionService`) was preferred over two thin ones.
- Folding claim logic into `SessionRegistry`. Rejected — `SessionRegistry` is a repository (Redis CRUD); claim rules need `GameService`, and a repo must not depend across into another aggregate's service.

## Consequences
- `GameService` stays session-free; the Game+Session join is one named class's job, not the lobby's.
- Slightly mixes query + command in one class (the name owns this); acceptable given identical collaborators and a single API consumer.
- Reuses existing factories (`GameDto.create`, `PlayerDto.create`, `SessionDto.create/createEmpty`) and `ResourceClaimException` — no DTO changes.

See [[websocket-session-managers]], [[project-beeracademy]].
