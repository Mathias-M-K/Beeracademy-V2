import {GameEvent} from './game-event';
import {Chug} from '../../../../../api-models/model/chug';

export interface ChugEvent extends GameEvent {
  newPlayer: string;
  playerId: string
  chug: Chug
}
