# Rules

Conventions this codebase is held to. Each rule states the *why* and, where possible, a
**check** you can actually run — a rule with no check tends to rot.

Violations that exist today are tracked in [[known-issues]] rather than silently tolerated.

---

## 1. The domain is isolated

`domain/` models the **Game** and nothing else. It must not know about lobbies, parties,
sessions, websockets, HTTP, Redis, or any service.

**Why:** the game rules are the part worth protecting. Once infrastructure leaks in, the
rules can no longer be reasoned about or tested on their own, and every future change to
transport or storage drags the rules along with it.

**Check** — both must return nothing:
```bash
grep -rn "import dk.mathiaskofod.services" src/main/java/dk/mathiaskofod/domain
grep -rniE "party|lobby|websocket" src/main/java/dk/mathiaskofod/domain --include=*.java
```

**Corollary — dependencies point inward.** Services may depend on the domain; the domain
never depends on a service. When a service type must become a domain type, the **service
type owns the mapping**:

```java
// services/lobby/models/LobbyParticipant.java — correct direction
public Player toPlayer() { return new Player(getName(), getId(), ...); }
```

Not `Player.fromParticipant(LobbyParticipant)`, which would drag `services.lobby` into
`domain/`. This is exactly the mistake that was made and later undone — see [[known-issues]] #6.

**Corollary — no infrastructure factories in domain types.** `Player.create()` was deleted
because it called `IdGenerator` (a service) purely as a convenience for tests. Id generation
is a service concern; the domain takes ids as given. Construct domain records with their
canonical constructor.

**Known exceptions** (recorded, not endorsed — see [[known-issues]] #6):
- `GameEventEmitterImpl` imports CDI annotations.
- Domain exceptions extend `providers.exceptions.BaseException`, which carries an HTTP status.

## 2. One identity, one name — `partyId`

A single 9-character id identifies a group of players across **both** the lobby and the game
phase. Above the domain it is always `partyId`. Inside the domain it is `gameId`, because
there it genuinely identifies a Game and the domain does not know the word "party".

```
API / session / services   →  partyId
        │  one explicit hand-off: GameService.createGame(name, partyId, players)
        ▼
domain/                    →  gameId
```

**Why:** the id used to be called `lobbyId` in one half of the codebase and `gameId` in the
other, for the same value — forcing six pointless translation lines and leaking "Invalid
game ID format" onto lobby endpoints. One name above the boundary, one documented hand-off
at it. Full rationale in [[party-id-unification]]; mechanics in [[party-id-lifecycle]].

**Check:** `grep -rn "lobbyId" src/` returns nothing. `gameId` appears only under `domain/`
and at the few call sites consuming a domain accessor.

**Do not rename around the boundary.** `Session.sessionId` stays generic — it holds a party
id *or* a player id, and the flat `SESSION:*` namespace is what makes
`TokenInfo.getClientId()` work for both client roles.

**Phase names are not id names.** `/lobbies` and `/games`, `LOBBY_NOT_FOUND` vs
`GAME_NOT_FOUND`, `LOBBY_START_GAME` — these describe *which phase*, stay accurate, and
must not be swept into an id rename.

## 3. Declare validation once

Id validation lives in `PartyIdDto` (`PATTERN` / `MESSAGE` constants) and is reused by
every endpoint that accepts a party id, including the lobby ones.

**Why:** the regex was previously written out three times, and the copies drifted — two of
them carried the message "Invalid game ID format" on a *lobby* path param.

`@RestPath` binds by **record component name**, so renaming the component renames the URI
template. The DTO also normalises input (strips `-`), because the frontend displays ids as
`ABC-DEF-GHI`.

## 4. Websocket actions and events are annotation-declared

Wire types are declared with `@Category`, `@ActionType`, `@EventType` — the string in the
annotation *is* the contract:

```java
@Category("LOBBY_CLIENT_ACTION")
public record LobbyClientActionEnvelope(LobbyClientAction payload) implements WebsocketEnvelope<LobbyClientAction> {}
```

To add an action: create the action record under `services/session/actions/…`, annotate it,
and add a `case` to the relevant session manager's `onMessage()` switch. Changing an
existing annotation string is a **breaking wire change**.

## 5. Tests use explicit AAA comments

Every test method carries `// Arrange`, `// Act`, `// Assert` on their own lines, with a
blank line between sections. Use `// Act & Assert` where the two collapse (typically
`assertThrows`).

**Why:** consistency across the suite makes tests scannable. Mirror `GameServiceTest` /
`GameClientSessionManagerTest`.

**Prefer deterministic fixtures.** Build domain objects with literal ids
(`new Player("Player 1", "p1", 10, true, new Stats())`) rather than generating random ones —
a test that stubs `getPlayer(PARTY_ID, PLAYER_ID)` should return a player whose id actually
*is* `PLAYER_ID`.

## 6. State lives in Redis (mostly)

Sessions and game snapshots are Redis-backed; only `LobbyRepository` is still an in-memory
`HashMap`. See [[redis-state-store]] — and note it supersedes the older "no database" ADR,
which is still cited in a stale `CLAUDE.md`.

**Consequence:** lobbies are single-instance and vanish on restart, while games and sessions
do not. Do not assume symmetry between them.

**Renaming a persisted field is a migration.** `GameSnapshot` is stored as JSON; changing a
component name breaks in-flight games on deploy. This is a large part of why rule 2 stops
at the domain boundary.

## 7. Auth is a cookie-borne JWT

Tokens are issued as the `session_jwt` cookie (HttpOnly + Secure outside DEV), 5-hour
expiry, carrying the `PARTY_ID` and `PLAYER_ID` claims. See [[jwt-in-cookies]].

**Renaming a claim invalidates every live token** and forces everyone mid-session to rejoin.
That is a deploy-timing decision, not an incidental refactor.

---

## Related
- [[known-issues]] — where current violations are tracked
- [[party-id-unification]] — ADR behind rules 1–3
- [[party-id-lifecycle]] — how the id behaves across the phase seam
- [[redis-state-store]] — rule 6
- [[jwt-in-cookies]] — rule 7
- [[websocket-session-managers]] — rule 4
- [[project-beeracademy]] — overall architecture
