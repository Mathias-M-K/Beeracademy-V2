package dk.mathiaskofod.services.party;

import dk.mathiaskofod.api.party.models.PartyDto;
import dk.mathiaskofod.api.party.models.PartyParticipantDto;
import dk.mathiaskofod.common.dto.session.SessionDto;
import dk.mathiaskofod.domain.game.Game;
import dk.mathiaskofod.services.game.GameService;
import dk.mathiaskofod.services.lobby.LobbyService;
import dk.mathiaskofod.services.lobby.models.Lobby;
import dk.mathiaskofod.services.party.exceptions.PartyNotFoundException;
import dk.mathiaskofod.services.party.models.PartyParticipant;
import dk.mathiaskofod.services.party.models.PartyState;
import dk.mathiaskofod.services.session.repository.SessionRegistry;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

@ApplicationScoped
public class PartyService {

    @Inject
    LobbyService lobbyService;

    @Inject
    GameService gameService;

    @Inject
    SessionRegistry sessionRegistry;

    public PartyDto getPartyState(String partyId) {

        if (gameService.gameExists(partyId)) {
            Game game = gameService.getGame(partyId);
            List<PartyParticipantDto> participants = game.getPlayers().stream()
                    .map(PartyParticipant::fromPlayer)
                    .map(this::createPartyParticipantDto)
                    .toList();

            SessionDto clientSession = sessionRegistry.getSession(partyId)
                    .map(SessionDto::create)
                    .orElse(SessionDto.createEmpty());


            return new PartyDto(PartyState.GAME, game.getName(), game.getGameId(), participants, clientSession);
        }

        if (lobbyService.lobbyExist(partyId)) {
            Lobby lobby = lobbyService.getLobby(partyId);
            List<PartyParticipantDto> participants = lobby.getParticipants().stream()
                    .map(PartyParticipant::fromLobbyParticipant)
                    .map(this::createPartyParticipantDto)
                    .toList();

            SessionDto clientSession = sessionRegistry.getSession(partyId)
                    .map(SessionDto::create)
                    .orElse(SessionDto.createEmpty());

            return new PartyDto(PartyState.LOBBY, lobby.getName(), lobby.getId(), participants, clientSession);
        }

        throw new PartyNotFoundException(partyId);
    }

    private PartyParticipantDto createPartyParticipantDto(PartyParticipant participant){

        SessionDto sessionDto = sessionRegistry.getSession(participant.id())
                .map(SessionDto::create)
                .orElse(SessionDto.createEmpty());

        return  PartyParticipantDto.create(participant, sessionDto);

    }
}
