import {GameEvent} from '../game-event';
import {GameDto} from '../../../../../../../api-models/model/gameDto';

export interface GameStateEvent extends GameEvent{
  gameState: GameDto;
}
