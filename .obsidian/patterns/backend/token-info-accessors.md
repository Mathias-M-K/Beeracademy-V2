---
type: pattern
updated: 2026-09-13
tags:
  - pattern
  - backend
  - auth
---

# TokenInfo accessors

`services/auth/models/TokenInfo.java` wraps the `session_jwt` claims (see [[jwt-in-cookies]], [[rules]] §7).

## Invariants enforced in the constructor
- `PARTY_ID` claim must be present for every role → `TokenException` 403.
- `PLAYER_ID` claim must be present when role is `PLAYER_CLIENT` → `TokenException` 403.

A well-formed token can therefore never fail a player-id read later; the check happens once at the boundary.

## Two player-id accessors, two intents
| Method | Returns | Use when |
|---|---|---|
| `getPlayerId()` | `String`, throws 403 for a game client | Player-only code paths (`PlayerClientSessionManager`, `LobbyParticipantSessionManager`) |
| `findPlayerId()` | `Optional<String>` | Either role may be the caller (`GET /parties/current`) |

`getClientId()` stays role-switched: party id for a game client, player id for a player client — this is what makes the flat `SESSION:*` namespace work ([[party-id-lifecycle]]).

## Composed response for caller-aware endpoints

`GET /parties/current` resolves the party from the token and returns `CurrentPartyDto(role, playerId, partyState)` — a wrapper around the unchanged `PartyDto`. Do not add caller-specific nullable fields to `PartyDto`; wrap instead so `/parties/{partyId}` keeps an honest schema.

**"No current party" is `204`, not an error** (2026-09-13, PR #28). The endpoint is *not* `@Authenticated`:
- no token (`jwt.getRawToken() == null`) → `204`
- token's party gone (`PartyNotFoundException` caught in `PartyApi`) → `204`
- otherwise → `200` with `CurrentPartyDto`

**Why:** the welcome page probes this on every load; a first-time visitor has no cookie. 401/404 made that normal state show up as console errors (Chrome network log + `loggingInterceptor`). Frontend treats an empty body as "no existing party" (`party.api.ts` returns `CurrentPartyDto | null`).

**Residual:** an expired/invalid token can still yield 401 before the method runs (`quarkus.http.auth.proactive=false`, lazy JWT read). Welcome page swallows 401/404 for that case.

Tests: `TokenInfoTest`, `PartyApiTest` (real tokens minted via the injected `AuthenticationService`, sent as the `session_jwt` cookie; no-token and stale-party cases assert `204`).