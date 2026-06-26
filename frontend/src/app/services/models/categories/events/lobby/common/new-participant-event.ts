import {LobbyDTO} from '../../../../../../../api-models/model/lobbyDTO';
import {LobbyEvent} from '../lobby-event';


export interface NewParticipantEvent extends LobbyEvent {
  participant: LobbyDTO;
}
