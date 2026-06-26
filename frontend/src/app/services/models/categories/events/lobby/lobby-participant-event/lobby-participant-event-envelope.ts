import {WebsocketEnvelope} from '../../../../websocket-envelope';
import {LobbyParticipantEvent} from './lobby-participant-event';

export interface LobbyParticipantEventEnvelope extends WebsocketEnvelope {
  payload: LobbyParticipantEvent;
}
