package dk.mathiaskofod.services.player.models.action;

import java.util.Map;

public record PlayerAction(PlayerActionType type, Map<PlayerDataType, Long> data) {


}
