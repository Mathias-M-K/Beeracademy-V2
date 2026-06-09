package dk.mathiaskofod.services.auth.models;

import dk.mathiaskofod.services.auth.exceptions.RoleNotFoundException;
import org.eclipse.microprofile.jwt.JsonWebToken;

public enum Role {
    GAME_CLIENT,
    PLAYER_CLIENT;

    public static Role fromJsonWebToken(JsonWebToken jwt) {
        if (jwt.getGroups().contains(Role.GAME_CLIENT.toString())) {
            return Role.GAME_CLIENT;
        }

        if (jwt.getGroups().contains(Role.PLAYER_CLIENT.toString())) {
            return Role.PLAYER_CLIENT;
        }

        throw new RoleNotFoundException();
    }
}
