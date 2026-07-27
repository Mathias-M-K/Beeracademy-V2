import {WebsocketEnvelope} from '../../../websocket-envelope';
import {LobbyEvent} from './lobby-event';

/**
 * LobbyEventEnvelope is used for all envelopes from frontend
 */
export interface LobbyEventEnvelope extends WebsocketEnvelope {
  payload: LobbyEvent;
}
