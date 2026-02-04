import {GameReport} from '../../../../../api-models/model/gameReport';
import {PlayerReport} from '../../../../../api-models/model/playerReport';
import {TimerReports} from '../../../../../api-models/model/timerReports';
import {GameEvent} from './game-event';

export interface GameEndEvent extends GameEvent{
  gameReport: GameReport;
  playerReports: PlayerReport[];
  timeReports: TimerReports;
}
