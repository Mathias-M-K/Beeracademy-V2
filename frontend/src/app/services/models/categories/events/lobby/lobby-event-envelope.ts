import {WebsocketEnvelope} from '../../../websocket-envelope';
import {LobbyEvent} from './lobby-event';


export interface LobbyEventEnvelope extends WebsocketEnvelope {
  payload: LobbyEvent;
}
