---
type: pattern
layer: frontend
status: active
updated: 2026-09-18
tags: [pattern, frontend, angular, overlay, animation, ux]
---

# Toasts — the deck and the overview

The toast system has two states and one rule: **stacked is the default, and every toast must be
reachable in an overview**. Everything below is how those two states are built and, more
importantly, how they move between each other — the transition is the feature, not decoration.

Built on branch `improved-toast-implementation` (2026-09-18). Files:
`overlay/toast/toast/`, `overlay/toast/toast-container/`, `services/toast/toast.service.ts`.

## The two states

| | Stacked (default) | Overview |
|---|---|---|
| Shape | 360px pill, bottom-centred | Full-width rows in a 440px panel |
| Content | coloured dot + message | tinted icon + **title** + muted message |
| Depth | `scale(1 − d × 0.045)`, `translateY(d × 9px)`, capped at `d = 2` | `translateY(d × 58px)` |
| Beyond `d ≥ 2` | `--depth-opacity: 0`, `tabindex="-1"`, `aria-hidden` | all visible |
| Countdown | running | **paused** |

`ToastData` carries `title`, `message`, `icon`, `toastState` and a per-state `durationMs`
(message 4.5s, success 4s, error 6.5s). The pill shows only the message; the overview row reveals
the title. Nothing new is fetched for the overview — the extra detail was always in the payload,
it just was not shown while stacked.

## Why the transition is pure CSS

Depth is a single custom property, `--depth`, written per toast by the container. Both layouts are
expressed as `scale` / `translate` on the same element, so switching `.toast-overview` on the host
*is* the animation — the browser interpolates between two declarative layouts. There is no FLIP
measuring pass and no JS animation driver.

The fan-out reads as a deck opening because of a **staggered delay**, and the stagger reverses with
direction, which falls out of the cascade for free:

```scss
.toast                      { --stagger: max(0ms, (var(--toast-count) - 1 - var(--depth)) * 24ms); }
:host(.toast-overview) .toast { --stagger: max(0ms, var(--depth) * 24ms); }
```

The delay that applies is the one in the **after-change** style, so expanding leads with the front
card and collapsing leads with the deepest. `--stagger` inherits into the toast, so its internal
reveals (glyph bloom, title unfold) ride the same cadence.

**Older is always lower**, in both states. Keeping that ordering consistent means the fan-out is a
pure spread with no cards crossing over each other.

## The countdown is a paused animation, not a timer

The ring around the dot is a `conic-gradient` driven by a registered property:

```scss
@property --toast-progress { syntax: '<percentage>'; inherits: false; initial-value: 100%; }
```

`animationend` on that element is what emits `timerEnd`. Freezing is therefore
`animation-play-state: paused` — applied while the overview is open (`[isPaused]`), while dragging,
while leaving, and on hover. **Pausing preserves `currentTime`, so the arc resumes where it stopped
rather than restarting.** Verified in the browser: 62.7% running → 62.5% frozen across 1.8s →
32.6% after closing.

Consequence: no `setTimeout` bookkeeping exists anywhere in the toast code. If the countdown ever
needs to survive a backgrounded tab, that is the trade being made.

## Gestures live on the container, not the toast

One `pointerdown` listener on the container host, registered **natively** (not via a template
binding) so 60Hz `pointermove` never triggers change detection. Movement is painted by writing
`--drag-x` / `--drag-y` / `--drag-fade` straight onto the toast element.

- Axis locks after 8px and stays locked.
- Horizontal ≥ 90px flings the toast out along the swipe; below that it springs back.
- Vertical **up** while stacked stretches the deck: `--fan` is a spring, `1 - e^(-lift/56)`, and it
  drives the gap between cards (`--stack-gap + --fan * --fan-spread`, 9px → 41px) plus a partial
  unscaling, so the buried cards grow toward parity as they separate. It gives freely at first and
  then resists, so it always answers the finger without ever running out of travel.
  **The deck's base stays anchored.** The host grows by `--fan * 2 * --fan-spread` — exactly the
  extra the deepest visible card takes up — and because the overlay is bottom-anchored that growth
  cancels the deepest card's downward travel. Measured across a pull: deepest card's bottom pinned
  at 918–919px while the gap went 20 → 41 and the front card rose. `--fan-spread` (32px) is the
  knob for how loose the spring feels; much past ~34px the stretch starts competing with the
  overview itself and the release stops feeling like an arrival.
  *Two wrong turns before this:* first `--fan` was clamped to 1, so past 56px the deck stopped
  following the finger and the gesture felt locked. The fix after that hauled the whole deck up
  with a damped `--fan-lift`, which tracked nicely but was motivated by nothing — with only three
  cards visible, lifting the pile reveals no new information. The pull belongs in the separation,
  which is the thing the overview is actually going to do.
- Vertical in the overview is left alone — that belongs to the scroller.

Only the front card is draggable while stacked; any row is draggable in the overview.

**`touch-action` is load-bearing, and its absence is invisible on a mouse.** The pill declares
`touch-action: none` and an overview row `pan-y`. Without them the browser claims the pan for
scrolling and fires `pointercancel` a few pixels in, which — if cancel is handled like an ordinary
release — springs the card straight back. That is exactly the "drag janks back to origin on a real
phone, works fine on desktop" symptom. Restrictions accumulate up the ancestor chain, so `none` on
`app-toast` also governs a touch that lands on `.message` inside it; in the overview the walk stops
at `.rows`, which is the scroll container, so `pan-y` there leaves vertical to the scroller.

Two supports for the same failure: pointer capture is claimed **at axis lock** (not on down, so a
tap and the badge's own click are untouched), and `pointercancel` is treated as *not a decision* —
it reverts, never dismisses, however far the finger travelled.

`is-fanning` kills transitions so the deck tracks the finger; `unfan()` removes the class, forces a
reflow, then clears `--fan` so the close animates instead of snapping. Signals written from these
native handlers are followed by `appRef.tick()` — see the zoneless idioms in [[frontend-unit-testing]].

A drag that moved swallows the trailing `click` via a capture-phase listener, so a swipe never also
reads as a tap.

**Tap slop is the subtle part, and it is what "I can't click it" turns out to mean.** Axis lock uses
6px for a mouse but **14px for touch** — a thumb tap on a pill routinely wanders further than a
mouse ever does. Separately, the click is only suppressed when the gesture travelled at least
`DRAG_INTENT_PX` (18px), so a tap that wobbled past the axis lock still counts as a tap. With a
single 8px threshold doing both jobs, ordinary taps locked an axis, were recorded as drags, and had
their clicks eaten — while **swiping stayed perfectly responsive, because the suppression guard
does not touch it.** That asymmetry (swipes fine, taps dead) is the signature; look here first.

Worth knowing when diagnosing: `elementFromPoint` over the deck — and over the page well away from
it — stays clean throughout a dismissal, so "something invisible is on top" can be ruled out in one
probe rather than guessed at. The click-capture listener is bound to the container, so it can never
swallow a click elsewhere on the page either.

**Taps still depend on the browser's `click`.** An attempt to drive them from `pointerup` instead
was reverted — see [[known-issues]] #27 for the unsolved bug that prompted it and everything the
investigation established.

**Nothing on the touch path may call `preventDefault()`.** `touch-action` (`none` on the deck,
`pan-y` on a row) already rules out panning, which is the only thing a `preventDefault` on
`pointermove` would buy — and `preventDefault` on a pointer event also suppresses the compatibility
mouse events the browser synthesises, `click` among them. `setPointerCapture` is likewise
redundant, since a touch pointer is implicitly captured by the element that received `pointerdown`.
Both were removed after a report of "the first tap anywhere on the screen after a dismiss does
nothing, ~600ms, mobile only, double-tap works" — the signature of clicks not being *generated*
rather than being intercepted. Note this class of bug cannot be reproduced with synthesised
`PointerEvent`s: the browser only synthesises clicks from real input, so it needs a real device.

## Exits are data, not classes

Dismissal records an `ExitPlan` (`depth`, `x`, `y`, `rotate`) in the `leaving` map. The depth is
frozen at dismissal time so the departing card holds its slot visually while the survivors promote
underneath it. One keyframe reads those as custom properties, so tap-down, tap-sideways and
swipe-in-any-direction are the same animation with different numbers. The exit's `from` keyframe
reads `--drag-x`, so a flung card continues from where the finger left it.

**The tilt is mode-aware.** `--drag-tilt` is `0.02deg` on the deck and `0deg` on an overview row,
and it feeds both the live drag transform and the exit keyframe, so a row drags and leaves square.
A slight rotation sells a card being flicked off a pile; the same rotation in a list of aligned
rows just looks untidy. Same reason `defaultExit()` and **Ryd alle** use `rotate: 0` in the
overview while a stacked swipe keeps `direction * 8`.

`removeWhenExitFinishes` awaits `element.getAnimations()` before telling the service to drop the
toast — the list is the source of truth, but it is only mutated once the pixels are done.

Exits cascade only during **Ryd alle**, gated by `:host(.is-clearing)`; a single dismissal must feel
immediate, so it gets no `animation-delay`.

## Tap opens a card in the deck

A tap on a stacked toast sets `expandedToastId` rather than dismissing it: the card keeps its
chrome but grows to `--expanded-height`, blooms the glyph, reveals the title and lets the message
wrap (up to `MAX_EXPANDED_LINES`, 4). A second tap puts it back. Its countdown freezes while open,
on the same `[isPaused]` input the overview uses, so it resumes where it stopped. Dismissal is
therefore swipe or the timer. **In the overview a tap still dismisses** — the content is already
all there, so there is nothing to open.

`--expanded-lines` lives on the container and feeds both `--expanded-height` and the card's
`line-clamp`, so one number drives the height and the clamp. The container grows by
`--expanded-extra`, and cards at depth ≥ 1 are pushed down by the same amount
(`min(var(--stacked-depth), 1) * var(--expanded-extra)`) so the deck keeps peeking below a card
that has opened up.

The line count is probed off the collapsed message before opening. **It can over-estimate by one
line**, because `font-size` is mid-transition when it is read, so the card is occasionally one line
taller than its text needs. A post-render correction was tried and removed: it reads at t≈0 of the
same transition and gets the same wrong answer. Fixing it properly means measuring against the
final type scale rather than the live computed one.

## The "N mere" badge counts out loud

The badge is the only number on the deck, so it is the one thing that should never just blink from
one value to another. Two numbers share a single grid cell inside a clipped `.badge-roll`, and
`@for (count of [badgeCount()]; track count)` makes a change a real enter/leave pair — the old digit
rolls out as the new one rolls in.

**The roll direction carries meaning.** A `linkedSignal` keeps the previous count alongside the
current one; `badgeRollsDown` flips `--roll-in` / `--roll-out` so the number rises when a toast
joins and falls when one leaves. It moves with the stack, not against it.

The pill itself pops in on a slight overshoot (`cubic-bezier(0.2, 1.5, 0.45, 1)`) and shrinks away
in 160ms. The leaving badge gets `pointer-events: none` — while it is still on screen it sits over
the front toast, and it must not eat a press meant for the card underneath.

One consequence of `showBadge()` living on the front toast: when a **new** toast arrives, the badge
does not roll in place — the old front toast's badge leaves with it while the new front toast's
badge enters. Both animations play at the same spot, so it reads as one pop, but the in-place roll
only actually happens when a *buried* toast goes away and the front card keeps its badge.

Reduced motion strips all four animations; Angular removes a zero-duration `animate.leave` element
immediately, so nothing gets stranded in the DOM.

## Container lifecycle

`syncOverlay()` is the only thing that opens or closes the overlay, and it runs after every list
mutation. It fixed [[known-issues]] #22 — see that entry for the race it replaced.

## Gotchas worth keeping

- **`overflow: hidden` on the panel must wait for the resize.** Clamping it at the start of the
  expand clips the pill against a panel that is still ~0 tall, so it is gated on
  `:host(.toast-overview:not(.is-resizing))`. `is-resizing` clears on the `.rows` height
  `transitionend`.
- **The scrim is a `<button>`, and it has to stay one.** A div with a click handler and no keyboard
  path is a genuine reliability finding, not a lint quibble, and `aria-hidden` does not answer it —
  the element really was a control that only a pointer could reach. As a button it costs three
  things, all of which look like noise until you know why: the global `button` rule has to be undone
  (`width`/`height`/`min-width`/`padding`/`border-radius`), `button:active` outranks the class on
  its own so the press tint needs turning off, and because `visibility` is deliberately held until
  the fade-out finishes while `pointer-events: none` does not stop focus, the template binds
  `tabindex="-1"` whenever the overview is closed. Without that last one it stays focusable for the
  620ms the fade takes.
- **Angular scopes `@keyframes` names** under emulated encapsulation (`_ngcontent-…_toast-in`), so
  never match on `animationName` in a handler.
- **`--overview-panel-width` is `min(440px, 92vw)`.** The compact class from `BreakpointObserver` is
  decided once, at open time; the `min()` means a wrong class can still never overflow a phone.
- **Nothing in a desktop browser exercises `touch-action`.** Mouse drags and synthesised
  `PointerEvent`s bypass it entirely, so a missing declaration passes every automated check and
  every desktop click-through, then fails on the first real finger. Treat gesture work as unverified
  until it has been on a phone.
- **Testing animations in a headless pane is unreliable.** rAF stalls when the pane is not
  compositing, which freezes CSS animations at `currentTime: 0` and makes
  `OverlayHandle.startExitAnimation` look hung. Force paints (screenshots) or drive a rAF pump
  before trusting any timing read.

## Related
- [[known-issues]] — #22, resolved by this work
- [[frontend-unit-testing]] — `toast-container.spec.ts` covers depth, overview and exit lifecycle
- [[overlay-exit-animations]] — the `OverlayHandle` contract the container's leave animation rides on
- [[rules]] — §5 AAA comments apply to these specs
