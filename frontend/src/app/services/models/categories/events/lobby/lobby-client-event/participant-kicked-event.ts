import {LobbyEvent} from '../lobby-event';

export interface ParticipantKickedEvent extends LobbyEvent {
  kickReason: string;
  participantId: string;
}
