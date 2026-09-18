---
type: registry
updated: 2026-09-16
tags:
  - issues
  - open
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


## 14. `GameApi` reaches into a websocket session manager
`api/game/GameApi.java` injects `GameClientSessionManager` and calls
`requestParticipantRelease(partyId, participantId)` straight from the
`GET /games/{partyId}/players/{participantId}/request-release` endpoint. Every other endpoint
on that resource goes through `GameService` / `GameSessionService`; this one skips the service
layer and lets an HTTP request drive a websocket broadcast directly.

Consequence: the release-request rules (party membership, party leader connected, player not
connected) live in a session manager, so nothing else can reuse them and they are only
reachable through a manager whose other entry point is `onMessage()`.

**Fix direction:** a service that owns the request-release policy, with the session manager
reduced to the broadcast. Same shape as issue 12 — a layer rule in [[architecture-tests]]
(API must not import `services.session.*SessionManager`) would catch the recurrence.

Introduced by the session-ownership-transfer branch, 2026-09-07.

## 15. SSE connection events are in-memory and single-instance
`services/event/publisher/SseEventPublisher.java` holds a Mutiny `BroadcastProcessor` as an
instance field of an `@ApplicationScoped` bean. Subscribers come from
`GET /events/player-connection-events/{partyId}` ([[project-beeracademy]] SSE stream); publishers
are `PlayerClientSessionManager` (CONNECTED / DISCONNECTED) and `GameClientSessionManager`
(RELEASED).

**Consequence:** the stream is asymmetric with the rest of the state story ([[rules]] §6,
[[redis-state-store]]). Sessions and game snapshots survive a restart and could be shared across
replicas; these events cannot. A subscriber on instance B never sees an event published on
instance A, and a restart drops every open stream with no replay — `BroadcastProcessor` has no
buffer for late subscribers either, so an event published between the release action and the
client's `EventSource` connecting is simply lost.

Fine while the backend is single-instance (as lobbies already force — issue 8), but it is a second
thing blocking horizontal scaling, and unlike lobbies it silently degrades rather than failing.

**Fix direction:** Redis pub/sub behind the same `playerConnectionEventStream` signature.

Introduced by the session-ownership-transfer branch, 2026-09-07.

## Frontend bugs pinned by unit tests (16–25)

Found while building the frontend unit-test suite ([[frontend-unit-testing]], branch
`frontend-tests`, 2026-09-16). Each one has an `it.fails` test that asserts the **correct**
behaviour, carrying a `// known-issues:` comment. When a fix lands, that test starts passing
and Vitest reports it as a failure. Delete `.fails` in the same change, then mark the entry ✅.
Line numbers are as of `c14283c`.

## 16. `GameService.isPlayer` is always false
`frontend/src/app/services/game/game.service.ts:115` —
`computed(() => !this.isGameClient)` negates the signal function, which is always truthy,
instead of its value. `*isPlayer` (used in `game-paused-drawer.component.html`) therefore
never renders. Fix: `!this.isGameClient()`.
Test: `game.service.spec.ts` › "recognises a player client as a player".

## 17. A failed game reconnect never retries; the attempt limit is unreachable
`game.service.ts:131-176`.
- During a reconnect, `.catch` runs before `.finally`, so `isReconnecting` is still `true`.
- A transient close code routes back into `reconnectToWebsocket()`, which returns
  immediately, so there is no second attempt.
- A timeout (cause 0) falls through to the default branch and sends the user to the start page
  after one try.
- The `reconnectCountLimit = 3` toast ("Kunne ikke forbinde") is therefore never shown.

Tests: "retries a reconnect that fails with a transient close code", "gives up with a toast
after three failed reconnects".

## 18. Server-driven overlay closes are reported back as user actions
`game.service.ts:395, 415, 610-638, 657-664`. The `closed.then` handlers can't tell a user
closing an overlay apart from the service closing it programmatically. A game client
therefore:
- sends `REGISTER_CHUG` with 0 ms when a `CHUG` event arrives while its chug overlay is open;
- sends `RESUME_GAME` back when `GAME_RESUMED` arrives while its pause panel is open;
- sends `REGISTER_CHUG(0)` / `RESUME_GAME` when `GAME_END` dismisses open overlays.

The comment in `dismissAllOverlays`, "A dismissal never resolves `closed`", is wrong:
`OverlayHandle.dismiss()` resolves `closed` with `undefined`
(`overlay/models/overlay-handle.ts:36-38`).
Tests: "does not register a chug of its own when the server reports one", "does not echo a
resume when the server reports the game resumed", "sends nothing when the game ends while a
game client has the chug overlay open".

## 19. `LobbyService.lobbyReset` never emits
`frontend/src/app/services/lobby/lobby.service.ts:84`. The `_lobbyReset` Subject is never
`next`ed, so `ChatService`'s reset subscription is dead. Chat history in the root-provided
service survives leaving one lobby and joining another.
Test: `lobby.service.spec.ts` › "signals a lobby reset when leaving and joining a lobby".

## 20. `ChatService.sendMessage` shows trimmed text but sends untrimmed
`frontend/src/app/services/chat/chat.service.ts:47`. The local echo uses `trimmed`, but the
server receives the raw `text`, so sender and receivers see different messages.
Test: `chat.service.spec.ts` › "sends the same trimmed text it shows locally".

## 21. `lobbyStateResolver` has no LobbyNotFound case
`frontend/src/app/resolvers/lobby-state.resolver.ts:13-22`. The backend closes with 4002
(`LobbyWebsocket.java:69`), but the resolver only handles 4001 and 4000. A deleted lobby
redirects to `/start` silently, whereas the game resolver shows a toast for GameNotFound.
Test: `lobby-state.resolver.spec.ts` › "tells the user when the lobby no longer exists".

## 22. Toast overlays can stack — ✅ RESOLVED 2026-09-18
~~`frontend/src/app/services/toast/toast.service.ts:37-39, 53`. The race:~~
- ~~`removeToast` sets `overlayActive=false` immediately, but closing is async.~~
- ~~A `showToast` in that window opens a second container.~~
- ~~The first overlay's `closed.then` then flips `overlayActive` false while the second is open,~~
  ~~so the next toast opens a third.~~

Fixed. The `overlayActive` signal is gone. `ToastService` now keeps the handle itself plus an
`isClosing` flag, and a single `syncOverlay()` reconciles "is there a container?" with "is the
list empty?" after every mutation. While `isClosing` is set, `syncOverlay()` is a no-op; the
handle's `closed` promise clears the flag and calls `syncOverlay()` once more, so a toast that
arrived mid-exit opens exactly one fresh container. See [[toast-stack-and-overview]].

Test: `toast.service.spec.ts` › "never has more than one toast container open" (no longer `it.fails`).

## 23. `JoinPage` leaks its SSE connection
`frontend/src/app/pages/join-page/join-page.ts:55-60`. The
`getPlayerConnectionEventStream` subscription in the constructor has no
`takeUntilDestroyed`, so the `EventSource` stays open after navigating away.
Test: `join-page.spec.ts` › "stops listening for connection events when the page is destroyed".

## 24. Pressing Enter on a chat emoji does nothing
`frontend/src/app/pages/lobby-page/chat/chat.html:11-20`. `(keydown.enter)` calls the
`sendEmojiAction(...)` action factory instead of `sendEmoji(...)`. Click works; keyboard users
cannot send reactions, which falls short of the frontend's WCAG AA baseline.
Test: `chat.spec.ts` › "sends the emoji when Enter is pressed on it".

## 25. Space draws a card for player clients
`frontend/src/app/pages/game-page/game-page.ts:20`. The `document:keyup.space` host listener
is not role-gated, although the Draw button is (`*isGameOwner`). A player pressing Space sends
`DRAW_CARD` as a `GAME_CLIENT_ACTION`, which `PlayerClientSessionManager.onMessage` rejects
with `UnknownCategoryException`.
Test: `game-page.spec.ts` › "does not draw when a player presses Space".

## 26. Frontend observations — not pinned (correct behaviour undecided)
Seen during the same work. None has an `it.fails`, because the right behaviour needs a
decision first.
- **AwaitingStart snapshot auto-sends `START_GAME` for every client** (`game.service.ts:335`).
  The backend sends the snapshot *before* the identity, so the service can't know the role at
  that point. From a player client the action is rejected server-side.
- **Resolvers treat cause 0 (handshake timeout / socket error) as "no cause"** and redirect
  without a toast. `websocket.service.ts:109` has a FIXME about hard-coding cause 0.
- **`WebsocketService` keeps the handshake timeout running** after a pre-handshake
  `EXCEPTION_RESPONSE`. It is harmless in practice (a retry's `disconnect()` closes the old
  socket, whose close handler clears it), but clearing it in that branch would be cleaner.
- **`ParticipantOverview.onDrop`** emits `participantsRearranged` even when an item is dropped
  back in place, and emits inside a signal `update` callback.
- **Leftovers:**
  - The "Add testers" debug button renders for everyone (`lobby-page.html:43`).
  - `ParticipantSettingsOverlay` is dead code.
  - `header.html` never emits `startClick`, so `GamePage.startGame()` is unreachable from
    the UI.
- **Cosmetic:**
  - The game resolver's 4000 toast says "Kunne ikke finde lobby".
  - The chat Confetti button shows 🎊 while `EMOJI_DISPLAY` sends 🎉.
  - `DrawerService.showConfirmationDrawer(participantId)` actually receives a name.

## Related
- [[frontend-unit-testing]] — issues 16–25 are pinned by `it.fails` tests

- [[rules]] — the conventions several of these violate
- [[security-issues]] — security defects, tracked separately
- [[party-id-unification]] — the change during which issues 1–9 were found
- [[party-state-endpoint-review]] — the archived review issues 10–13 were promoted from
- [[architecture-tests]] — machine-enforced checks; issues 6, 12 and 14 are what it must encode
- [[runtime-config]] — issue 9
- [[redis-state-store]] — issues 5, 7, 8, 15
- [[party-id-lifecycle]] — issue 6's boundary rule
- [[websocket-session-managers]] — issue 14
- [[README]] — vault index
## 27. First tap after a drag-dismiss is swallowed — ⬜ OPEN, unsolved 2026-09-18

Dismissing a toast **by dragging** makes the next tap do nothing — anywhere on the page, not just
on a toast. Roughly 600–1000ms, touch only, and a second tap works immediately. Dismissing the same
toast **by tapping** never shows it.

Reproduction: on `/start`, tap "Opret lobby" twice with an empty name to raise two toasts, drag one
away, then tap "Opret lobby" again. The first tap is lost.

**Established by on-device tracing** (`document.elementsFromPoint` plus raw event logging):

- The full touch arrives — `pointerdown`, `touchstart`, `pointerup`, `touchend` — and **no `click`
  is ever dispatched**. It is the browser withholding it, not a handler swallowing it.
- Nothing covers the tap target. The stack under the finger is clean (`button.btn-secondary`
  topmost, `pe:auto`), in both stacked and overview modes.
- The button is never detached: a `MutationObserver` over the page recorded no removals and the
  node stayed `isConnected` throughout.
- Change detection keeps running, the console is clean, and there is no layout overflow.
- No `scroll` events fire, and it reproduces in **stacked** mode where the pill is
  `touch-action: none` — so no browser pan or fling is involved.
- A drag that **springs back** is harmless. Only a drag that actually removes a toast does it.
- The one correlation found: the toast's removal from the DOM lands between `touchstart` and
  `pointerup` (`dom:2 leaving:1` → `dom:1 leaving:0`), and that tap produces no click.

**Ruled out as causes** (each tried, each failed to fix it): `preventDefault` on `pointermove`;
`setPointerCapture`; the container-scoped click-suppression guard; scroll chaining
(`overscroll-behavior: contain`); locking body scroll under the modal overview; making the exiting
toast's whole subtree `pointer-events: none`; resolving taps from `pointerup` instead of `click`;
and deferring the removal until every pointer lifts.

All of those were reverted on 2026-09-18 at the user's request rather than left in as speculative
band-aids. What remains in the toast code is only what is independently justified: the
`touch-action` declarations (which fixed a *different*, confirmed bug — drags janking back on a real
phone) and the touch-aware tap slop.

**Not reproducible in a desktop browser or a headless pane** — the browser only synthesises clicks
from real touch input, so this needs a device. See [[toast-stack-and-overview]] for the mechanics
the investigation covered.
