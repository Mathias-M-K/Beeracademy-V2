package dk.mathiaskofod.services.session.repository;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.is;

import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class SessionTest {

    @Test
    @DisplayName("Session is added with empty connectionId")
    void addSessionWithEmptyConnectionId() {

        // Arrange
        String sessionId = "123";

        // Act
        Session session = new Session(sessionId);

        // Assert
        assertThat(session.getConnectionId(), is(Optional.empty()));
    }

    @Test
    @DisplayName("Newly created session is not connected")
    void newlyCreatedSessionIsNotConnected() {

        // Arrange
        String sessionId = "123";

        // Act
        Session session = new Session(sessionId);

        // Assert
        assertThat(session.isConnected(), is(false));
    }

    @Test
    @DisplayName("Session is connected when connectionId is set")
    void sessionIsConnectedWhenConnectionIdIsSet() {

        // Arrange
        String sessionId = "123";
        Session session = new Session(sessionId);

        // Act
        session.setConnectionId("321");

        // Assert
        assertThat(session.isConnected(), is(true));
    }

    @Test
    @DisplayName("Session is disconnected when connectionId is cleared")
    void sessionIsDisconnectedWhenConnectionIdIsCleared() {

        // Arrange
        String sessionId = "123";
        Session session = new Session(sessionId);

        // Act
        session.setConnectionId("321");

        // Assert
        assertThat(session.isConnected(), is(true));

        // Act
        session.clearConnectionId();

        // Assert
        assertThat(session.isConnected(), is(false));
    }
}
