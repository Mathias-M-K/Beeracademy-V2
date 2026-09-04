---
type: dead-end
layer: frontend
updated: 2026-09-03
tags: [dead-end, frontend, angular, cdk]
---

# `animate.leave` for CDK overlay roots

**Tried:** driving overlay exit animations with Angular's `animate.leave` instead of a
hand-rolled mechanism, by passing it as a binding to the `ComponentPortal`:

```ts
new ComponentPortal(conf.component, null, injector, null,
  [inputBinding('animate.leave', () => 'leaving')]);
```

**Rejected.** It cannot work, for two independent reasons.

## `inputBinding` is not the animation instruction

`animate.enter` / `animate.leave` are template-compiler syntax. The compiler pattern-matches
the `animate.` prefix and emits `ɵɵanimateLeave`. `inputBinding()` creates a plain directive
input binding — it calls `setDirectiveInput` with the public name `"animate.leave"`, and in
dev mode throws **NG0315** when the component has no such input. In prod it silently does
nothing. There is no runtime path from `inputBinding` to the animation instruction.

## CDK owns the removal, so nothing waits

`ɵɵanimateLeave` registers into `parentLView[ANIMATIONS].leave` keyed by `tNode.index`. That
map is read only from `applyView(..., action 2|3, ...)` — when **Angular itself** detaches
or destroys the node. The whole point of the feature is that the framework defers its own
`nativeRemoveNode` until the animation resolves.

A `ComponentPortal` in a `DomPortalOutlet` never enters that path:

```
attach:  createComponent() → appRef.attachView() → outletElement.appendChild(rootNode)
dispose: appRef.detachView() → componentRef.destroy() → OverlayRef removes _host from the DOM
```

No parent LView or tNode owns that host element, and removal is a direct **synchronous** DOM
operation by CDK. Two owners, one node — and the one that would wait is not the one doing
the removing.

## What still works

`animate.leave` is fine *inside* an overlay for children Angular controls — an element in an
`@for` or `@if`. Only the overlay **root** is out of reach.

## Instead

Class + `getAnimations()`, applied centrally by `OverlayHandle` — see
[[overlay-exit-animations]].

## Related
- [[overlay-exit-animations]]
