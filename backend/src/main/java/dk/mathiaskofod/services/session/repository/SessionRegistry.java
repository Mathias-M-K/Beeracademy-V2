package dk.mathiaskofod.services.session.repository;

import dk.mathiaskofod.services.session.exceptions.SessionAlreadyConnectedException;
import dk.mathiaskofod.services.session.exceptions.SessionNotFoundException;
import dk.mathiaskofod.services.session.exceptions.SessionStateException;
import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.keys.KeyCommands;
import io.quarkus.redis.datasource.transactions.OptimisticLockingTransactionResult;
import io.quarkus.redis.datasource.value.ValueCommands;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@ApplicationScoped
public class SessionRegistry {

    private final RedisDataSource redisDataSource;
    private final ValueCommands<String, Session> sessions;
    private final KeyCommands<String> keys;

    private static final String SESSION_CACHE_PREFIX = "SESSION:";
    private static final int SET_CONNECTION_MAX_RETRIES = 3;

    public SessionRegistry(RedisDataSource redisDataSource) {
        this.redisDataSource = redisDataSource;
        this.sessions = redisDataSource.value(Session.class);
        this.keys = redisDataSource.key();
    }

    public void registerSession(Session session) {
        String sessionCacheId = getSessionCacheId(session.getSessionId());
        sessions.set(sessionCacheId, session);
    }

    public Optional<Session> getSession(String sessionId) {
        String sessionCacheId = getSessionCacheId(sessionId);
        return Optional.ofNullable(sessions.get(sessionCacheId));
    }

    public void removeSession(String sessionId) {
        String sessionCacheId = getSessionCacheId(sessionId);
        keys.del(sessionCacheId);
    }

    /**
     * Claims the WebSocket connection slot for a session If the key is modified by a concurrent writer between the
     * pre-block read and EXEC, the transaction is aborted and retried. Only sets the connectionId if the session is not
     * already connected.
     *
     * @throws SessionNotFoundException if the session does not exist
     * @throws SessionStateException if the transaction keeps failing after retries
     */
    public void setConnectionId(String sessionId, String connectionId) {
        String sessionCacheId = getSessionCacheId(sessionId);

        for (int attempt = 0; attempt < SET_CONNECTION_MAX_RETRIES; attempt++) {

            OptimisticLockingTransactionResult<Session> transactionResult = redisDataSource.withTransaction(
                    ds -> Optional.ofNullable(ds.value(Session.class).get(sessionCacheId))
                            .orElseThrow(() -> new SessionNotFoundException(sessionId)),
                    (session, tx) -> {
                        if (session.isConnected()) {
                            throw new SessionAlreadyConnectedException(sessionId);
                        }
                        session.setConnectionId(connectionId);
                        tx.value(Session.class).set(sessionCacheId, session);
                    },
                    sessionCacheId);

            if (transactionResult.discarded()) {
                log.warn(
                        "Aborted setConnectionId operation due to concurrent write on session {}. Retrying... (attempt {})",
                        sessionId,
                        attempt + 1);
                continue;
            }

            return;
        }

        throw new SessionStateException("Failed to atomically claim connection for session " + sessionId + " after "
                + SET_CONNECTION_MAX_RETRIES + " attempts");
    }

    public void clearConnectionId(String sessionId) {
        String sessionCacheId = getSessionCacheId(sessionId);
        getSession(sessionId).ifPresent(session -> {
            session.clearConnectionId();
            sessions.set(sessionCacheId, session);
        });
    }

    String getSessionCacheId(String sessionId) {
        return SESSION_CACHE_PREFIX + sessionId;
    }
}
