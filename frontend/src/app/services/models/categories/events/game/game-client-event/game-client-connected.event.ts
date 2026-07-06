
import {GameDto} from '../../../../../../../api-models/model/gameDto';
import {GameEvent} from '../game-event';

export interface GameClientConnectedEvent extends GameEvent {
  game: GameDto;

}
