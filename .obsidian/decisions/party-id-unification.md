# ADR-004: Unify `lobbyId` and `gameId` into `partyId`

**Date**: 2026-08-25
**Status**: Accepted

## Context
One 9-character id is minted per play-session and then called two different things
depending on the package looking at it: `lobbyId` in the lobby half, `gameId` in the game
half. It is the same string — `LobbyService.createLobby()` calls
`IdGenerator.generateGameId()`, and its javadoc already conceded
"Lobby ID, which will persist as Game ID".

Costs measured before the change:
- `String lobbyId = tokenInfo.getGameId();` appeared **6 times** purely to translate
  between the two vocabularies (`LobbyClientSessionManager` 37/50/81,
  `LobbyParticipantSessionManager` 32/58/96).
- `AbstractLobbySessionManager` used both names for the same value inside one class
  (`applyAndBroadcastSettings(String gameId)` vs `broadcastToLobby(String lobbyId)`).
- Leaked into user-visible text: a `lobbyId` param validated with the message
  "Invalid game ID format" (`LobbyApi`, `PlayerRegisterRequest`).
- Leaked into logs: `"Game id: {}"` logging a lobby id.
- Leaked into tests: `private static final String GAME_ID = "lobby-1";`

The id is neither a lobby id nor a game id: it identifies the **group of people playing
together across both phases**. It is minted once, never regenerated, deliberately outlives
the lobby (`deleteLobby(id, preserveSession)` → `clearConnectionId`), and simultaneously
keys three registries (`SESSION:<id>` in Redis, the game snapshot key, the in-memory
`LobbyRepository`).

The codebase had already reached for the word unprompted: `broadcastToParty(...)` existed
on the game side as the exact counterpart of `broadcastToLobby(...)`.

## Decision
Rename to `partyId`. **Rename only** — no `Party` class, no new lifecycle, no new endpoints.
`Lobby` and `Game` keep their structure and both simply refer to a `partyId`.

Critically: **the domain never learns the word "party".** `domain/` knows only about the
Game and keeps `gameId`. `partyId` exists only above the domain. There is exactly one
explicit hand-off — `GameService.createGame(name, partyId, players)` →
`new GameImpl(name, gameId, ...)`.

Also decided:
- JWT claim `GAME_ID` → `PARTY_ID` outright, no dual-read fallback.
- External contract broken atomically (backend + frontend are one repo).
- `GameIdDto` → `PartyIdDto`, moved to `common/dto/party/`, and adopted on the lobby
  endpoints too so the 9-char regex stops being declared three times.

## Consequences
- The 6 translation lines disappear; a reader no longer has to learn the invisible rule
  that `getGameId()` sometimes means the lobby.
- One documented boundary replaces a pervasive muddle. `gameId` inside `domain/` is now
  *correct*, not a leak.
- Keeping the domain untouched means `GameSnapshot.gameId` is unchanged, so **no Redis
  migration and no keyspace flush** — in-flight games survive the deploy.
- Renaming the JWT claim invalidates every live token (5h TTL): anyone mid-session at
  deploy time must rejoin. Sessions themselves survive; only tokens stop validating.
- Guardrail: nothing under `domain/` may mention party, lobby, websocket or api.

## Rejected alternatives
- **Dual-read JWT fallback** (accept `PARTY_ID`, fall back to `GAME_ID` for one release).
  Rejected: not worth carrying legacy branch code for a hobby-scale deploy window.
- **Internal-only rename**, leaving the wire untouched. Rejected: the frontend api-models
  are OpenAPI-generated, so the contract was cheap to change; leaving `lobbyId` on the wire
  would preserve the confusion where newcomers meet it first.
- **A full `Party` aggregate** owning the lifecycle, or one outliving the game for
  rematches. Rejected as out of scope — it needs stable member ids (player ids are
  currently re-minted per registration) and a durable party store. The
  `GET /parties/{partyId}/state` stub belonging to that idea was deleted.

## Related
- [[party-id-lifecycle]] — how the id behaves across the lobby→game seam
- [[websocket-session-managers]] — where the translation lines lived
- [[frontend-reaction-routing]] — the `senderId === lobbyId` host sentinel this must not break
- [[project-beeracademy]] — overall architecture
