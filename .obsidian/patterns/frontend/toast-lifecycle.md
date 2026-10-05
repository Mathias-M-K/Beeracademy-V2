---
type: pattern
layer: frontend
status: active
updated: 2026-10-05
tags: [pattern, frontend, angular, overlay, ux, accessibility]
---

# Toasts — one at a time, replace, auto-dismiss, click-dismiss

The current toast system. It shows **one toast at a time**: a new toast instantly pushes the current
one out. The service owns the current toast, the overlay and the timer, and a toast is a button that
goes away when you press it. It replaces the deck-and-overview system in [[toast-stack-and-overview]],
which was removed. The trigger was [[known-issues]] #30: toasts covered the buttons pinned to the
bottom of the screen on phones, and pressing a toast did not make it go away.

Built on branch `improvement/better-toast` (2026-10-05). Files:
`services/toast/toast.service.ts`, `overlay/toast/models/toast-data.ts`, `overlay/toast/toast/`,
`overlay/toast/toast-container/`.

**Status:** `ng build` passes and the full unit suite is green. **Not yet verified in a browser**, and
not on a phone.

## The service owns one toast and the overlay

`ToastService` keeps the current toast in a private `_toast` signal (`ToastData | null`) and exposes
it read-only as `toast`. There is no list. It also holds the one `OverlayHandle` for the
`ToastContainer`:

- `showToast` builds a `ToastData`, **replaces** the current toast with it, and restarts the
  dismiss timer. If no handle exists, it opens the container overlay (bottom-centred, no backdrop,
  `toast-panel--compact` on handsets).
- `dismissToast(id)` only acts if `id` is still the toast being shown. It clears the timer, sets the
  toast to `null` and closes the overlay.

**Why the id check:** a replaced toast is still on screen while it plays its leave animation, and is
still a clickable button. Without the check, clicking the outgoing toast would dismiss its
successor.

## Auto-dismiss is a `setTimeout` in the service

`showToast` does `clearTimeout(dismissTimer)` and then
`dismissTimer = setTimeout(() => dismissToast(id), toast.durationMs)`. `durationMs` comes from
`ToastData`, with a default per state that the constructor can override:

| State | Default |
|---|---|
| `message` | 4500 ms |
| `success` | 4000 ms |
| `error` | 6500 ms |

A replacement therefore gets its own full duration. The old toast's timer can't cut it short, both
because it is cleared and because `dismissToast` checks the id.

**Why the timer is in the service and not the component:** the service already owns the data and
the overlay handle, so the timer and the removal live in the same place. The component stays
presentational.

**Why a plain `setTimeout` is fine:** the app is zoneless, but the callback updates a signal, and a
signal write schedules change detection by itself. Nothing needs `ApplicationRef.tick()` here.

## Replacing a toast: a keyed `@for` over at most one item

`ToastContainer` exposes `shownToast = computed<ToastData[]>(() => toast ? [toast] : [])` and renders
`@for (toast of shownToast(); track toast.id)` with `animate.enter="toast-in"` and
`animate.leave="toast-out"` on `<app-toast>`.

**Why not `@if`:** `@if` only re-creates its view when the condition flips between truthy and falsy.
Swapping one toast object for another keeps the same view and just rebinds it, so neither animation
plays. Tracking by `toast.id` makes a new id a new view: the old one plays `toast-out` while the new
one plays `toast-in`. During the swap both are absolutely positioned at the same spot, so the old
toast slides up and fades over the new one sliding in.

The container passes `title`, `state` and the message (projected content) to `Toast`.

## Closing the overlay waits for its exit

`closeToastOverlay` keeps the handle and sets `isClosing` while `OverlayHandle.close()` runs its exit
animation. The global `.overlay-leaving` rule in `drawer-styling.scss` gives the toast container
the same 0.2 s fly-out as the drawers. When `closed` resolves, the service clears `isClosing`, nulls
the handle and reopens the overlay if a toast arrived in the meantime. A `showToast` during the
exit sees the handle still set and does not open a second container. This is the #22 fix brought
back after the rewrite dropped it ([[known-issues]] #34).

## Click-dismiss is a native button

`Toast` wraps its content in `<button type="button" class="toast">` and emits a `dismissed` output.
`ToastContainer` maps that to `toastService.dismissToast(toast.id)`.

**Why a `<button>` and not `(click)` on the host:** a button gives focus, Enter and Space for free.
A click handler on a non-interactive host has no keyboard path, which AXE flags. The pill styling
moved from `:host` onto `.toast`. `all: unset` strips the global `button` rule, and a
`:focus-visible` outline (`2px solid var(--primary)`) restores a visible focus ring.

## Centring

Each `app-toast` is absolutely positioned in the container with `left: 50%` and
`transform: translateX(-50%)`. Percentages in `translate` are relative to the **element's own** size,
not the parent's. So a positive `50%` on its own only moves the toast by half its own width and does
not centre it. `left: 50%` moves the toast's left edge to the parent's middle, and `-50%` pulls it
back by half its own width.

## Click-through was tried and rolled back

Making the empty parts of the overlay pass clicks to the page underneath was implemented on
2026-10-05 and rolled back at the user's request. It used a CDK `panelClass` with
`pointer-events: none` on the pane and `pointer-events: auto` on `app-toast`. The container box
(90vw × 75px plus its bottom margin) therefore still blocks clicks under it while a toast shows.

## Tests

- `toast.service.spec.ts`:
  - showing and replacing a toast
  - the container is reused on replace
  - auto-dismiss with fake timers, including the countdown restarting on replace
  - a stale id is ignored
  - "never has more than one toast container open". This test counts panes **before** flushing
    microtasks, which is the moment two would exist. It was checked against the old close
    behaviour, and it fails there.
- `toast-container.spec.ts`:
  - renders nothing without a toast
  - renders the current toast
  - renders the replacement
  - a click dismisses by id
- `src/testing/stubs.ts` › `createToastServiceStub` exposes `toast` and `dismissToast`.

## Open follow-ups (not done)

- **No live region.** Toasts are not in an `aria-live` / `role="status"` region, so screen readers
  do not announce them. Tracked as [[known-issues]] #33.
- **No pause-on-hover.** That would need the timer to move into the `Toast` component, which is the
  only place that knows about hover. It would undo the "service owns the timer" choice above.
- **The final dismiss is unverified.** When the last toast goes, the container's 0.2 s fly-out and
  the toast's own `toast-out` run at the same time, and then the overlay is disposed. Whether that
  looks right needs a browser.

## Related
- [[toast-stack-and-overview]] — the deck-and-overview system this replaced
- [[known-issues]] — #30 (the trigger), #22 / #34 (overlay stacking), #33 (live region)
- [[overlay-exit-animations]] — the `OverlayHandle.close()` contract the container rides on
- [[animate-leave-for-overlay-roots]] — why `animate.leave` works on a toast but not on an overlay root
- [[frontend-unit-testing]] — the zoneless idioms behind "a signal write schedules CD"
- [[rules]] — §5 AAA comments, followed in both rewritten specs
