# Known Issues

Live registry of known problems that are **documented but not fixed**. Most were surfaced
while analysing the `lobbyId`/`gameId` → `partyId` rename ([[party-id-unification]]) and
deliberately left alone to keep that diff single-purpose; none were caused by it.

Resolved entries are kept (struck through, marked ✅) rather than deleted, so the history
stays readable. See [[rules]] for the conventions several of these violate.

## 1. `GET /games/{partyId}/claim` is unreachable
`GameSessionService.claimGame` throws `ResourceClaimException("...already claimed")`
whenever a session already exists for the id. A lobby-born game **always** has one —
created in `LobbyService.createLobby`, and on the transition path only ever
connection-cleared, never removed. Since `GameService.createGame` has exactly one caller
(`LobbyService.createGame`), every game is lobby-born, so this endpoint can never succeed.
Either delete it or make it tolerate an existing session.

## 2. Dangling token factory
`AuthenticationService.createGameClientToken(String gameName)` (the single-arg overload)
mints a fresh id via `IdGenerator` and signs a token for a game that does not exist.
Nothing good can come of using it.

## 3. Lobby leak on zero-participant start
`deleteLobby` is only reachable from `removeDisconnectedParticipant`. If the leader starts a
game with no active participants, nothing ever triggers deletion and the `Lobby` lingers in
the in-memory map for the process lifetime.

## 4. Id format inconsistency
- Generator emits **uppercase only**: `[A-Z0-9]{9}`.
- Validation accepts mixed case: `^[A-Za-z0-9]{9}$`.
- Every OpenAPI example is `aB3cD5eF7` — an id the generator **cannot produce**.
- The dash-stripping in the id DTO implies an `ABC-DEF-GHI` display format that is only
  documented in the frontend pipe.

Either tighten the regex to `[A-Z0-9]{9}` or accept lowercase deliberately; fix the
examples either way.

## 5. Unprefixed Redis game keys
`GameService` stores snapshots at the **bare** id, in the same keyspace as `SESSION:*`.
There is a standing `// TODO introduce cache key prefix`. No TTL either, so finished games
persist forever. See [[redis-state-store]].

## 6. Domain → services import — ✅ RESOLVED 2026-08-25
~~`domain/game/player/Player.java` imports `services.lobby.models.LobbyParticipant` for
`Player.fromParticipant(...)`, and `services.game.id.generator.IdGenerator` for
`Player.create(...)`.~~

Fixed. `fromParticipant` was replaced by `LobbyParticipant.toPlayer()` (the service type now
maps *to* the domain, which is the allowed direction), and `Player.create` was deleted — it
had no production callers, only tests, which now use the canonical constructor as
`GameServiceTest` already did. `Player` is now a plain record with no outward imports.

Both guardrails from [[party-id-unification]] return zero:
```
grep -rn "import dk.mathiaskofod.services" src/main/java/dk/mathiaskofod/domain
grep -rniE "party|lobby|websocket" src/main/java/dk/mathiaskofod/domain
```

Still outstanding in the domain, though narrower than this issue was:
- `GameEventEmitterImpl` imports CDI (`jakarta.enterprise.*`, `jakarta.inject.Inject`) — a
  framework dependency inside `domain/`.
- Five domain exceptions extend `providers.exceptions.BaseException`, which carries an HTTP
  status code — an API concern reaching into domain errors.

## 7. `CLAUDE.md` is stale
Still claims "No Database: game state is maintained in memory only". Untrue — see
[[redis-state-store]].

## 8. Lobbies are single-instance
`LobbyRepository` is a plain in-memory `HashMap` while sessions and games are in Redis, so
lobbies cannot survive a restart or be shared across replicas. Blocks horizontal scaling
for the lobby phase specifically.

## 9. Frontend runtime config fails silently in three places
The `API_URL` → `config.json` → `window.APP_CONFIG` chain ([[frontend-runtime-config]]) has no
fail-fast step. An unset `API_URL` makes `envsubst` write `"apiUrl": ""` (same-origin requests,
no error); a missing `config.template.json` makes the entrypoint's `if [ -f ... ]` guard skip
substitution and serve the committed **localhost** config from a production container; a failed
`fetch('/config.json')` in `main.ts` only `console.error`s, so the app never bootstraps and the
page is blank. `set -eu` plus an explicit non-empty check in `docker-entrypoint.sh` would close
the first two.

## Related
- [[party-id-unification]] — the change during which these were found
- [[frontend-runtime-config]] — issue 9
- [[redis-state-store]] — issues 5, 7, 8
- [[party-id-lifecycle]] — issue 6's boundary rule
