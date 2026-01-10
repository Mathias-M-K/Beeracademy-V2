import {GameClientEvent} from './game-client-event';
import {GameDto} from '../../../../../api-models/model/gameDto';

export interface GameClientConnectedEvent extends GameClientEvent {
  game: GameDto;

}
