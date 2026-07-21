import {LobbyEvent} from '../lobby-event';
import {LobbyParticipantDTO} from '../../../../../../../api-models/model/lobbyParticipantDTO';

export interface ParticipantsRearrangedEvent extends LobbyEvent {
  participants: LobbyParticipantDTO[];
}
