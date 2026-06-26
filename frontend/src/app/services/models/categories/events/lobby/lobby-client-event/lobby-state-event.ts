import {LobbyDTO} from '../../../../../../../api-models/model/lobbyDTO';
import {LobbyEvent} from '../lobby-event';


export interface LobbyStateEvent extends LobbyEvent {
  lobby: LobbyDTO;
}
