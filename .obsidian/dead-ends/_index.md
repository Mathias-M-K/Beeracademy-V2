---
type: index
updated: 2026-09-04
tags: [dead-end]
---

# Dead Ends Index

Approaches tried and rejected. Check here before suggesting alternatives.

| Date | Topic | File | Summary |
|---|---|---|---|
| 2026-08-25 | Rejected alternatives for the party-id rename | [[party-id-unification]] | Dual-read JWT fallback, internal-only rename, and a full `Party` aggregate were all considered and rejected — see the ADR before re-proposing any of them |
| 2026-09-03 | `animate.leave` for CDK overlay roots | [[animate-leave-for-overlay-roots]] | `inputBinding('animate.leave', …)` is not the animation instruction (NG0315), and CDK removes the portal node synchronously so nothing waits — use the class + `getAnimations()` pattern in [[overlay-exit-animations]] |


## Related
- [[README]] — vault index
- [[rules]] — conventions a proposed alternative still has to satisfy
