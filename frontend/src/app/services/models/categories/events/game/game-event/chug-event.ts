import {GameEvent} from '../game-event';
import {Chug} from '../../../../../../../api-models/model/chug';

export interface ChugEvent extends GameEvent {
  nextToDraw: string;
  chuggedBy: string
  chug: Chug
}
