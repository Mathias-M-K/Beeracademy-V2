# Pattern: Routing Transient Events to Child Components (Angular)

How a one-shot, per-target event (a lobby **emoji reaction**) flows from a
service down to exactly one dumb child component. Added 2026-06-27 on
`improvement/better-lobby-logic`. Frontend (Angular v20, signals).

## The Problem
Emoji reactions arrive over the websocket and must animate on **one**
participant's badge — the sender's. The wrong instinct is to let every
`app-participant` subscribe to the emoji stream and each decide "is this mine?".
That multiplies subscriptions and pushes a routing decision into every dumb leaf.

## The Pattern
Decide once, in the smart container; children stay dumb (input in, animation out).

1. **One subscription** in the smart component (`ParticipantOverview`, mirroring
   how `chat.ts` injects `ChatService`). `lobby-page` stays a thin shell.
2. **Route by id into a signal map**:
   `emojiReactions = signal<Record<senderId, EmojiInfo>>({})`, updated with
   `{...map, [senderId]: info}`.
3. **Reference-identity trick** — the spread creates a new top-level object but
   reuses every *existing* entry's reference. Template binds
   `[emojiReaction]="emojiReactions()[participant.id]"`; Angular compares each
   input with `===`, so **only the targeted child's input changes** → only its
   `effect()` fires. Everyone else is unchanged. The "is this mine?" decision
   happens once, in the map write.
4. **Dumb leaf animates**: `ParticipantBadge` has `effect(() => play(reaction()))`;
   `play()` flips a `signal` that toggles a CSS class. A plain CSS `transition`
   handles both enter and leave — **no `@angular/animations` needed** for an
   element that always exists in the DOM. A `setTimeout` flips it back off after
   the hold.

## Trade-off (known wart)
A `signal` is **state**; an emoji is a fire-and-forget **event** (cf. backend
[[domain-events]]). The map retains the last reaction per sender, so a badge
recreated by `@for` could **replay** a stale emoji on init. Low risk with
`track participant.id` (views aren't recreated unless a participant leaves/rejoins).
The genuinely stateless alternative — `viewChildren(Participant)` + imperative
`child.play()` — was considered and **rejected** to keep the declarative
input/`effect` flow. Revisit if replay ever bites.

## Dependency direction (don't invert layers)
`chat.service` depends on `lobby.service`, never the reverse — so do **not** inject
a chat-owned service into `lobby.service` (circular dep + layer inversion). The
`Emoji` code → display char translation is a **pure const map** (`EMOJI_DISPLAY`,
`Record<Emoji, string>` so it's exhaustive), not a service, so either layer can
import it safely. `lobby.service` fills `emojiAsString` where it already builds
the `EmojiInfo`.

## Gotchas
- **CSS overflow on siblings**: to clip the oversized emoji but *not* the
  `active-indicator` (same parent), wrap only the emoji in its own
  `overflow: hidden` + `border-radius: 50%` box. `overflow` clips all
  descendants, so the only fix is to stop sharing the clipping parent.
- **Host reactions** arrive with `senderId === lobbyId`, which matches no
  participant id — so a host emoji lands on no badge (currently intended).

## Wiring (end to end)
Backend `Emoji` enum (BEER, VOMIT, CONFETTI, CRY_LAUGH, FIRE, SKULL) →
`SEND_EMOJI` action / `EMOJI_SENT` event (see [[websocket-session-managers]]) →
`LobbyService.emojiReactions` Subject → `ChatService.emojis` →
`ParticipantOverview` routing → `Participant` → `ParticipantBadge` animation.

## Related
- [[domain-events]] — backend events are also fire-and-forget; same mental model
- [[websocket-session-managers]] — the SEND_EMOJI/EMOJI_SENT plumbing
- [[project-beeracademy]] — overall architecture
