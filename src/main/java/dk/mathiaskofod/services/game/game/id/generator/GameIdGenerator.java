package dk.mathiaskofod.services.game.game.id.generator;

import dk.mathiaskofod.services.game.game.id.generator.models.GameId;

import java.security.SecureRandom;
import java.util.stream.Collectors;

public class GameIdGenerator {

    private static final String ALPHANUMERIC_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom random = new SecureRandom();
    private static final int ID_LENGTH = 9;

    public static GameId generateId() {
        String id = random.ints(ID_LENGTH, 0, ALPHANUMERIC_CHARS.length())
                .mapToObj(ALPHANUMERIC_CHARS::charAt)
                .map(Object::toString)
                .collect(Collectors.joining());

        return new GameId(id);
    }
}
