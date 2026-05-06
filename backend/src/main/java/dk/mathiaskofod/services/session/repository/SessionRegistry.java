package dk.mathiaskofod.services.session.repository;

import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.value.ValueCommands;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Optional;

@ApplicationScoped
public class SessionRegistry {

    private final ValueCommands<String, Session> sessions;

    private static final String SESSION_CACHE_PREFIX = "SESSION:";

    public SessionRegistry(RedisDataSource redisDataSource) {
        this.sessions = redisDataSource.value(Session.class);
    }

    public void registerSession(Session session) {
        String sessionCacheId = getSessionCacheId(session.getSessionId());
        sessions.set(sessionCacheId, session);
    }

    public Optional<Session> getSession(String sessionId){
        String sessionCacheId = getSessionCacheId(sessionId);
        return Optional.ofNullable(sessions.get(sessionCacheId));
    }

    public void removeSession(String sessionId) {
        String sessionCacheId = getSessionCacheId(sessionId);
        sessions.getdel(sessionCacheId);
    }

    public void setConnectionId(String sessionId, String connectionId) {
        String sessionCacheId = getSessionCacheId(sessionId);
        Session session = getSession(sessionId).orElseThrow();
        session.setConnectionId(connectionId);
        sessions.set(sessionCacheId,session);
    }

    public void clearConnectionId(String sessionId) {
        String sessionCacheId = getSessionCacheId(sessionId);
        getSession(sessionId).ifPresent(session -> {
            session.clearConnectionId();
            sessions.set(sessionCacheId, session);
        });
    }

    private String getSessionCacheId(String sessionId){
        return SESSION_CACHE_PREFIX + sessionId;
    }

}
