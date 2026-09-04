---
type: pattern
layer: frontend
updated: 2026-09-04
tags: [pattern, frontend, angular, cdk]
---

# Overlay Exit Animations

How a CDK-overlay component plays an exit animation before it is disposed.

## Mechanism

`OverlayHandle.teardown()` owns it centrally. Before `overlayRef.dispose()`:

1. Take the component root — `overlayRef.overlayElement.firstElementChild` (the pane's
   only child).
2. Add the class `overlay-leaving`.
3. `await Promise.all(el.getAnimations().map(a => a.finished.catch(() => {})))`.

Both `close()` and `dismiss()` route through `teardown`, so both animate.
`dismiss(true)` skips it.

## What an overlay has to do

One SCSS rule. Nothing in TypeScript.

```scss
:host(.overlay-leaving) {
  animation: fly-out 1s ease forwards;
}
```

`:host(.cls)` matches regardless of who set the class, so no `::ng-deep` and no global
stylesheet. Use `forwards` so the end state holds until dispose. `:host(.overlay-leaving)`
compiles to `[_nghost-x].overlay-leaving`, which outspecifies a plain `:host` — an entry
animation on `:host` is overridden without `!important`.

## Why `getAnimations()` and not `animationend`

- `animationend` bubbles from children, forcing `event.animationName === '...'` filtering —
  the same animation name then lives in both TS and SCSS.
- It never fires under `prefers-reduced-motion`, so every call site needed a `setTimeout`
  fallback.

`getAnimations()` (no `subtree`, host element only) needs neither: no matching rule means an
empty array means instant resolve. `.catch()` on `finished` absorbs the rejection when a
running animation is cancelled by a concurrent dispose.

## Constraints

- **Only the overlay root.** Angular's `animate.leave` cannot drive it — see
  [[animate-leave-for-overlay-roots]].
- **`firstElementChild` assumes the pane has exactly one element child.** True for
  `ComponentPortal`, which appends one root node. A focus trap would break it by inserting
  `cdk-focus-trap-anchor` siblings; `CdkDialog` wraps content in a container component for
  exactly this reason. Failure is silent — the class lands on the anchor, no rule matches,
  the overlay disposes instantly.
- **Duration is the overlay's business, delay is the caller's.** An overlay does not get to
  decide it isn't ready to leave yet. A minimum-visible-time hold (so a fast request doesn't
  flash a loader) belongs to whoever opened it, not to the loader.

## History

Replaced a per-overlay `registerLeave(() => Promise<void>)` hook, where every overlay
hand-rolled the same host-element + `animationend` + fallback-timeout dance. The hook and
all its callers are gone.

## Related
- [[animate-leave-for-overlay-roots]] — why the framework feature can't do this
- [[project-beeracademy]]
