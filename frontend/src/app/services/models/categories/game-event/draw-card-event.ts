import {GameEvent} from './game-event';
import {Turn} from '../../../../../api-models/model/turn';

export interface DrawCardEvent extends GameEvent {
  turn: Turn;
  previousPlayerId: string;
  newPlayerId: string;
  nextPlayerId: string;

}
