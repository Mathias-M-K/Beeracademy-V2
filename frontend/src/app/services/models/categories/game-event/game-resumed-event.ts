import {GameEvent} from './game-event';
import {TimerReports} from '../../../../../api-models/model/timerReports';

export interface GameResumedEvent extends GameEvent {
  timerReports: TimerReports;
}
