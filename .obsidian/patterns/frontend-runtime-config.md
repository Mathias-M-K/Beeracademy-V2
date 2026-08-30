# Pattern: Frontend API URL is runtime config, not build-time

## Rule

The Angular bundle is **environment-agnostic**. Nothing about the backend URL is baked in at
`npm run build` — there are no `environment.ts` / `fileReplacements`, and one image runs in
every environment. The API URL arrives at *container start*, from a Kubernetes env var.

Check: `grep -rn "localhost:8080" frontend/src` returns nothing — the dev URL lives only in
`frontend/public/config.json`, never in source.

## The chain

```
deployment/frontend/deployment.yaml   env: API_URL, ENVIRONMENT
        ▼  (container start)
docker-entrypoint.sh                  envsubst < config.template.json > config.json
        ▼  (browser load, before bootstrap)
src/main.ts                           fetch('/config.json') → window.APP_CONFIG
        ▼
src/config.service.ts                 ConfigService.apiUrl / .environment
```

Four files, in order:

1. **`frontend/public/config.json`** — the *development* values, committed:
   `{"apiUrl": "http://localhost:8080", "environment": "development"}`. This is what `ng serve`
   and a bare `docker run` with no env vars use.
2. **`frontend/public/config.template.json`** — the placeholder twin:
   `{"apiUrl": "${API_URL}", "environment": "${ENVIRONMENT}"}`.
3. **`frontend/docker-entrypoint.sh`** — before exec'ing nginx, substitutes and **overwrites**:
   ```sh
   if [ -f /usr/share/nginx/html/config.template.json ]; then
     envsubst '${API_URL} ${ENVIRONMENT}' < .../config.template.json > .../config.json
   fi
   ```
   So the localhost `config.json` is present in the image and replaced in place at boot.
4. **`frontend/src/main.ts`** — `fetch('/config.json')` resolves *before* `bootstrapApplication`,
   parking the result on `window.APP_CONFIG`. `ConfigService` is the only reader.

Both JSON files reach the image because `angular.json` copies all of `public/` as assets
(`{"glob": "**/*", "input": "public"}`) and the dockerfile copies
`dist/beeracademy-frontend/browser` into `/usr/share/nginx/html`.

## To point production somewhere else

Edit `API_URL` in `deployment/frontend/deployment.yaml` and re-apply. **No rebuild, no new
image tag** — that is the whole point of the pattern.

```yaml
env:
  - name: API_URL
    value: "https://beeracademy.mathiaskofod.dk"
  - name: ENVIRONMENT
    value: "production"
```

Today the API is same-host: `deployment/ingress.yaml` routes `/api`, `/ws` and `/q` to
`beer-academy-backend-service` and `/` to the frontend, all under
`beeracademy.mathiaskofod.dk`. So `API_URL` currently equals the frontend's own origin — which
means an accidental empty value would still *appear* to work locally-ish while being wrong.

## Cost: every failure in this chain is silent

There is no fail-fast anywhere along it. Three ways it degrades quietly:

- **`API_URL` unset on the container.** `envsubst` substitutes an *empty string* rather than
  erroring, so `config.json` becomes `{"apiUrl": ""}` and the app issues same-origin requests.
  No log, no crash.
- **`config.template.json` missing.** The entrypoint's `if [ -f ... ]` guard skips substitution
  entirely and nginx serves the committed **localhost** `config.json` — a production container
  quietly pointing at `http://localhost:8080`.
- **`fetch('/config.json')` fails.** `main.ts` only does `.catch(err => console.error(...))`, so
  the app never bootstraps and the user gets a blank page with a console line.

If this ever needs hardening, the entrypoint is the place: `set -eu` plus an explicit
`[ -n "$API_URL" ]` check beats debugging an empty `apiUrl` from the browser.

## `envsubst` in the slim image — verified present

`nginx:*-alpine-slim` is documented as dropping extras that the plain `alpine` tag carries, and
`envsubst` (from `gettext`) is the usual casualty — which would hit failure mode 2 above without
a word. **Checked against the pinned tag and it is there:**

```
$ docker run --rm --entrypoint sh nginx:1.31.2-alpine3.23-slim -c "command -v envsubst"
/usr/bin/envsubst
```

So no `apk add gettext` is needed today. Worth re-checking on a base-image bump, since the
entrypoint would swallow its disappearance. The dockerfile pins an exact tag
(`1.31.2-alpine3.23-slim`, bumped from `1.29.5` on `improvement-of-life-fixes`), so this is a
deliberate-upgrade concern, not a drift concern.

## Related
- [[project-beeracademy]] — stack and deploy overview
- [[route-resolvers]] — the other place a cold `/join` entry can fail invisibly

## Mock mode (2026-08-30)

The same file-swap mechanism drives a mock backend, so no source change was needed — only a
different `config.json`.

```
npm run start:mock          # ng serve --configuration mock
docker compose -f .insomnia/mock-server.yaml up -d
```

- `.insomnia/mock-server.yaml` runs Insomnia's self-hosted **mockbin** (+ redis) on **9080**.
- `frontend/public/mock/config.json` points `apiUrl` at the bin, prefix included:
  `http://localhost:9080/bin/mock_<id>`. Routes live in
  `.insomnia/_insomnia__insomnia_mock_server.yaml`.
- The `mock` build configuration in `angular.json` overrides `assets`: it ignores the dev
  `config.json` **and** `mock/**`, then copies `public/mock/config.json` to the output root.
  Both ignores are needed — without the second, the file is also emitted at `mock/config.json`.

The file has to already be named `config.json`: an asset pattern's `output` is a directory,
not a filename, so nothing can rename it during the copy. `fileReplacements` is not an option
either — it works on the bundler's module graph, and `config.json` is a copied asset.

Verified: `ng build --configuration mock` emits the mock config with no stray `mock/` folder,
and `--configuration development` still emits `localhost:8080`.

### What mock mode cannot cover

- **Credentialed endpoints.** Mockbin answers with `Access-Control-Allow-Origin: *` *and*
  `Access-Control-Allow-Credentials: true` — a combination browsers reject for credentialed
  requests, which need the literal origin. So `POST /lobbies`, `/lobbies/{id}/register`
  (`lobby-api.service.ts`) and the game claim (`game-api.service.ts`) fail, while `/api/ping`
  and `getParty` (no `withCredentials`) work. curl does not show this — it ignores CORS.
- **Websockets.** `websocket.service.ts` derives both socket URLs from the same `apiUrl`;
  mockbin is HTTP-only, so `/lobby` and `/game` die at the 6 s handshake timeout.

Fixing the first means a dev-server proxy with a `pathRewrite` onto the bin prefix plus
`"apiUrl": ""`, making everything same-origin — which also matches prod, where the ingress
puts the API on the same host. Not done yet.
