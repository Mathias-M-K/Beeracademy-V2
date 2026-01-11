import {WebsocketEnvelope} from '../../websocket-envelope';
import {GameClientEvent} from '../game-client-event/game-client-event';

export interface GameClientActionEnvelope extends WebsocketEnvelope{
  payload: GameClientEvent;
}
