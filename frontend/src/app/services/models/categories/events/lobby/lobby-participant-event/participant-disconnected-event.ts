import {LobbyEvent} from '../lobby-event';

export interface ParticipantDisconnectedEvent extends LobbyEvent {
  participantId: string;
}
