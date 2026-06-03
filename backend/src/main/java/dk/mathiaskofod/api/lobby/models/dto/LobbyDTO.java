package dk.mathiaskofod.api.lobby.models.dto;

import dk.mathiaskofod.services.lobby.models.Lobby;
import java.util.List;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Schema(description = "Data transfer object representing a game lobby and its participants")
public record LobbyDTO(
        @Schema(description = "The name of the lobby", examples = "My Beer Lobby")
        String name,

        @Schema(description = "The unique 9-character alphanumeric lobby ID", examples = "aB3cD5eF7")
        String id,

        @Schema(description = "The list of participants currently registered in the lobby")
        List<LobbyParticipantDto> participants
) {

    public static LobbyDTO fromLobby(Lobby lobby) {

        List<LobbyParticipantDto> participantDtos = lobby.getParticipants().stream()
                .map(LobbyParticipantDto::fromLobbyParticipant)
                .toList();

        return new LobbyDTO(lobby.getName(), lobby.getId(), participantDtos);
    }
}
