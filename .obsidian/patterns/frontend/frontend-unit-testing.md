---
type: pattern
layer: frontend
status: active
updated: 2026-09-16
tags: [pattern, frontend, angular, testing, vitest]
---

# Frontend unit testing

Unit tests for the Angular 22 frontend (zoneless, signals). Introduced on branch `frontend-tests`
(PR #54, 2026-09-16): 39 spec files, ~500 tests, ~86% line coverage.

## Scope — what unit tests are for
- **Logic, not layout.** Services (the websocket state machines in `GameService`/`LobbyService`
  carry most of the value), resolvers, API clients, utilities, directives, and components *with
  their own logic* (inputs → rendered state / outputs / service calls).
- **Not here:** page flows, visual layout, camera/QR (`qr-scanner-drawer`), `serial-playground`.
  Those belong to the future Playwright suite.
- No snapshot tests, no "should create" tests.

## Stack
- `@angular/build:unit-test` builder → **Vitest 4** + **jsdom**. Stay on Vitest 4 until
  `@angular/build` peers a newer major.
- **Plain TestBed** (the official angular.dev approach). No `@testing-library/angular`, no MSW,
  no zone.js utilities.
- Specs are co-located (`*.spec.ts`). Shared helpers live in `frontend/src/testing/`, which is
  excluded from `tsconfig.app.json` and Sonar sources, and included in `tsconfig.spec.json` and
  Sonar tests.

## Commands
- `npm test` — watch mode. `npx ng test --watch=false --include <path>` for one file/folder.
- `npm run test:ci` — single run with coverage. Writes
  `coverage/beeracademy-frontend/lcov.info` and `coverage/sonar-report.xml`
  (`vitest-sonar-reporter`, configured through the builder's `reporters` option in
  `angular.json`).
- Locally the models must exist first: `./gradlew quarkusBuild -x test` in `backend/`, then
  `npm run openApi:local`.
  - **Gotcha:** Gradle must run on JDK 21. A JDK 19 `JAVA_HOME` fails with
    `UnsupportedClassVersionError`.

## Helpers (`src/testing/`)
| File | What |
|---|---|
| `fake-websocket.service.ts` | `FakeWebsocketService`. Every `connect*` stays pending until the test calls `acceptConnection()` / `rejectConnection(code)`. Then `emit`, `dropConnection(code)`, `closeConnection()`, and inspect `sent` / `lastSent()` / `connectionAttempts`. |
| `overlay.ts` | `createOverlayHandle()` — a **real** `OverlayHandle` over a fake `OverlayRef`, so close/dismiss keep production semantics. |
| `stubs.ts` | Toast/Overlay/Drawer service stubs (`vi.fn`). Overlay and drawer stubs hand out real handles, recorded in `.handles`. |
| `game-builders.ts`, `lobby-builders.ts` | Deterministic DTO builders with literal ids, plus `gameEvents` / `lobbyEvents` envelope factories. |
| `lobby-page-stubs.ts` | Signal-based `LobbyService` / `ChatService` stubs for lobby components. |
| `jsdom-polyfills.ts` | Registered via `setupFiles`. Inert `matchMedia`, `Element.getAnimations`, `scrollIntoView` — none exist in jsdom. |
| `async.ts`, `console.ts` | `flushMicrotasks()` (works under fake timers), `deferred()`, `silenceConsole()`. |

## Conventions
- **AAA comments** per [[rules]] §5: `// Arrange`, `// Act`, `// Assert`, or `// Act & Assert`.
- **Behavioural names**, `describe` per concern. Assert on public signals, sent envelopes,
  toasts, navigation and DOM — never private fields.
- **Real `provideRouter([])`**, then spy on `navigate`. Don't stub the Router.
- **HTTP:** `provideHttpClient()` **before** `provideHttpClientTesting()`, then
  `HttpTestingController.verify()` in `afterEach`.
- **Always restore:** `vi.restoreAllMocks()`, `vi.useRealTimers()`, `vi.unstubAllGlobals()` in
  `afterEach`. The builder runs with `isolate: false`, so leaked globals cross files.

## Zoneless idioms
- `await fixture.whenStable()` after state changes — not `detectChanges()`.
- `TestBed.tick()` flushes effects. `flushEffects` is deprecated.
- Set signal inputs with `fixture.componentRef.setInput(...)`.
- Run `ResolveFn`, `form()` (signal forms), `DumbTimer`, `tweenedNumber` inside
  `TestBed.runInInjectionContext`.
- **Fake timers:** Vitest 4 fakes `requestAnimationFrame`, `performance` *and* `setTimeout` by
  default, which makes `whenStable()` hang. Pass an explicit `toFake`.
  - Component specs driving rxjs `interval` fake only
    `['setInterval', 'clearInterval', 'Date']`.
  - Advance with `await vi.advanceTimersByTimeAsync(ms)`.
- CDK overlays render into the real overlay container in jsdom. Position styles only apply after
  `TestBed.tick()`.

## Gotchas specific to this codebase
- **`GameService` adds a `visibilitychange` listener it never removes.** Its spec spies on
  `document.addEventListener` to capture the handler, so listeners don't accumulate across tests.
- **`WebsocketService` specs** stub the global `WebSocket` (rxjs `webSocket()` uses it). Close
  events must fire in a later task, as in browsers.
- **`EventApi` / `JoinPage`** need a stubbed `EventSource` — jsdom has none.
- **`ToastData` ids** come from a module-level counter; never assert exact ids.
- **`LobbyPage`** needs `provideEnvironmentNgxMask()` (the mask pipe in `LobbyInfoQuick`).

## Known bugs are pinned with `it.fails`
- **No production code changes in a test PR.** A bug the test suite finds becomes:
  1. a test asserting the **correct** behaviour, marked `it.fails`, with a
     `// known-issues: …` comment above it;
  2. a numbered entry in [[known-issues]] (currently 16–25).
- **CI stays green.** When someone fixes the bug, Vitest reports the `it.fails` test as a
  failure ("expected to fail"). Remove `.fails` in the same change and mark the known-issue ✅.
- **Only pin unambiguous bugs.** Undecided behaviour goes in [[known-issues]] #26 without a test.
- **Verify every `it.fails`** fails on its intended assertion: temporarily drop `.fails` or
  patch the bug locally, and never commit the patch.

## CI and Sonar
- **CI:** Frontend CI runs `npm run test:ci` ([[ci-workflows]]).
- **SonarCloud project `beeracademy-frontend`** reads two properties from
  `frontend/sonar-project.properties`:
  - `sonar.javascript.lcov.reportPaths` (coverage)
  - `sonar.testExecutionReportPaths` (test executions)
- **Coverage gating is the Sonar quality gate only.** There is deliberately no threshold in
  `ng test`.
- **Excluded from coverage:** `src/mocks/**`, `src/main.ts`. Generated `src/api-models/**` is
  excluded from analysis entirely.

## Related
- [[known-issues]] — issues 16–26 came from this work
- [[rules]] — §5 test conventions apply to frontend specs too
- [[ci-workflows]] — where `test:ci` runs
- [[runtime-config]] — why services read `ConfigService` / `window.APP_CONFIG`
- [[overlay-exit-animations]] — `OverlayHandle` semantics the helpers preserve
