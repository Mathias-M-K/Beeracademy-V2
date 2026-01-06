package dk.mathiaskofod.services.game.id.generator;

import java.security.SecureRandom;
import java.util.UUID;
import java.util.stream.Collectors;

public class IdGenerator {

    private static final String ALPHANUMERIC_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom random = new SecureRandom();
    private static final int GAME_ID_LENGTH = 9;

    private static String generateId(int length) {
        return random.ints(length, 0, ALPHANUMERIC_CHARS.length())
                .mapToObj(ALPHANUMERIC_CHARS::charAt)
                .map(Object::toString)
                .collect(Collectors.joining());

    }

    private static String generateUUID() {
        return UUID.randomUUID().toString();
    }

    public static String generateCorrelationId() {
        return generateUUID();
    }

    public static String generatePlayerId() {
        return generateUUID();
    }

    //TODO can we do some refactoring?
    public static String generateGameId() {
        return generateId(GAME_ID_LENGTH);
    }


}
