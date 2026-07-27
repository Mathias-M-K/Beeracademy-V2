package dk.mathiaskofod.services.session.actions.lobby.common;

import dk.mathiaskofod.services.session.actions.lobby.client.LobbyClientAction;
import dk.mathiaskofod.services.session.actions.lobby.participant.LobbyParticipantAction;
import dk.mathiaskofod.services.session.models.annotations.ActionType;
import java.util.Optional;
import lombok.Getter;
import lombok.experimental.Accessors;

@ActionType("UPDATE_SETTINGS")
public class UpdateSettingsAction implements LobbyClientAction, LobbyParticipantAction {

    private final String behalfOf;

    @Getter
    private final int sipsInABeer;

    @Getter
    @Accessors(fluent = true)
    private final boolean canDrawAce;

    public UpdateSettingsAction(String behalfOf, int sipsInABeer, boolean canDrawAce) {
        this.behalfOf = behalfOf;
        this.sipsInABeer = sipsInABeer;
        this.canDrawAce = canDrawAce;
    }

    public Optional<String> getBehalfOf() {
        return Optional.ofNullable(behalfOf);
    }
}
