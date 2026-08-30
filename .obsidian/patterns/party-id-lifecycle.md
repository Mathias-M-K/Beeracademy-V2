# Pattern: The Party ID Lifecycle

One 9-character id (`[A-Z0-9]{9}`, `SecureRandom`) identifies a group of players across
**both** phases of a session. Named `partyId` everywhere above the domain. See
[[party-id-unification]] for why.

## Minted once, never regenerated
`LobbyService.createLobby()` generates it and registers a `Session` under it. When the game
starts, `LobbyService.createGame(partyId)` passes the **same** id to
`GameService.createGame(...)`. There is no second id.

## The lobby→game seam
Lobby and Game are two classes, two stores, two state models — with **no pointer between
them**. The only link is the id. The handoff is:

1. `StartGameAction` → `lobbyService.createGame(partyId)`
2. websocket closed with `WebsocketCodes.TRANSITIONING` (4030)
3. close handler calls `sessionRegistry.clearConnectionId(partyId)` — **not**
   `removeSession` — so the session survives with its connection slot freed
4. `deleteLobby(partyId, preserveSession=true)` drops the Lobby object
5. clients reconnect to `/ws/game` with the **same cookie** and are accepted

Player identity carries over the same way: `Player.fromParticipant` reuses
`participant.getId()`, so a participant's existing JWT still works in the game.

```
Lobby(open) → Lobby(transitioning) → [Lobby deleted, Game created] →
    AWAITING_START → IN_PROGRESS ⇄ AWAITING_CHUG → FINISHED
```

Nothing owns that whole arc — the seam is a close code plus a shared id plus a preserved
session. There is no state field representing it.

## The domain boundary (important)
`domain/` knows only about the Game. It knows nothing of lobbies, parties, websockets or
APIs, and therefore keeps `gameId`:

```
API / session / services   →  partyId
        │  one explicit hand-off in GameService.createGame
        ▼
domain/                    →  gameId
```

Guardrail — both of these must stay empty:
```
grep -rniE "party|lobby|websocket" src/main/java/dk/mathiaskofod/domain
grep -rn "import dk.mathiaskofod.services" src/main/java/dk/mathiaskofod/domain
```
Clean as of 2026-08-25: `Player.fromParticipant` became `LobbyParticipant.toPlayer()` and
`Player.create` was deleted, so `Player` has no outward imports. See
[[known-issues]] for the narrower framework dependencies that remain (CDI in
`GameEventEmitterImpl`, `BaseException` in the domain exceptions).

## Three registries, one id
| Store | Key |
|---|---|
| Redis sessions | `SESSION:<partyId>` — **and** `SESSION:<playerId>`, one flat namespace |
| Redis game snapshots | bare `<partyId>`, no prefix |
| In-memory `LobbyRepository` | `<partyId>` |

The flat session namespace is deliberate: `TokenInfo.getClientId()` returns "whichever id
identifies me" (party id for a game client, player id for a player client) and every
session lookup then just works. **`Session.sessionId` must stay generically named.**

## Gotcha: the host sentinel
The party id doubles as a pseudo-participant id for the host. `LobbyClientSessionManager`
sends `EmojiSentEvent(partyId, emoji)` / `MessageSentEvent(partyId, msg)`, and the frontend
detects a host reaction with `senderId === lobbyId()`. See [[frontend-reaction-routing]].
Any change here must keep that comparison working.

## Wire format
Stored and compared as 9 chars with no dashes. The frontend *displays* `ABC-DEF-GHI` via a
pipe and an `AAA-AAA-AAA` input mask; `PartyIdDto`'s canonical constructor strips the
dashes on the way in. Do not change the format without touching all four frontend places.

Frontend join links are `#/join/:party-id` (`app.routes.ts`). The old `:lobby-id` key was
not preserved — the app is not in production, so there were no shared QR codes at risk.

## Related
- [[party-id-unification]] — the naming decision
- [[websocket-session-managers]] — the managers that consume it
- [[redis-state-store]] — where it is stored
