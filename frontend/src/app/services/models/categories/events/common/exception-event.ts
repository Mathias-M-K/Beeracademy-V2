import {GameEvent} from '../game/game-event';
import {LobbyEvent} from '../lobby/lobby-event';
import {ExceptionResponse} from '../../../../../../api-models/model/exceptionResponse';

export interface ExceptionEvent extends GameEvent, LobbyEvent {
  response: ExceptionResponse;
}
