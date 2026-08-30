
You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain
- Use the strictest possible access modifier on every class member. Default to `private`; use `protected` only when a subclass or the component's own template needs access; use `public` only when the member is genuinely part of the class's external API. Never leave a member public by omission — choose the modifier deliberately.
  - Members referenced in a component's template MUST be at least `protected` (`private` members are not accessible from templates under strict template type checking).

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.
- Do not write arrow functions in templates (they are not supported).

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

## Local Development

```bash
npm start           # dev server against the real backend on localhost:8080
npm run start:mock  # dev server against the Insomnia mockbin server on localhost:9080
```

The backend URL is **not** compiled into the bundle. `src/main.ts` fetches `/config.json`
before `bootstrapApplication` and parks it on `window.APP_CONFIG`; `ConfigService` is the
only reader. Which file lands at `/config.json` is decided by the `assets` array of the
active `angular.json` build configuration — `public/config.json` normally,
`public/mock/config.json` under `mock`. In production the container entrypoint rewrites it
from the `API_URL` env var.

Do not add `environment.ts` files or `fileReplacements`: the URL is runtime config by
design, so one image runs in every environment. `npm run start:mock` needs the mock server
up (`docker compose -f .insomnia/mock-server.yaml up -d`) and covers REST only — no
websockets, and credentialed endpoints fail CORS.
