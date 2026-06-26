import {WebsocketEnvelope} from '../../../../websocket-envelope';
import {LobbyClientEvent} from '../lobby-client-event/lobby-client-event';
import {LobbyParticipantEvent} from './lobby-participant-event';

export interface LobbyParticipantEventEnvelope extends WebsocketEnvelope {
  payload: LobbyParticipantEvent;
}
