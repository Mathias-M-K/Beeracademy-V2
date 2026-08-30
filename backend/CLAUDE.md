# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Vault (Persistent Memory)

A persistent knowledge vault is available via the `obsidian` MCP server
(HTTP, `http://127.0.0.1:27200/mcp`). It talks to a **running Obsidian instance**, so the
tools only work while Obsidian is open — if calls fail, check that first, and reconnect the
MCP server (`/mcp`) before giving up.

**The MCP server is the only way to reach the vault.** There is no filesystem fallback: do
not go looking for the vault on disk or read it as plain markdown. If the MCP tools are
unreachable, say so instead of guessing at a location.

The server is **per developer machine**, not shared infrastructure. `.obsidian/.obsidian/`
is gitignored, so a fresh clone has the notes but no plugin, no token, and no working MCP
server until that developer installs Obsidian, installs the MCP Connector plugin from the
community browser, generates their own bearer token, and registers it in `~/.claude.json`.
That is documented in `.obsidian/SETUP.md` at the repo root — point new developers there.

Useful tools beyond plain file CRUD: `get_vault_overview` (one-call situational snapshot),
`search_vault_smart`, `get_backlinks` / `get_outgoing_links`, `get_vault_file_partial`,
`find_broken_links`.

### When to consult the vault

- **At session start**: Read `rules.md` and `known-issues.md` (vault root), plus
  `context/project-beeracademy.md` and `dead-ends/_index.md`, before making any
  architectural suggestions. `get_vault_overview` is the cheapest way to orient first.
- **Before suggesting an approach**: Check `patterns/` for established conventions and
  `dead-ends/` to avoid repeating discarded solutions.
- **When referencing a past decision**: Check `decisions/` for the recorded rationale.

**`rules.md` outranks this file.** It carries the codebase's conventions with a runnable
check per rule, and it is maintained more actively than CLAUDE.md. Where the two disagree,
`rules.md` wins — and fix the drift here.

### When to write to the vault

- A pattern has been established or refined → update or create a file in `patterns/`
- An approach was tried and rejected → append to `dead-ends/_index.md` and create a detail file in `dead-ends/`
- A significant architectural decision was made → create a new ADR in `decisions/` using `decisions/_template.md`
- Project state has materially changed → update `context/project-beeracademy.md`

### Rules

- Never ask for permission to read the vault — just do it.
- Never ask for permission to **create or update** notes in `patterns/`, `decisions/`,
  `dead-ends/`, `context/`, or `scratch/` — record them as they emerge.
- **Deleting is not covered by the above.** `delete_vault_file`, `delete_vault_directory`,
  and whole-vault `search_and_replace` need explicit confirmation first. So does rewriting
  `rules.md` or `known-issues.md` wholesale — append or patch those instead.
- Keep notes terse and factual. No prose padding.
- Prefer updating existing files over creating new ones unless the topic is genuinely new.
- The `scratch/` folder is disposable — use it freely for working notes.
- When referencing another vault note, use [[wiki links]] so the graph stays navigable.
- Obsidian-side effects (`execute_obsidian_command`, `show_file_in_obsidian`) change what
  the user is looking at — don't fire them unasked.

## Project Overview

This is a **Quarkus-based Java backend** for a multiplayer online card game called "Beeracademy". The game is played over WebSockets with real-time multiplayer functionality.

### Technology Stack

- **Framework**: Quarkus (Supersonic Subatomic Java Framework)
- **Build Tool**: Gradle
- **Java Version**: 21
- **WebSocket**: Quarkus WebSockets Next
- **Authentication**: JWT (JSON Web Tokens) with MicroProfile JWT
- **OpenAPI**: SmallRye OpenAPI
- **Testing**: JUnit 5, REST Assured, Mockito
- **Code Coverage**: JaCoCo
- **Security**: SonarQube integration

### Package Structure

```
src/main/java/dk/mathiaskofod/
├── api/                    # REST API endpoints
│   ├── auth/              # Authentication endpoints
│   ├── game/              # Game-related endpoints
│   └── ping/              # Health check endpoints
├── common/                # Shared DTOs and utilities
│   ├── dto/               # Data Transfer Objects
├── domain/                # Pure domain models (no infrastructure dependencies)
│   ├── game/
│   │   ├── deck/         # Card deck logic
│   │   ├── events/       # Domain events
│   │   ├── exceptions/   # Domain exceptions
│   │   ├── models/       # Game state models
│   │   ├── player/       # Player domain model
│   │   ├── reports/      # Game reports
│   │   └── timer/        # Timer logic
│   └── Game.java         # Game aggregate root (interface)
├── providers/             # Cross-cutting concerns
│   ├── exceptions/       # Exception mappers
│   └── loggers/          # Custom loggers
├── services/              # Business logic layer
│   ├── auth/             # JWT token generation/validation
│   ├── game/             # Game business logic
│   ├── lobby/            # Game lobby management
│   └── session/          # WebSocket session management
└── websocket/            # WebSocket handlers
    ├── GameWebsocket.java
    └── WebsocketSessionManager.java
```

## Build & Development Commands

### API's
You can fetch the latest API documentation from openApi, either using mcp tool or at /q/swagger-ui/

### Running the Application

```bash
# Dev mode with live coding
./gradlew quarkusDev

# Production build
./gradlew build

# Build uber-jar
./gradlew build -Dquarkus.package.jar.type=uber-jar

# Build legacy-jar (for Docker)
./gradlew build -Dquarkus.package.jar.type=legacy-jar

# Build native executable (requires GraalVM)
./gradlew build -Dquarkus.native.enabled=true
```

### Testing

```bash
# Run all tests
./gradlew test

# Run tests with code coverage
./gradlew jacocoTestReport

# Run a specific test class
./gradlew test --tests "dk.mathiaskofod.domain.game.deck.DeckTest"

# Run tests with coverage report
./gradlew clean test jacocoTestReport

# View coverage report
open build/reports/jacoco/test/index.html
```

### Docker

```bash
# Build Docker image (JVM mode)
docker build -f src/main/docker/Dockerfile.jvm -t beeracademy-backend-jvm .

# Build Docker image (native mode)
./gradlew build -Dquarkus.native.enabled=true
docker build -f src/main/docker/Dockerfile.native -t beeracademy-backend .

# Build Docker image (legacy jar)
./gradlew build -Dquarkus.package.jar.type=legacy-jar
docker build -f src/main/docker/Dockerfile.legacy-jar -t beeracademy-backend-legacy .
```

### Deployment

```bash
# Full deployment pipeline
./gradlew manual_deploy

# Individual deployment steps
./gradlew dockerBuild
./gradlew dockerPush
kubectl apply -f ../deployment/backend
```

## Architecture Overview

### Game Flow

1. **Game Creation**: Client creates a game via REST API (`/api/games`)
2. **Session Claiming**: Game client claims the game, player claims their session
3. **WebSocket Connection**: Clients connect via `/ws/game` endpoint
4. **Game State Management**: Games and sessions are persisted to Redis; lobbies are still in-memory
5. **Real-time Updates**: All players receive WebSocket broadcasts on state changes

### WebSocket Architecture

The WebSocket system uses a **session manager pattern** with two types of managers:

1. **GameClientSessionManager**: Manages the game host/client connection
   - Can start/end/pause/resume game
   - Draws cards for the game
   - Registers chugs

2. **PlayerClientSessionManager**: Manages individual player connections
   - Receives draw card actions from current player
   - Broadcasts player events to all clients

Both managers extend `AbstractSessionManager` and implement the `WebsocketSessionManager` interface.

### Authentication Flow

1. JWT tokens are generated by `AuthService`
2. Tokens are returned as cookies (not headers)
3. Tokens expire after 5 hours
4. Public/private keys are loaded from `src/main/resources/`

### Domain Events

The game uses an event-driven architecture:

- `GameEventEmitter` interface for event publishing
- `GameEventEmitterImpl` implementation
- Events: `StartGameEvent`, `EndGameEvent`, `DrawCardEvent`, `ChugEvent`, etc.
- Events are broadcast to all connected WebSocket clients

### Game State

The `Game` interface defines the game aggregate with methods:
- `startGame()`, `endGame()`, `pauseGame()`, `resumeGame()`
- `drawCard()` - advances turn, handles chug cards
- `registerChug()` - handles chug card response
- `getGameTimer()`, `getPlayerTimer()` - timer management

## Key Files

### API Endpoints
- `src/main/java/dk/mathiaskofod/api/game/GameApi.java` - Game CRUD operations
- `src/main/java/dk/mathiaskofod/api/ping/PingApi.java` - Health check
- `src/main/java/dk/mathiaskofod/api/auth/ApiAuth.java` - Authentication test

### Services
- `src/main/java/dk/mathiaskofod/services/game/GameService.java` - Game business logic
- `src/main/java/dk/mathiaskofod/services/lobby/LobbyService.java` - Lobby management
- `src/main/java/dk/mathiaskofod/services/auth/AuthService.java` - JWT token generation

### WebSocket
- `src/main/java/dk/mathiaskofod/websocket/GameWebsocket.java` - WebSocket handler
- `src/main/java/dk/mathiaskofod/services/session/GameClientSessionManager.java` - Game client session
- `src/main/java/dk/mathiaskofod/services/session/PlayerClientSessionManager.java` - Player session

### Domain Models
- `src/main/java/dk/mathiaskofod/domain/game/Game.java` - Game interface
- `src/main/java/dk/mathiaskofod/domain/game/GameImpl.java` - Game implementation
- `src/main/java/dk/mathiaskofod/domain/game/Deck.java` - Card deck logic
- `src/main/java/dk/mathiaskofod/domain/game/player/Player.java` - Player model

## Configuration

### application.properties
Located at `src/main/resources/application.properties`

### Environment Variables for Docker
- `JAVA_OPTS` - JVM options
- `JAVA_OPTS_APPEND` - Additional Java options
- `JAVA_DEBUG` - Enable remote debugging
- `JAVA_DEBUG_PORT` - Debug port (default: 5005)

## Testing Strategy

- Unit tests in `src/test/java/`
- Tests use JUnit 5 with Mockito
- REST Assured for API testing
- JaCoCo for code coverage
- Tests run with logging enabled

### Running Specific Tests

```bash
# Run all tests
./gradlew test

# Run specific test class
./gradlew test --tests "*DeckTest"

# Run with coverage
./gradlew clean test jacocoTestReport
```

## Common Development Tasks

### Adding a New Game Event

1. Create event class in `domain/game/events/`
2. Implement in `domain/game/events/emitter/`
3. Add to `GameEventEmitter` interface
4. Handle in session managers

### Adding a New WebSocket Action

1. Create action envelope in `services/session/envelopes/`
2. Add action case in session manager's `onMessage()`
3. Implement action logic

### Adding a New API Endpoint

1. Create request/response DTOs in `common/dto/` or `api/*/models/`
2. Create endpoint in `api/` package
3. Add OpenAPI annotations
4. Test with Swagger UI at `/q/openapi`

## Important Notes

- **Redis-backed state (mostly)**: Game snapshots (`GameService`) and sessions
  (`SessionRegistry`) are Redis-backed and survive restarts; `LobbyRepository` is still an
  in-memory `HashMap`, so lobbies are single-instance and vanish on restart. Do not assume
  symmetry between them. See vault `rules.md` §6 and `decisions/redis-state-store.md` —
  which supersedes the older "no database" ADR.
- **Renaming a persisted field is a migration**: `GameSnapshot` is stored as JSON; changing
  a component name breaks in-flight games on deploy.
- **WebSocket Required**: All game interactions require WebSocket connection
- **JWT in Cookies**: Tokens are returned as cookies, not headers
- **CORS**: Enabled in dev mode, configured for specific origins
- **OpenAPI**: Always included, available at `http://localhost:8080/q/openapi?format=json`
- **Logging**: JSON logging enabled by default, configurable format

## Security Considerations

- JWT tokens with public/private key verification
- CORS configured per environment
- HTTP-only cookies in production
- Secure cookies in production, HTTP-only in dev

## Code Style

- Uses Lombok for boilerplate reduction
- Project Lombok annotation processor included
- SLF4J for logging
- Jakarta EE 10+ (Jakarta namespace, not Java EE)

### Test Style

- Tests follow the **AAA (Arrange, Act, Assert)** pattern with explicit section comments in every test method: `// Arrange`, `// Act`, `// Assert`.
- For tests that only assert an exception, combine the final two into `// Act & Assert` (used with `assertThrows`).
- Put a blank line between each section; the comment sits on its own line above the section. Mirror existing `*Test.java` files (e.g. `GameClientSessionManagerTest`, `GameServiceTest`).

## MCP Server: Quarkus Dev

The Quarkus MCP server provides access to the running Quarkus Dev Mode application at `http://localhost:8080/q/dev-mcp`.

### Available MCP Resources

- **Configurations**: View and update Quarkus application configurations
  - `quarkus-dev://configurations/all` - Get all configuration values
  - `quarkus-dev://configurations/update` - Update a configuration property

- **DevServices**: Manage Quarkus DevServices
  - `quarkus-dev://devservices/status` - Get DevServices status
  - `quarkus-dev://devservices/logs` - View log streams
  - `quarkus-dev://devservices/restart` - Force application restart

- **Endpoints**: View exposed endpoints
  - `quarkus-dev://endpoints/all` - List all application endpoints

- **OpenAPI**: Access the OpenAPI schema
  - `quarkus-dev://openapi/schema` - Get OpenAPI schema document

- **Continuous Testing**: Run tests in Dev Mode
  - `quarkus-dev://continuous-testing/status` - Get test status
  - `quarkus-dev://continuous-testing/run` - Run all tests
  - `quarkus-dev://continuous-testing/results` - Get test results

- **Workspace**: Access workspace items
  - `quarkus-dev://workspace/items` - List workspace items
  - `quarkus-dev://workspace/content/{path}` - Get workspace item content

### Usage Examples

```bash
# View all configuration values
mcp quarkus-dev configurations/all

# Update a configuration property
mcp quarkus-dev configurations/update name=my.property value=new-value profile=default target=application.properties

# Check DevServices status
mcp quarkus-dev devservices/status

# View logs for a specific logger
mcp quarkus-dev logstream/getLogger loggerName=io.quarkus

# Restart the application
mcp quarkus-dev logstream/forceRestart

# Run all tests
mcp quarkus-dev continuous-testing/runAll

# Get OpenAPI schema
mcp quarkus-dev quarkus-smallrye-openapi/getOpenAPISchema
```

### Workspace Operations

The workspace MCP tools allow you to read and write files in the project:

- **List workspace items**: `quarkus-dev://workspace/items`
- **Read workspace item**: `quarkus-dev://workspace/content/{path}`
- **Write workspace item**: `quarkus-dev://workspace/saveWorkspaceItemContent`

These tools provide an alternative to reading files directly and are useful for Dev Mode operations.