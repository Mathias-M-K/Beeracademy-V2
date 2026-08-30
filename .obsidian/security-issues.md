# Security Issues

Security defects, tracked separately from [[known-issues]] (which covers correctness and
architectural drift). Each entry carries a severity, a status, the *why*, and a **check**
you can run.

Severity is about exposure, not effort. An entry stays **OPEN** until the credential is
rotated or the hole is closed — deleting the offending line is not closure.

---

## SEC-1 — Valkey password committed to a public repository

**CRITICAL · OPEN · discovered 2026-08-25**

`src/main/resources/application.properties:9` carries the production Valkey credential in
cleartext:

```properties
%prod.quarkus.redis.hosts=redis://:d123456@valkey.valkey.svc.cluster.local:6379/0
```

**Exposure:**

| | |
|---|---|
| Introduced | `539d3a1`, 2026-05-05 ("Refactor session management…") |
| Branches | `origin/main`, `origin/development` — pushed |
| Repository | `github.com/Mathias-M-K/Beeracademy-V2` — **PUBLIC** |
| Also present in | `build/resources/main/application.properties`, and every published `ghcr.io/mathias-m-k/beer-academy-backend` image layer |

**Why this is critical, not a known issue:** the value has been publicly readable for ~3.5
months and is in git history on a public remote. It must be assumed compromised regardless
of whether anyone reached the service. Redis holds sessions and game snapshots
([[redis-state-store]]), and sessions carry the `PARTY_ID` / `PLAYER_ID` claims behind auth
([[jwt-in-cookies]]) — read access to that store is read access to live session state.

Mitigating, but not exculpating: `valkey.valkey.svc.cluster.local` is a ClusterIP DNS name,
so the instance is probably not routable from outside the cluster. That limits who could
have *used* the credential; it does not make the credential safe to keep.

**Fix, in this order:**

1. **Rotate the Valkey password.** First and non-negotiable. The old value is public and
   preserved in history — removing the line does not un-publish it.
2. **Move it out of source.** Delete line 9 and inject `QUARKUS_REDIS_HOSTS` from a
   Kubernetes Secret. `deployment/backend/deployment.yaml` already has an `env:` block
   (currently only `TZ`), so this is a small addition:
   ```yaml
   env:
     - name: TZ
       value: Europe/Copenhagen
     - name: QUARKUS_REDIS_HOSTS
       valueFrom:
         secretKeyRef:
           name: valkey-credentials
           key: redis-url
   ```
   Quarkus maps `quarkus.redis.hosts` → `QUARKUS_REDIS_HOSTS`, so no code change is needed.
3. **History purge is optional and comes last.** `git filter-repo` / BFG would rewrite
   shared history on `main` and `development` for a value that is already public and already
   rotated. Cosmetic. Do it only if the repo's history matters more than the disruption.

**Check** — both must return nothing:
```bash
grep -rnE '://[^/@ ]*:[^@ ]+@' src/main/resources/           # inline credentials in config
git log --oneline -S 'd123456' --all                          # historical exposure (pre-purge: expect 539d3a1)
```

**Rule going forward:** no credential literal under `src/main/resources/**`. Secrets reach
the app as environment variables sourced from Kubernetes Secrets. Worth adding a secret
scanner (gitleaks or trufflehog) to CI so this fails the build rather than waiting to be
noticed.

**Open question:** `d123456` looks like a placeholder or default rather than a generated
password. If the deployed Valkey was never configured with `requirepass` at all, the real
issue is an *unauthenticated* store and this entry understates the problem — the deployment
manifests in `deployment/` contain no Valkey configuration, so this could not be confirmed
from the repo. Verify against the running cluster.

---

## Related
- [[known-issues]] — correctness and architecture violations
- [[redis-state-store]] — what is actually stored in Valkey
- [[jwt-in-cookies]] — session tokens and claims
- [[rules]] — codebase conventions
- [[project-beeracademy]] — overall architecture
