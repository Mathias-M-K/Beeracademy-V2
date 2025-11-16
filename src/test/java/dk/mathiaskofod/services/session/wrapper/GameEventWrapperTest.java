package dk.mathiaskofod.services.session.wrapper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import dk.mathiaskofod.domain.game.deck.models.Card;
import dk.mathiaskofod.domain.game.deck.models.Suit;
import dk.mathiaskofod.services.session.models.events.game.ChugGameEventDto;
import dk.mathiaskofod.services.session.models.events.game.EndOfTurnGameEventDto;
import dk.mathiaskofod.services.session.models.wrapper.GameEventWrapper;
import org.junit.jupiter.api.Test;

class GameEventWrapperTest {


    @Test
    void testGetEventCategory() throws JsonProcessingException {
        EndOfTurnGameEventDto dto = new EndOfTurnGameEventDto(1,0,new Card(Suit.club,5),"1","2","3");
        ChugGameEventDto chugDto = new ChugGameEventDto(Suit.heart, 5000L, "player1", null);
        GameEventWrapper wrapper = new GameEventWrapper(dto);


        ObjectMapper objectMapper = new ObjectMapper();

        System.out.println(objectMapper.writeValueAsString(wrapper));
    }
}