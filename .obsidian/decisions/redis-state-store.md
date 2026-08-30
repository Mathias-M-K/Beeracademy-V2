# ADR-005: Redis as the State Store (supersedes ADR-001 [[no-database]])

**Date**: 2026-08-25 (recording a change that happened earlier and was never written down)
**Status**: Accepted

## Context
[[no-database]] states that all game and lobby state is held in-memory in Java Maps with no
database dependency. **That is no longer true**, and has not been for some time — the ADR
was never superseded, so the vault (and `CLAUDE.md`) still assert the old design.

Observed in the code:
- `SessionRegistry` is constructed from a `RedisDataSource`, stores `Session` values under
  `SESSION:<id>` keys, and uses Redis optimistic-locking transactions
  (`redisDataSource.withTransaction`) to atomically claim a websocket connection slot.
- `GameService` persists `GameSnapshot` values through
  `redisDataSource.value(GameSnapshot.class)`.

## Decision
Redis is the state store for **sessions** and **game snapshots**. Only `LobbyRepository`
remains a plain in-memory `HashMap`.

## Consequences
- Game state and sessions now survive an application restart; lobbies do not.
- `LobbyRepository` being in-memory makes lobbies **single-instance only** — horizontal
  scaling would drop lobbies on any node that did not create them, while games and sessions
  would scale fine. This asymmetry is a live constraint, not a hypothetical.
- Game snapshots are stored at the **bare id** with no key prefix, sharing a keyspace with
  `SESSION:*` (there is a `// TODO introduce cache key prefix` in `GameService`).
- No TTL is configured on game snapshots, so finished games persist indefinitely.
- ADR-001 [[no-database]] and the "No Database" section of `CLAUDE.md` are both wrong and
  should stop being cited.

## Related
- [[no-database]] — superseded by this
- [[known-issues]] — the unprefixed key and lobby-persistence issues
- [[project-beeracademy]] — overall architecture
