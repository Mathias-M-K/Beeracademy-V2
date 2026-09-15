---
type: pattern
layer: infra
status: active
updated: 2026-09-15
tags: [ci, github-actions, kubernetes, pattern]
---

# CI workflows

Four workflows under `.github/workflows/`, all on the self-hosted runners, plus `.github/dependabot.yml`.

| Workflow | Trigger | Does |
|---|---|---|
| `backend-ci.yml` | PR + push to `main`, paths `backend/**` | `./gradlew test jacocoTestReport` → test report on failure → `sonar` |
| `frontend-ci.yml` | PR + push to `main`, paths `frontend/**`, `backend/src/main/**`, `backend/build.gradle` | generate spec → `npm ci` → `format:check` → models → `ng test` → `ng build` → Sonar |
| `deploy.yml` | tag `v*.*.*` + manual | verify CI → backend image (uploads spec) → frontend image (downloads spec) → `set image` + rollout → GitHub Release |
| `runner-maintenance.yml` | Mondays 04:00 + manual | prunes Docker images and build cache older than 7 days |

## Constraints that shaped it

- **Two runners on one laptop** (`mathias-matebook`, `mathias-matebook-1`). Parallelism is capped at two jobs that share CPU and one Docker daemon. Every extra job costs a slot, so work is packed into few jobs instead of fanned out.
- **Staying self-hosted is a deliberate choice** (2026-09-15).
  - GitHub-hosted runners were considered: free for this public repo, and they would remove the two-job cap and the duplicate backend compile in Frontend CI (34s).
  - Declined: builds are infrequent, and keeping CI local is valued.
  - **If another machine is added as a runner:** give the MicroK8s host's runner a `k8s` label and set the deploy job to `runs-on: [self-hosted, k8s]`. CI jobs stay plain `self-hosted`.
- **Self-hosted runners on a public repo.** Fork PRs could run code on the laptop. The repo setting "Require approval for all external contributors" is the guard, and must stay on.
- **The OpenAPI spec is generated, never committed.** `frontend/src/api-models/` and `frontend/openapi-spec/` are gitignored. `quarkusBuild` writes `backend/build/generated-openapi/openapi.json`.
  - **In CI, the frontend job builds the spec itself.** A job cannot `needs` a job in another workflow, and waiting on backend tests would cost about 3 min.
  - This duplicates the backend compile when both CI workflows run (about 34s), but with the two jobs running in parallel it adds no waiting time. Serialising to avoid it would take PRs from about 3 min to 4–5.5 min.
  - **In deploy, the frontend `needs: backend` and downloads the artifact**, so its models come from exactly the backend build being shipped. The upload uses `if-no-files-found: error`, so a missing spec fails the backend job.
  - **The spec survives the build cache** because `backend/build.gradle` declares `build/generated-openapi` as an output of `quarkusAppPartsBuild`. Without that, a cache hit restores the task without the spec.
- **The deploy runs no tests and no Sonar.** It trusts CI on `main`.
  - `main` is deliberately **unprotected**. Path-filtered workflows plus required checks leave skipped checks pending forever.
  - **The `verify-ci` job is the guard instead.** It waits up to 15 min for the push runs of `backend-ci`/`frontend-ci` on the tagged commit, and fails if either did not pass. No CI runs at all (e.g. a commit touching neither side) only produces a warning.
- **Concurrency.** PR runs cancel superseded runs; `main` runs don't. Deploys and runner maintenance share the `deploy` group and are never cancelled, so pruning never happens mid-build.
- **Caching is local, not GitHub cache.**
  - `setup-gradle` runs with `cache-disabled: true`; the runners' `~/.gradle` persists, and `org.gradle.caching=true` is on.
  - `npm ci` in the frontend Dockerfile uses a BuildKit cache mount, which is why `runner-maintenance` exists.

## Deploying to Kubernetes

- **Structure lives in `deployment/`; the release tag lives in the cluster.** The deploy only runs `kubectl set image`. Changes to `deployment/` (probes, env, strategy) are applied by hand with `microk8s.kubectl apply -f deployment/backend -f deployment/frontend`.
  - **An apply resets the image to `:latest` and rolls the pods.** Both containers set `imagePullPolicy: Always`, so the node pulls the current `latest` instead of reusing a cached copy. With the default `IfNotPresent`, the frontend once came back on a months-old cached `latest`.
  - **After an apply, pin the release tag again** with `kubectl set image ... :vX.Y.Z` for both deployments, so the cluster shows which release it runs.
- **Probes:**
  - Backend: startup `/q/health/started`, readiness `/q/health/ready` (includes the Redis check), liveness `/q/health/live`, from `quarkus-smallrye-health`.
  - Frontend: `/` on nginx.
  - `maxSurge: 1, maxUnavailable: 0` keeps the old pod until the new one is ready.
- **Rollback.** Rollouts time out after 5 min. If the rollout step fails, both deployments are `rollout undo`ne together, so the frontend models stay matched to the backend API.
- **ReplicaSets.** `revisionHistoryLimit: 3` on both. Old sets are scaled to 0 and are what `rollout undo` uses; the backend previously kept the default 10.
- **Checking what actually runs.** Compare the pod's `imageID` digest (`kubectl get pods -o custom-columns=...:.status.containerStatuses[0].imageID`) with the registry (`docker buildx imagetools inspect ghcr.io/mathias-m-k/<image>:<tag>`). The image *name* on the pod can say `latest` while the digest is something else.

## Supply chain

- **Actions are pinned to commit SHAs**, with the version in a trailing comment that Dependabot reads.
- **Dependabot** covers github-actions, gradle, npm and both Dockerfiles, weekly.
  - Minor and patch updates are grouped into one PR per ecosystem, and at most 2 PRs per ecosystem are open at a time.
  - Major versions are ignored everywhere; take them on deliberately (Angular majors need `ng update`).
  - Dependabot runs don't get repo secrets, so both Sonar steps skip `dependabot[bot]`.
  - Quarkus versions sit in `gradle.properties` and may not be picked up by Dependabot.
  - Wait for green CI before merging a Dependabot PR.
- **GHCR pushes use `GITHUB_TOKEN`** (`packages: write`), not a PAT.
  - Each package (`beer-academy-backend`, `beer-academy-frontend`) must grant `Beeracademy-V2` the **Write** role under *Manage Actions access* in the package settings. Without it the push fails with `denied: permission_denied: write_package`.
  - The `org.opencontainers.image.source` label on the images does not grant access to packages that already exist.
- **Every workflow declares `permissions:`**; the deploy grants `packages: write` and `contents: write` only to the jobs that need them.

## History

- **2026-09-15:** rewritten. The previous setup (`main.yml`, `pr-scan.yml`, `test-build.yml`) took 5m45s–8m20s per deploy. It re-ran tests and Sonar on tag, built Quarkus three times, and never built the frontend on PRs.
- **2026-09-15, same day:** hardening. CI guard, probes, rollback, SHA pins, Dependabot, `GITHUB_TOKEN` for GHCR, runner maintenance, Prettier, release notes.
- **2026-09-15, incident:**
  - The first merge (PR #30) missed the new `deploy.yml` and the deletion of the old workflows, so tags still ran `main.yml` and PRs still ran `pr-scan.yml`.
  - Dependabot's first run opened 16 ungrouped PRs, which queued about 40 runs on the two runners.
  - Fixed in PR #47: restored `deploy.yml`, deleted the old workflows, and switched Dependabot to grouped minor/patch updates with majors ignored. The stray PRs were closed and their runs cancelled.
  - First green CI on the new setup: `311aa00` (Backend CI 2m44s, Frontend CI 3m00s).
- **2026-09-15, v1.0.13 → v1.0.14:**
  - v1.0.13 failed twice. First GHCR refused the `GITHUB_TOKEN` push until both packages granted the repo Write access. Then the frontend job found no `openapi-spec`, because `quarkusAppPartsBuild` was restored from the build cache without the spec. Fixed in PR #50.
  - v1.0.14 deployed. The one-time manual apply for the probes then reset both images to `:latest`, and the frontend pod reused a cached `latest` from 2026-06-29 because its pull policy was `IfNotPresent`. Fixed by setting the image back to v1.0.14 and adding `imagePullPolicy: Always` to both manifests.

## Related

- [[project-beeracademy]] — overall architecture
- [[runtime-config]] — why the frontend image is environment-agnostic
- [[security-issues]] — SEC-2 covers the public `/q` route the health probes live under
- [[README]] — vault index