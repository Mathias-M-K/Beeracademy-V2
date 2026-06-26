import {LobbyDTO} from '../../../../../../../api-models/model/lobbyDTO';
import {LobbyClientEvent} from './lobby-client-event';

export interface LobbyStateEvent extends LobbyClientEvent{
  lobby: LobbyDTO;
}
