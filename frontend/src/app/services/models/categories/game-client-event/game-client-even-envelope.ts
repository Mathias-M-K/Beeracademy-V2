import {WebsocketEnvelope} from '../../websocket-envelope';
import {GameClientEvent} from './game-client-event';

export interface GameClientEvenEnvelope extends WebsocketEnvelope {
  payload: GameClientEvent;
}
