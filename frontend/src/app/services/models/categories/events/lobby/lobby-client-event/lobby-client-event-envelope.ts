import {WebsocketEnvelope} from '../../../../websocket-envelope';
import {LobbyClientEvent} from './lobby-client-event';

export interface LobbyClientEventEnvelope extends WebsocketEnvelope {
  payload: LobbyClientEvent;
}
