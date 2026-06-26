import {LobbyClientAction} from './lobby-client-action';
import {WebsocketEnvelope} from '../../../../websocket-envelope';

interface LobbyClientActionEnvelope extends WebsocketEnvelope {
  category: 'LOBBY_CLIENT_ACTION';
  payload: LobbyClientAction;
}

export function lobbyClientActionEnvelope(payload: LobbyClientAction): LobbyClientActionEnvelope {
  return {category: 'LOBBY_CLIENT_ACTION', payload};
}
