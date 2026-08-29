package dk.mathiaskofod.services.party.models;

import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.services.lobby.models.LobbyParticipant;

public record PartyParticipant(String name, String id) {

    public static PartyParticipant fromPlayer(Player player) {
        return new PartyParticipant(player.name(),player.id());
    }

    public static PartyParticipant fromLobbyParticipant(LobbyParticipant lobbyParticipant) {
        return new PartyParticipant(lobbyParticipant.getName(),lobbyParticipant.getId());
    }
}
