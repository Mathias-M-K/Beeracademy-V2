import { TimerReports } from '../../../../../../../api-models/model/timerReports';
import { GameEvent } from '../game-event';

export interface GameEndEvent extends GameEvent {
  timeReports: TimerReports;
}
