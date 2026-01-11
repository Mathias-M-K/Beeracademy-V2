import {GameEvent} from './game-event';
import {TimeReport} from '../../../../../api-models/model/timeReport';

export interface GameResumedEvent extends GameEvent {
  timeReport: TimeReport;
}
