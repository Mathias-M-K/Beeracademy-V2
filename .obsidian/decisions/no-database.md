# ADR-001: No Database — In-Memory State Only

**Date**: (before 2026-06-16, pre-existing decision)
**Status**: Superseded by [[redis-state-store]]

## ⚠️ Superseded
This ADR no longer describes the system. `SessionRegistry` and `GameService` are
Redis-backed; only `LobbyRepository` is still in-memory. See [[redis-state-store]].

## Context
Beeracademy is a real-time party game. Sessions are ephemeral; persistence between server restarts is not a requirement.

## Decision
All game and lobby state is held in-memory (Java Maps/objects). No database dependency.

## Consequences
- Simple deployment (no DB container or migration tooling)
- Server restart loses all in-progress games — acceptable for the use case
- Horizontal scaling requires sticky sessions or a state-sharing layer (not currently needed)
- Do NOT suggest adding a database unless requirements change significantly

## Related
- [[domain-events]] — events are also in-memory, no event store
- [[project-beeracademy]] — overall architecture
