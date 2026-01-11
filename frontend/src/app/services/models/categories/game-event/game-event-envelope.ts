import {WebsocketEnvelope} from '../../websocket-envelope';
import {GameEvent} from './game-event';

export interface GameEventEnvelope extends WebsocketEnvelope{
  payload: GameEvent;
}
