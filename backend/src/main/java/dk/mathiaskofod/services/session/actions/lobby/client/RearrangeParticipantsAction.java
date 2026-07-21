package dk.mathiaskofod.services.session.actions.lobby.client;

import dk.mathiaskofod.services.session.models.annotations.ActionType;
import java.util.List;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

@ActionType("REARRANGE_PARTICIPANTS")
public record RearrangeParticipantsAction(List<ParticipantPosition> positions) implements LobbyClientAction {

    @Schema()
    public record ParticipantPosition(String participantId, int newPosition) {}
}
