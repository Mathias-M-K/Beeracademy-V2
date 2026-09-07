package dk.mathiaskofod.services.session.repository;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertThrows;

import dk.mathiaskofod.services.session.exceptions.SessionConnectedException;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@QuarkusTest
class SessionRegistryTest {

    private final String sessionId = "123";

    @Inject
    SessionRegistry sessionRegistry;

    @AfterEach
    void tearDown() {
        sessionRegistry.removeSession(sessionId);
    }

    @Test
    @DisplayName("CacheId is sessionId with 'SESSION:' prefix")
    void sessionPrefix() {

        // Arrange
        String cachePrefix = "SESSION:";
        String expectedSessionId = cachePrefix + sessionId;

        // Act
        String sessionCacheId = sessionRegistry.getSessionCacheId(sessionId);

        // Arrange
        assertThat(sessionCacheId, is(expectedSessionId));
    }

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

    @Test
    @DisplayName("If session isn't added, it can't be retrieved (duuh)")
    void retrievingNonExistentSession() {

        // Arrange
        // Act
        Optional<Session> session = sessionRegistry.getSession(sessionId);

        // Assert
        assertThat(session.isPresent(), is(false));
    }

    @Test
    @DisplayName("ConnectionId is added")
    void addConnection() {

        // Arrange
        Session session = new Session(sessionId);
        sessionRegistry.registerSession(session);

        String connectionId = "456";

        // Assert - No connection ID
        Session sessionWithNoConnectionId = getSessionAndAssertExists(sessionId);
        assertThat(sessionWithNoConnectionId.getConnectionId().isPresent(), is(false));

        // Act
        sessionRegistry.setConnectionId(sessionId, connectionId);
        Session sessionWithConnectionId = getSessionAndAssertExists(sessionId);

        // Assert
        assertThat(sessionWithConnectionId.getConnectionId().isPresent(), is(true));
        assertThat(sessionWithConnectionId.getConnectionId().get(), is(connectionId));
    }

    @Test
    @DisplayName("Can't set connectionId for session that already have a connectionId")
    void connectionIdAlreadyExists() {

        // Arrange
        Session session = new Session(sessionId);
        sessionRegistry.registerSession(session);
        String connectionId = "456";

        sessionRegistry.setConnectionId(sessionId, connectionId);

        // Act - Assert
        assertThrows(SessionConnectedException.class, () -> sessionRegistry.setConnectionId(sessionId, "789"));
    }

    @Test
    @DisplayName("Clearing connectionId")
    void clearConnectionId() {

        // Arrange
        Session session = new Session(sessionId);
        sessionRegistry.registerSession(session);

        String connectionId = "456";

        // Act
        sessionRegistry.setConnectionId(sessionId, connectionId);

        // Assert
        assertThat(getSessionAndAssertExists(sessionId).getConnectionId().isPresent(), is(true));

        // Act
        sessionRegistry.clearConnectionId(sessionId);

        // Assert
        assertThat(getSessionAndAssertExists(sessionId).getConnectionId().isPresent(), is(false));
    }

    private Session getSessionAndAssertExists(String sessionId) {
        return sessionRegistry.getSession(sessionId).orElseThrow(() -> new AssertionError("Session not found"));
    }
}
