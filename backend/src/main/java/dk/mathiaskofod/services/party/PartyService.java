package dk.mathiaskofod.services.party;

import dk.mathiaskofod.services.game.GameService;
import dk.mathiaskofod.services.lobby.LobbyService;
import dk.mathiaskofod.services.party.exceptions.PartyNotFoundException;
import dk.mathiaskofod.services.party.models.PartyState;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class PartyService {

    @Inject
    LobbyService lobbyService;

    @Inject
    GameService gameService;

    public PartyState getPartyState(String partyId) {

        if(gameService.gameExists(partyId)){
            return  PartyState.GAME;
        }

        if(lobbyService.lobbyExist(partyId)){
            return PartyState.LOBBY;
        }

        throw new PartyNotFoundException(partyId);
    }
}
