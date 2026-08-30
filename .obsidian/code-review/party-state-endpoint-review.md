# Code review — party-state endpoint & join-page rewrite

**Branch:** `party-id-introduction` · **Reviewed:** 2026-08-28 · **Re-checked:** 2026-08-28 (x2)
**Scope:** `git diff main...HEAD` (party-state endpoint, `LobbyApi` param refactor, `PlayerGrid`/chug CSS)
plus uncommitted working tree (`PartyDto`/`PartyParticipantDto`, `PartyService` expansion, join-page
rewrite, route resolver, new `game-api`/`party-api` services).

Backend `compileJava` and frontend `ng build` both pass — every item below is semantic, not a build break.

Verdicts are the author's own, recorded at review time.

## Status at re-check

| # | Item | Status |
|---|------|--------|
| 3 | Lobby participants in `HashMap` order | ✅ fixed |
| 4 | `session` means two things across branches | ⬜ open |
| 5 | Loading feedback dropped | ✅ fixed |
| 6 | Resolver collapses all errors, loses log | ✅ fixed (interceptor) |
| 7 | Selection not guarded against tabbing | ⬜ open |
| 8 | `PartyDto` unused imports | ✅ fixed |
| — | `claimGame` mints token for random party | ✅ fixed |
| — | Dead code added by the change | ✅ fixed |

---

## ✅ 3 — `PartyService` returns lobby participants in `HashMap` order · **FIXED**

`services/party/PartyService.java:50`

`Lobby.getParticipants()` streams `participants.values()` off a `HashMap`, so ordering was arbitrary and
could change between calls. `LobbyDTO.fromLobby` sorts by `LobbyParticipant::getPosition`, and
`LobbyService.createGame` sorts by position before building `Player`s — the new endpoint did neither.

**Fix applied:** `.sorted(Comparator.comparingInt(LobbyParticipant::getPosition))` added to the LOBBY
branch, matching `LobbyDTO`.

---


**Regression test added 2026-08-29:** `PartyServiceTest.lobbyParticipantsAreOrderedByPosition` adds
participants to a real `Lobby` at positions 2, 0, 1 and asserts the DTO list comes back 0, 1, 2 —
so a dropped `.sorted(...)` now fails the build rather than silently reordering the join page.

## ⬜ 4 — `session` means two different things across the endpoint's two branches · **OPEN**

`services/party/PartyService.java:50`

- GAME branch: `isClaimed` == "player slot has been claimed" (`GameSessionService.claimPlayer`
  registers the session).
- LOBBY branch: participants only get a `Session` when they open a websocket —
  `LobbyParticipantSessionManager:45` is still the *only* registration site. `LobbyApi.registerParticipant`
  mints a JWT but registers nothing.

**Effect:** a registered-but-not-yet-connected lobby participant reports `isClaimed: false`. Any client
rendering `ExistingParticipant` for a LOBBY party (nothing prevents it — the DTO is identical) would
offer that row as free to take.

Re-check: the four `registerSession` call sites are unchanged.

---

## ✅ 5 — Loading feedback dropped when the lookup moved into a resolver · **FIXED**

`frontend/src/app/routes/resolvers.ts`

`OverlayService` was injected but the `BeerLoaderOverlay` open was commented out, and the old
`JoinPage.onNewPathParam` / `onLoadingComplete` overlay handling had been deleted — leaving up to 8 s of
blank screen on a cold entry (shared link / QR), the case [[route-resolvers]] specifically warned about.

**Fix applied:** `BeerLoaderOverlay` restored, opened behind a `TIME_BEFORE_SHOWING_LOADER` (150 ms)
`setTimeout` so fast responses never flash a loader, with rotating `beerLoaderMessages`. Teardown is a
`finalize` that clears the timer and dismisses the handle if it opened. `finalize` sits upstream of
`timeout` in the pipe, so the timeout path tears the overlay down too.

---

## ✅ 6 — Resolver collapses all errors into one message and loses the log · **FIXED**

`frontend/src/app/interceptors/http-response.interceptor.ts`, `app.config.ts`,
`backend/.../mappers/BaseExceptionMapper.java`, `ExceptionResponse.java`

**Author's position:** for an end user this is a non-issue — they only need to know something didn't
work. The half that mattered was the lost diagnostic. **Agreed.**

**Fix applied — better than the original suggestion.** Rather than restoring a per-resolver
`console.warn`, a functional `loggingInterceptor` was added and wired via
`provideHttpClient(withInterceptors([loggingInterceptor]))`. It `tap`s the error channel and logs URL,
status and body for *every* HTTP call, not just this resolver — the cross-cutting version of the fix.

Paired with it, `ExceptionResponse` gained a `corrId` field that `BaseExceptionMapper` fills from
`MDC.get("X-Correlation-ID")`. `RestClientLogger` (a `ContainerRequestFilter`) already put that id in
MDC — taken from the inbound header or generated — and it is already in the console log format
(`<%X{X-Correlation-ID}>`). So a browser-side error and the server log line for the same request now
carry a shared id. That is the part that makes the interceptor genuinely useful rather than just noisy.

`provideHttpClient` was absent before this change; the app worked because Angular 21 root-provides
`HttpClient` (`providedIn: 'root'`). Adding it is *required* to attach an interceptor chain, and it
introduces no transport change: the zero-config root `HttpBackend` is `useExisting: HttpXhrBackend`,
and `provideHttpClient()` without `withFetch()` resolves to `HttpXhrBackend` as well.

**Residual gaps** (small, not blocking):

1. `corrId` only reaches the client for `BaseException` subclasses. Bean-validation 400s
   (`@Pattern` on `PartyIdDto`, `@NotEmpty` on `participantName` → `ResteasyReactiveViolationException`),
   unmatched-route 404s, and unmapped 500s never touch `BaseExceptionMapper`, so they arrive with no
   correlation id — exactly the "unknown failure" cases where one helps most. One line in
   `RestClientLogger`'s response filter —
   `responseContext.getHeaders().add(CORRELATION_ID_HEADER, MDC.get(CORRELATION_ID_HEADER))` — covers
   every response, and the interceptor can then read `error.headers.get('X-Correlation-ID')`.
2. The interceptor logs `error.error` wholesale, so `corrId` is only visible if you expand the object.
   Hoisting it (`error.error?.corrId`) makes it greppable in a pasted console dump.
3. One *user-facing* distinction still worth keeping: on `/join/:party-id` a nonexistent or stale
   party and a dead server both toast "Kunne ikke forbinde". For a shared join link — the common
   case — "couldn't connect" points the user at retrying rather than checking the link. A single
   `error.status === 404` branch in the resolver's `bail` would fix that, and it is a UX distinction,
   not the developer-diagnostics one that was rightly rejected.

---

## ⬜ 7 — Participant selection not guarded against tabbing · **OPEN**

`frontend/src/app/pages/join-page/join-page.ts:90`, `join-page.html:38`

Original claim was that the guard is CSS-only (`pointer-events: none` on `:host`). Author's correction:
**the server blocks the claim regardless**, so this is not a security hole. The real gap is the
`(keydown)` binding — it fires on *any* key including Tab, and keyboard selection was never blocked.

Re-check: `(keydown)="onParticipantSelected(participant)"` is unchanged, and `onParticipantSelected`
still has no eligibility check.

**Fix direction:** block keyboard activation for non-selectable rows, and narrow the handler to
Enter/Space rather than any keydown.

---

## ✅ 8 — `PartyDto` unused imports · **FIXED**

`api/party/models/PartyDto.java`

Removed unused `services.lobby.models.Lobby` and `services.session.repository.Session` imports.

> Note: the same finding also flagged a **layer inversion** — `PartyService` imports
> `api.party.models.PartyDto`/`PartyParticipantDto`, i.e. a service depending *outward* on the API layer.
> Convention (and [[rules]] §1 "dependencies point inward") puts cross-layer DTOs under `common/dto/`;
> compare `GameSessionService` → `common.dto.game.GameDto`. **Still open** — needs a decision.
> Also: `getPartyState` now returns a full `PartyDto`, not a `PartyState`; the name no longer matches.

---

## Raised and dismissed

### Player cannot rejoin an in-progress game from `/join` — **BY DESIGN**

`existing-participant.ts:13` keys selectability on `!participant().session.isClaimed`. A session survives
the lobby→game transition: `LobbyParticipantSessionManager.onConnectionClosed:75-80` calls
`clearConnectionId(playerId)` — not `removeSession` — on the `TRANSITIONING` close code, which
`LobbyClientSessionManager:150` sends to every participant when the game starts. So every player who came
through the lobby has a live `Session`, `isClaimed` is `true`, `.selectable` never applies, and no row is
clickable.

**Author:** as long as the JWT is still in the browser the user just goes to `/games` and rejoins — the
join page is not the rejoin path. **Granted:** the UI could communicate this better (the template already
renders a red `wifi_off` for `isClaimed && !isConnected`, i.e. rows that look actionable but aren't).

### `GameSessionService.claimPlayer` rejects re-claim — **BY DESIGN**

`services/game/GameSessionService.java:73` throws `ResourceClaimException` whenever
`sessionRegistry.getSession(playerId).isPresent()`.

**Author:** a player is claimed exactly once; after that they don't go through `/join` again.

### ✅ `GameApi.claimGame` mints a token for a random party — **FIXED**

`api/game/GameApi.java`

`authenticationService.createGameClientToken(partyId)` bound to the single-arg overload
`createGameClientToken(String gameName)`, which calls `IdGenerator.generatePartyId()` and put that
**fresh random id** in the `PARTY_ID` claim, while the real `partyId` landed in the JWT `subject` as a
game name. Carried in from merged commit `0a92f9d`, so it was already on `main`.

**Fix applied:** the real game name is now read via `gameService.getGame(partyId).getName()` and passed to
the two-arg `createGameClientToken(gameName, partyId)`. A `GameNotFoundException` guard was added ahead of
the lookup, so a claim on a nonexistent party now 404s instead of minting a token.

### ✅ Dead code added by the change — **FIXED**

- ✅ `join-page.ts` — unused `take` and `GameService` imports removed.
- ✅ `frontend/src/app/routes/models/party-info.ts` — deleted (the whole `routes/models/` directory
  is gone); the resolver returns `PartyDto` directly.
- ⬜ Two crumbs left, both cosmetic: `src/api-models/model/partyStateDto.ts` is still present (stale
  generated model — the backend `PartyStateDto` record was deleted; it is unreferenced and will
  vanish on the next client regeneration), and `party-api.service.ts` still has
  `console.debug("Getting party:", partyId)` plus a no-op `map(partyStateDto => partyStateDto)` with
  its now-redundant `map` import.

---

## Related
- [[route-resolvers]] — resolver rules; the loading-gap cost this review hit
- [[rules]] — §1 dependencies point inward, §2 one identity `partyId`, §3 declare validation once
- [[known-issues]]
- [[party-id-lifecycle]] — how the id behaves across the lobby→game seam
- [[websocket-session-managers]] — session lifecycle on `TRANSITIONING`
- [[project-beeracademy]]
