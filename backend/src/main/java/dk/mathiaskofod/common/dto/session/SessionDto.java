package dk.mathiaskofod.common.dto.session;

import dk.mathiaskofod.services.session.models.Session;

public record SessionDto(boolean isClaimed, boolean isConnected) {

    public static SessionDto create(Session session) {
        return new SessionDto(
                session != null,
                session != null && session.isConnected()
        );
    }

    public static SessionDto createEmpty() {
        return create(null);
    }
}
