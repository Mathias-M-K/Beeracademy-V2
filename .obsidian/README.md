---
type: index
updated: 2026-09-04
tags: [index, meta]
---

# Beeracademy Vault

The knowledge vault for the Beeracademy monorepo — why things are the way they are, what is
already known to be broken, and which roads have already been walked down and abandoned.

Start here. Every note in the vault is reachable from this page.

New machine? [[SETUP]] — Obsidian, the MCP Connector plugin, and the Claude Code wiring.

---

## Read first

| Note | What it is |
|---|---|
| [[rules]] | Conventions the codebase is held to, each with a runnable **check**. **Outranks `CLAUDE.md`.** |
| [[known-issues]] | Documented but unfixed problems. Resolved entries kept, struck through. |
| [[security-issues]] | Security defects, tracked separately by severity and status. |
| [[project-beeracademy]] | Stack, package layout, game flow, current branch. |

## Decisions (ADRs)

Why a thing is the way it is. Superseded ADRs stay, marked.

| # | Note | Status |
|---|---|---|
| 001 | [[no-database]] | ⚠️ Superseded by [[redis-state-store]] |
| 002 | [[jwt-in-cookies]] | Accepted |
| 003 | [[game-session-service]] | Accepted |
| 004 | [[party-id-unification]] | Accepted |
| 005 | [[redis-state-store]] | Accepted |

New ADR: copy `templates/adr-template.md`, number it after the highest above, and add a row here.

## Patterns

Established conventions — the *how*, where the ADRs are the *why*.

**Backend**
- [[architecture-tests]] — ArchUnit rules replacing the greps in [[rules]]
- [[domain-events]] — emitting and broadcasting game events
- [[party-id-lifecycle]] — how the one id behaves across the lobby→game seam
- [[websocket-session-managers]] — adding actions, lobby participant handling

**Frontend**
- [[reaction-routing]] — routing a transient per-target event to one dumb child
- [[route-resolvers]] — resolvers as navigation gates, and the loading gap they cost
- [[runtime-config]] — the API URL is runtime config, not build-time
- [[overlay-exit-animations]] — playing an exit animation before a CDK overlay disposes

## Dead ends

Approaches already tried and rejected. **Read before proposing an alternative.**

- [[dead-ends/_index|Dead ends index]] — the full table
- [[animate-leave-for-overlay-roots]] — why `animate.leave` cannot drive an overlay root

## Archive

Point-in-time documents kept for their reasoning, not as live status. Anything still
actionable in here has been promoted into [[known-issues]].

- [[party-state-endpoint-review]] — party-state endpoint & join-page rewrite, 2026-08-28

---

## Conventions for this vault

- **One idea per note.** If a note grows a second subject, split it.
- **Every note ends in `## Related`.** That is what keeps the graph connected — a note nothing
  links to is a note nobody will find.
- **Frontmatter on every note**: `type` (`adr` · `pattern` · `dead-end` · `registry` ·
  `context` · `index` · `code-review` · `meta`), plus `layer`, `status`, `updated`, `tags`
  where they apply.
- **Filenames are kebab-case**, and the wikilink is the bare filename — folders can move
  without touching a single link.
- **Correct in place, don't fork.** A superseded note gets a banner and a pointer forward
  (see [[no-database]]); it does not get deleted, and it does not get left silently wrong.
- **Live problems live in [[known-issues]] / [[security-issues]]**, never buried in a review.
