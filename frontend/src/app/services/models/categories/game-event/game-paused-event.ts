import {GameEvent} from './game-event';
import {TimeReport} from '../../../../../api-models/model/timeReport';
import {TimerReports} from '../../../../../api-models/model/timerReports';

export interface GamePausedEvent extends GameEvent {
  timerReports: TimerReports;
}
