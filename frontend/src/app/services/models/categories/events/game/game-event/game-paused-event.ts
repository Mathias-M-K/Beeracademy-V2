import {GameEvent} from '../game-event';
import {TimerReports} from '../../../../../../../api-models/model/timerReports';

export interface GamePausedEvent extends GameEvent {
  timerReports: TimerReports;
}
