package dk.mathiaskofod.services.auth.models;

import dk.mathiaskofod.providers.exceptions.BaseException;
import io.quarkus.security.identity.SecurityIdentity;

public enum Role {
    GAME_CLIENT,
    PLAYER_CLIENT;

    public static Role getRoleFromSecurityIdentity(SecurityIdentity securityIdentity) {

        if(securityIdentity.hasRole(GAME_CLIENT.toString())) {
            return GAME_CLIENT;
        }

        if (securityIdentity.hasRole(PLAYER_CLIENT.toString())) {
            return PLAYER_CLIENT;
        }

        throw new BaseException("Role not found",500);
    }
}
