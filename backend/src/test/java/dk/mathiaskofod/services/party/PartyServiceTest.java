package dk.mathiaskofod.services.party;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import dk.mathiaskofod.api.party.models.PartyDto;
import dk.mathiaskofod.api.party.models.PartyParticipantDto;
import dk.mathiaskofod.domain.game.Game;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.domain.game.player.models.Stats;
import dk.mathiaskofod.services.game.GameService;
import dk.mathiaskofod.services.lobby.LobbyService;
import dk.mathiaskofod.services.lobby.models.Lobby;
import dk.mathiaskofod.services.lobby.models.LobbyParticipant;
import dk.mathiaskofod.services.party.exceptions.PartyNotFoundException;
import dk.mathiaskofod.services.party.models.PartyState;
import dk.mathiaskofod.services.session.repository.Session;
import dk.mathiaskofod.services.session.repository.SessionRegistry;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PartyServiceTest {

    @Mock
    LobbyService lobbyService;

    @Mock
    GameService gameService;

    @Mock
    SessionRegistry sessionRegistry;

    @InjectMocks
    PartyService partyService;

    private static final String PARTY_ID = "123456789";
    private static final String PARTY_NAME = "Beer Party";

    private static Player player(String name, String id) {
        return new Player(name, id, 14, true, new Stats());
    }

    private static LobbyParticipant lobbyParticipant(String name, String id, int position) {
        return new LobbyParticipant(name, "Funny title", id, true, position);
    }

    @Nested
    @DisplayName("Game party")
    class GameParty {

        @DisplayName("A party backed by a game is returned in the GAME state")
        @Test
        void gamePartyIsReturnedInGameState() {

            // Arrange
            Game game = mock(Game.class);
            when(game.getName()).thenReturn(PARTY_NAME);
            when(game.getGameId()).thenReturn(PARTY_ID);
            when(game.getPlayers()).thenReturn(List.of(player("Alice", "alice"), player("Bob", "bob")));

            when(gameService.gameExists(PARTY_ID)).thenReturn(true);
            when(gameService.getGame(PARTY_ID)).thenReturn(game);
            when(sessionRegistry.getSession(anyString())).thenReturn(Optional.empty());

            // Act
            PartyDto party = partyService.getPartyState(PARTY_ID);

            // Assert
            assertEquals(PartyState.GAME, party.partyState());
            assertEquals(PARTY_NAME, party.name());
            assertEquals(PARTY_ID, party.id());
            assertEquals(
                    List.of("Alice", "Bob"),
                    party.participants().stream().map(PartyParticipantDto::name).toList());
            assertEquals(
                    List.of("alice", "bob"),
                    party.participants().stream().map(PartyParticipantDto::id).toList());
        }

        @DisplayName("Participant session state reflects the registered session")
        @Test
        void participantSessionStateIsResolvedPerParticipant() {

            // Arrange
            Game game = mock(Game.class);
            when(game.getPlayers()).thenReturn(List.of(player("Alice", "alice"), player("Bob", "bob")));

            when(gameService.gameExists(PARTY_ID)).thenReturn(true);
            when(gameService.getGame(PARTY_ID)).thenReturn(game);
            when(sessionRegistry.getSession("alice")).thenReturn(Optional.of(new Session("alice", "connection-1")));
            when(sessionRegistry.getSession("bob")).thenReturn(Optional.empty());
            when(sessionRegistry.getSession(PARTY_ID)).thenReturn(Optional.empty());

            // Act
            PartyDto party = partyService.getPartyState(PARTY_ID);

            // Assert
            PartyParticipantDto alice = party.participants().getFirst();
            assertTrue(alice.session().isClaimed(), "Alice has a session, so she is claimed");
            assertTrue(alice.session().isConnected(), "The session for Alice holds a connection id");

            PartyParticipantDto bob = party.participants().get(1);
            assertFalse(bob.session().isClaimed(), "Bob has no session, so he is unclaimed");
            assertFalse(bob.session().isConnected(), "Bob has no session, so he is disconnected");
        }

        @DisplayName("The party session is looked up by party id")
        @Test
        void partySessionIsLookedUpByPartyId() {

            // Arrange
            Game game = mock(Game.class);
            when(game.getPlayers()).thenReturn(List.of());

            when(gameService.gameExists(PARTY_ID)).thenReturn(true);
            when(gameService.getGame(PARTY_ID)).thenReturn(game);
            when(sessionRegistry.getSession(PARTY_ID)).thenReturn(Optional.of(new Session(PARTY_ID)));

            // Act
            PartyDto party = partyService.getPartyState(PARTY_ID);

            // Assert
            assertTrue(party.session().isClaimed(), "A session exists for the party id");
            assertFalse(party.session().isConnected(), "The party session holds no connection id");
        }

        @DisplayName("An empty session is returned when the party has no session")
        @Test
        void emptySessionIsReturnedWhenPartyHasNoSession() {

            // Arrange
            Game game = mock(Game.class);
            when(game.getPlayers()).thenReturn(List.of());

            when(gameService.gameExists(PARTY_ID)).thenReturn(true);
            when(gameService.getGame(PARTY_ID)).thenReturn(game);
            when(sessionRegistry.getSession(PARTY_ID)).thenReturn(Optional.empty());

            // Act
            PartyDto party = partyService.getPartyState(PARTY_ID);

            // Assert
            assertFalse(party.session().isClaimed());
            assertFalse(party.session().isConnected());
        }
    }

    @Nested
    @DisplayName("Lobby party")
    class LobbyParty {

        @DisplayName("A party backed by a lobby is returned in the LOBBY state")
        @Test
        void lobbyPartyIsReturnedInLobbyState() {

            // Arrange
            Lobby lobby = new Lobby(PARTY_NAME, PARTY_ID);
            lobby.addParticipant(lobbyParticipant("Alice", "alice", 0));

            when(gameService.gameExists(PARTY_ID)).thenReturn(false);
            when(lobbyService.lobbyExist(PARTY_ID)).thenReturn(true);
            when(lobbyService.getLobby(PARTY_ID)).thenReturn(lobby);
            when(sessionRegistry.getSession(anyString())).thenReturn(Optional.empty());

            // Act
            PartyDto party = partyService.getPartyState(PARTY_ID);

            // Assert
            assertEquals(PartyState.LOBBY, party.partyState());
            assertEquals(PARTY_NAME, party.name());
            assertEquals(PARTY_ID, party.id());
            assertEquals(
                    List.of("Alice"),
                    party.participants().stream().map(PartyParticipantDto::name).toList());
        }

        @DisplayName("Lobby participants are ordered by position")
        @Test
        void lobbyParticipantsAreOrderedByPosition() {

            // Arrange
            // Lobby.getParticipants() streams a HashMap, so the participants are added out of order on purpose
            Lobby lobby = new Lobby(PARTY_NAME, PARTY_ID);
            lobby.addParticipant(lobbyParticipant("Charlie", "charlie", 2));
            lobby.addParticipant(lobbyParticipant("Alice", "alice", 0));
            lobby.addParticipant(lobbyParticipant("Bob", "bob", 1));

            when(gameService.gameExists(PARTY_ID)).thenReturn(false);
            when(lobbyService.lobbyExist(PARTY_ID)).thenReturn(true);
            when(lobbyService.getLobby(PARTY_ID)).thenReturn(lobby);
            when(sessionRegistry.getSession(anyString())).thenReturn(Optional.empty());

            // Act
            PartyDto party = partyService.getPartyState(PARTY_ID);

            // Assert
            assertEquals(
                    List.of("Alice", "Bob", "Charlie"),
                    party.participants().stream().map(PartyParticipantDto::name).toList());
        }

        @DisplayName("Lobby participant session state reflects the registered session")
        @Test
        void lobbyParticipantSessionStateIsResolvedPerParticipant() {

            // Arrange
            Lobby lobby = new Lobby(PARTY_NAME, PARTY_ID);
            lobby.addParticipant(lobbyParticipant("Alice", "alice", 0));

            when(gameService.gameExists(PARTY_ID)).thenReturn(false);
            when(lobbyService.lobbyExist(PARTY_ID)).thenReturn(true);
            when(lobbyService.getLobby(PARTY_ID)).thenReturn(lobby);
            when(sessionRegistry.getSession("alice")).thenReturn(Optional.of(new Session("alice", "connection-1")));
            when(sessionRegistry.getSession(PARTY_ID)).thenReturn(Optional.of(new Session(PARTY_ID)));

            // Act
            PartyDto party = partyService.getPartyState(PARTY_ID);

            // Assert
            assertTrue(party.participants().getFirst().session().isConnected());
            assertTrue(party.session().isClaimed());
            assertFalse(party.session().isConnected());
        }
    }

    @Nested
    @DisplayName("Precedence and errors")
    class PrecedenceAndErrors {

        @DisplayName("A game takes precedence over a lobby with the same party id")
        @Test
        void gameTakesPrecedenceOverLobby() {

            // Arrange
            Game game = mock(Game.class);
            when(game.getPlayers()).thenReturn(List.of());

            when(gameService.gameExists(PARTY_ID)).thenReturn(true);
            when(gameService.getGame(PARTY_ID)).thenReturn(game);
            when(sessionRegistry.getSession(PARTY_ID)).thenReturn(Optional.empty());

            // Act
            PartyDto party = partyService.getPartyState(PARTY_ID);

            // Assert
            assertEquals(PartyState.GAME, party.partyState());
            verify(lobbyService, never()).lobbyExist(anyString());
            verify(lobbyService, never()).getLobby(anyString());
        }

        @DisplayName("Party not found is thrown when neither a game nor a lobby exists")
        @Test
        void partyNotFoundIsThrownWhenNothingExists() {

            // Arrange
            when(gameService.gameExists(PARTY_ID)).thenReturn(false);
            when(lobbyService.lobbyExist(PARTY_ID)).thenReturn(false);

            // Act & Assert
            PartyNotFoundException exception =
                    assertThrows(PartyNotFoundException.class, () -> partyService.getPartyState(PARTY_ID));

            assertEquals(404, exception.httpStatus);
            assertTrue(exception.getMessage().contains(PARTY_ID), "The message names the party that was not found");
        }
    }
}
