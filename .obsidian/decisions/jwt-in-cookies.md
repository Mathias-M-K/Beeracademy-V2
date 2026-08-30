# ADR-002: JWT Returned as Cookies, Not Authorization Headers

**Date**: (before 2026-06-16, pre-existing decision)
**Status**: Accepted

## Context
Standard Bearer token auth requires the frontend to store tokens in localStorage (XSS risk) or manage headers manually.

## Decision
JWT tokens are set as HTTP cookies by `AuthService`. HTTP-only in production, regular in dev. Secure flag set in production only. Expiry: 5 hours.

## Consequences
- Frontend gets auth "for free" on every request — no manual header wiring
- HTTP-only cookies mitigate XSS token theft in production
- CSRF becomes a concern in production (mitigated by CORS config)
- Do not change to header-based auth without considering frontend impact

## Related
- [[project-beeracademy]] — overall architecture and auth notes
