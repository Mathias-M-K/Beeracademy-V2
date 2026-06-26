import {LobbyDTO} from '../../../../../../../api-models/model/lobbyDTO';
import {LobbyClientEvent} from '../lobby-client-event/lobby-client-event';
import {LobbyParticipantEvent} from '../lobby-participant-event/lobby-participant-event';

export interface NewParticipantEvent extends LobbyClientEvent, LobbyParticipantEvent {
  participant: LobbyDTO;
}
