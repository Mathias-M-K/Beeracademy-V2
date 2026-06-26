import {LobbyAction} from './lobby-action';
import {WebsocketEnvelope} from '../../../websocket-envelope';

interface LobbyActionEnvelope extends WebsocketEnvelope {
  payload: LobbyAction;
}

export function lobbyClientActionEnvelope(payload: LobbyAction): LobbyActionEnvelope {
  return {category: 'LOBBY_CLIENT_ACTION', payload};
}

export function lobbyParticipantActionEnvelope(payload: LobbyAction): LobbyActionEnvelope {
  return {category: 'LOBBY_PARTICIPANT_ACTION', payload};
}
