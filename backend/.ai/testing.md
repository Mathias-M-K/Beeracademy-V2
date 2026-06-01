# Beeracademy Backend Testing Guide

This guide describes the testing strategy, coding style, best practices, and crucial patterns for writing tests in the Beeracademy Quarkus backend. Follow these guidelines to maintain a robust, readable, and highly maintainable test suite.

---

## 1. Test Architecture

We write two primary categories of tests in this repository:

### A. Isolated Unit Tests (`@ExtendWith(MockitoExtension.class)`)
* **When to use**: Pure domain logic (like `DeckTest`, `TimerTest`, `PlayerReportTest`) and business services with mocked infrastructure.
* **Characteristics**: Fast, lightweight, zero Quarkus CDI container startup overhead. Fully uses Mockito for stubbing and verification.

### B. Integration & Container-Aware Tests (`@QuarkusTest`)
* **When to use**: Component verification, repository layers involving cache/storage (like `SessionRegistryTest`), WebSocket handlers, and REST API endpoints.
* **Characteristics**: Starts the Quarkus CDI container. Uses real or container-mocked injection (`@Inject`, `@InjectMock`).

---

## 2. Best Practices & Style Guidelines

Every test class should adhere to the following code style:

### AAA (Arrange-Act-Assert) Pattern
Always structure test methods with explicit comments separating the three phases. It keeps tests readable and structured:
```java
@Test
@DisplayName("Session can be added")
void addSession() {
    // Arrange
    Session session = new Session(sessionId);
    sessionRegistry.registerSession(session);

    // Act
    Session returnedSession = getSessionAndAssertExists(sessionId);

    // Assert
    assertThat(returnedSession.getSessionId(), is(sessionId));
}
```

### Hamcrest for Assertions
We prefer **Hamcrest matchers** over standard JUnit assertions for readability, using `assertThat(actual, is(expected))`:
* **Do**: `assertThat(deck.unusedCards.size(), is(52));`
* **Avoid**: `assertEquals(52, deck.unusedCards.size());`

### Expressive Naming with `@DisplayName`
Use descriptive sentences in `@DisplayName` for human-readable test reports. Keep method names in camelCase describing the behavior:
```java
@Test
@DisplayName("Can't draw card if no cards are available")
void cantDrawCardsIfNoCardsAreAvailable() { ... }
```

### Parameterized Tests
Use `@ParameterizedTest` with `@CsvSource` to run the same test scenario against multiple inputs:
```java
@ParameterizedTest(name = "Deck with {0} suits should have {1} cards")
@CsvSource({
    "1, 13", 
    "2, 26", 
    "4, 52"
})
@DisplayName("Should create a snapshot of the deck with the correct number of cards")
void correctNrOfCardsAreCreated(int nrOfSuits, int expectedCards) { ... }
```

---

## 3. Advanced Patterns & Critical Pitfalls

### ⚠️ The Mixed Injection Race Condition (Mockito `@InjectMocks`)
When a service uses **both constructor injection AND field injection** (e.g., Quarkus `@Inject`), Mockito's automatic `@InjectMocks` annotation can run into a race condition.

#### The Problem:
If the service constructor *actively calls methods on its constructor arguments* during instantiation (e.g. `gameSnapshots = redisDataSource.value(...)`):
```java
public GameService(RedisDataSource redisDataSource) {
    // Actively calls dependency method during instantiation!
    gameSnapshots = redisDataSource.value(GameSnapshot.class);
}
```
Using `@InjectMocks` directly on `GameService` will fail. Mockito attempts to invoke the constructor *before* any `@BeforeEach setUp()` block runs. Consequently:
1. The constructor executes.
2. The stub for `redisDataSource.value(...)` has not been registered yet.
3. It returns `null`, causing dependent fields inside the service to be initialized as `null`.

#### The Solution (Manual Instantiation & Wire):
Do not use `@InjectMocks` when a constructor performs active initialization. Instead:
1. Define class-level `@Mock` fields.
2. Register stubs in `@BeforeEach`.
3. Manually call the constructor.
4. Manually assign any package-private (field-injected) dependencies.

```java
@ExtendWith(MockitoExtension.class)
class GameServiceTest {

    @Mock
    GameEventEmitterImpl gameEventEmitterImpl; // Field-injected mock

    @Mock
    RedisDataSource redisDataSource;           // Constructor-injected mock

    @Mock
    ValueCommands<String, GameSnapshot> gameSnapshots;

    // NO @InjectMocks here!
    GameService gameService;

    @BeforeEach
    void setUp() {
        // 1. Register the stub BEFORE the constructor is called
        when(redisDataSource.value(GameSnapshot.class)).thenReturn(gameSnapshots);
        
        // 2. Call the constructor manually (will successfully resolve the stub!)
        gameService = new GameService(redisDataSource);
        
        // 3. Manually assign the package-private field-injected dependency
        gameService.gameEventEmitterImpl = gameEventEmitterImpl;
    }
}
```

---

## 4. Useful Gradle Commands

```bash
# Run all tests
./gradlew test

# Run a specific test class
./gradlew test --tests "dk.mathiaskofod.services.game.GameServiceTest"

# Run tests and generate JaCoCo coverage reports
./gradlew clean test jacocoTestReport
```
