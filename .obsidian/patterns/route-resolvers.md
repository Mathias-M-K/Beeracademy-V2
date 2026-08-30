# Pattern: Route resolvers as navigation gates

## Rule

A `ResolveFn` **returns** its observable/promise. It must never `.subscribe()` internally and
return `void` — the return value is the router's only "ready" signal, so returning `undefined`
means "activate now", and with cold `HttpClient` observables the request never fires at all.

Check: `grep -n "subscribe" src/app/routes/resolvers.ts` should return nothing.

## Division of labour

- **Resolver** — the *initial* precondition. Fetch, branch, redirect. Returns a one-shot value.
- **Service** — the *lifetime*. Socket, subjects, signals, reconnects, teardown.

Never return a long-lived stream from a resolver: the router does `take(1)` and unsubscribes,
which would tear down a connection the service needs. Return a derived one-shot instead
(`firstValueFrom`, `take(1)`), keeping the live subscription in the service. A plain HTTP GET
has no such lifetime, so returning it directly is fine.

Don't mix lanes: `async` + returning an observable yields `Promise<Observable<T>>`, and Angular
unwraps only one level — the component would receive the Observable object as its data.

## Failure = cancel the navigation

Use `catchError(() => of(new RedirectCommand(router.parseUrl('/start'))))`. Showing a toast from
a `subscribe({error})` while still returning `void` activates the route anyway, leaving the page
with a toast and no data. `switchMap` branches must wrap redirects in `of(...)` — a bare
`RedirectCommand` is not an `ObservableInput` and throws at runtime.

`ResolveFn<T>` already permits `RedirectCommand` in its return type
(`@angular/router/types/_router_module-chunk.d.ts:2944`), so don't add it to `T`.

## Cost: the loading gap

While a resolver runs, Angular keeps the **previous** route on screen. On a cold entry
(pasted URL, QR code) there is no previous route — so a blank screen for the fetch duration.
Any loader must therefore live outside the routed component: an app-shell loader driven by
router events, or an `OverlayService` overlay. Moving a component-owned loader behind a
resolver silently deletes the loading state.

This matters most for `/join/:party-id`, which is *always* a cold entry from a shared link.

## Adoption status (2026-08-26)

- `/join/:party-id` — uses `partyStateResolver`. Chains party-state → lobby, so
  "party is a game" and "party doesn't exist" are distinguishable; previously both surfaced as
  `LobbyNotFoundException` → "lobby kunne ikke findes", which is wrong for a started game.
- `/game`, `/lobby` — still connect from `ngOnInit`. Candidates, not converted. Converting
  would let `GameService` drop its `Router` injection (it currently self-navigates on
  `GameNotFoundException`). Blocked on the app-shell loader above.
- `JoinPage` still runs its own `getLobby` fetch, so the lobby is fetched twice on entry.
  Not yet consuming `route.data`.

See [[party-id-lifecycle]].

## Update 2026-08-28

`JoinPage` now consumes `route.data` via `toSignal(this.route.data, {requireSync: true})` — the duplicate
`getLobby` fetch noted in the adoption status above is gone, and the resolver returns `PartyDto` from the
new `GET /parties/{partyId}`.

The loading-gap cost was **not** paid: the `BeerLoaderOverlay` open is commented out in `resolvers.ts`
(`OverlayService` still injected, unused), so `/join/:party-id` — the cold-entry case this note warned
about — now has no loading state at all for up to 8 s.

See [[party-state-endpoint-review]].

### Loader restored (2026-08-28)

`partyStateResolver` now opens `BeerLoaderOverlay` behind a 150 ms `setTimeout`, so a fast response
never flashes a loader, and tears it down in a `finalize` that also clears the timer. `finalize` sits
**upstream of `timeout`** in the pipe, so the timeout path unsubscribes through it and the overlay is
dismissed there too — worth keeping in that order.

```ts
return partyApi.getParty(partyId).pipe(
  finalize(() => { clearTimeout(loadingScreenTimer); if (overlayHandle) overlayHandle.dismiss(); }),
  timeout({each: PARTY_LOOKUP_TIMEOUT, with: () => bail(...)}),
  catchError(() => bail(...)),
);
```

This is the "loader outside the routed component" resolution the cost section above calls for.
