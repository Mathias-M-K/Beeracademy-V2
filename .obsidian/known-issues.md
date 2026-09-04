---
type: registry
updated: 2026-09-04
tags: [issues, open]
---

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

## 7. `CLAUDE.md` is stale — ✅ RESOLVED 2026-09-04

~~Still claims "No Database: game state is maintained in memory only". Untrue — see
[[redis-state-store]].~~

Fixed. `backend/CLAUDE.md:187` now reads "Games and sessions are persisted to Redis; lobbies are
still in-memory", and lines 310–312 spell out the single-instance consequence and name
[[redis-state-store]] as superseding the "no database" ADR. Verified 2026-09-04.

## 8. Lobbies are single-instance
`LobbyRepository` is a plain in-memory `HashMap` while sessions and games are in Redis, so
lobbies cannot survive a restart or be shared across replicas. Blocks horizontal scaling
for the lobby phase specifically.

## 9. Frontend runtime config fails silently in three places
The `API_URL` → `config.json` → `window.APP_CONFIG` chain ([[runtime-config]]) has no
fail-fast step. An unset `API_URL` makes `envsubst` write `"apiUrl": ""` (same-origin requests,
no error); a missing `config.template.json` makes the entrypoint's `if [ -f ... ]` guard skip
substitution and serve the committed **localhost** config from a production container; a failed
`fetch('/config.json')` in `main.ts` only `console.error`s, so the app never bootstraps and the
page is blank. `set -eu` plus an explicit non-empty check in `docker-entrypoint.sh` would close
the first two.


## 10. `session` means two things across the party-state endpoint's branches
`services/party/PartyService.java` — in the GAME branch `isClaimed` means "player slot has been
claimed" (`GameSessionService.claimPlayer` registers the session). In the LOBBY branch a
participant only gets a `Session` when they open a websocket — `LobbyParticipantSessionManager`
is still the only registration site, and `LobbyApi.registerParticipant` mints a JWT but registers
nothing.

**Effect:** a registered-but-not-yet-connected lobby participant reports `isClaimed: false`, so any
client rendering `ExistingParticipant` for a LOBBY party (nothing prevents it — the DTO is
identical) offers that row as free to take. Promoted from
[[party-state-endpoint-review]] #4.

## 11. `/join` participant selection is not guarded against keyboard activation
`frontend/src/app/pages/join-page/join-page.ts`, `join-page.html` — the ineligibility guard is CSS
(`pointer-events: none`), and the `(keydown)` binding fires on *any* key including Tab.
`onParticipantSelected` has no eligibility check of its own.

Not a security hole — the server blocks the claim regardless — but keyboard users can trigger a
doomed claim, and it is an accessibility gap against the WCAG AA baseline the frontend is held to.
**Fix direction:** block keyboard activation for non-selectable rows and narrow the handler to
Enter/Space. Promoted from [[party-state-endpoint-review]] #7.

## 12. `PartyService` depends outward on the API layer
`services/party/PartyService.java` imports `api.party.models.PartyDto` / `PartyParticipantDto` — a
service depending on the API layer, against [[rules]] §1 "dependencies point inward". Cross-layer
DTOs belong under `common/dto/`; compare `GameSessionService` → `common.dto.game.GameDto`.

Also: `getPartyState` now returns a full `PartyDto`, not a `PartyState`, so the method name no
longer matches. Needs a decision, not just a move. A layer rule in
[[architecture-tests]] would catch the recurrence. Promoted from
[[party-state-endpoint-review]] #8.

## 13. Dead crumbs from the party-state change
Both cosmetic, both frontend:
- `src/api-models/model/partyStateDto.ts` — stale generated model; the backend `PartyStateDto`
  record was deleted. Unreferenced, and will vanish on the next client regeneration.
- `party-api.service.ts` — a leftover `console.debug("Getting party:", partyId)` and a no-op
  `map(partyStateDto => partyStateDto)` with its now-redundant `map` import.

## Related

- [[rules]] — the conventions several of these violate
- [[security-issues]] — security defects, tracked separately
- [[party-id-unification]] — the change during which issues 1–9 were found
- [[party-state-endpoint-review]] — the archived review issues 10–13 were promoted from
- [[architecture-tests]] — machine-enforced checks; issues 6 and 12 are what it must encode
- [[runtime-config]] — issue 9
- [[redis-state-store]] — issues 5, 7, 8
- [[party-id-lifecycle]] — issue 6's boundary rule
- [[README]] — vault index
