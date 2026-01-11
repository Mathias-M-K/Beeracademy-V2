import {GameEvent} from './game-event';
import {Card} from '../../../../../api-models/model/card';

export interface DrawCardEvent extends GameEvent {
  turn: number;
  durationInMillis: number;
  newCard: Card;
  previousPlayerId: string;
  newPlayerId: string;
  nextPlayerId: string;

}
