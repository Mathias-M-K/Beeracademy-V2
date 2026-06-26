import {LobbyEvent} from '../lobby-event';

export interface ParticipantRemovedEvent extends LobbyEvent {
  kickReason: string;
  participantId: string;
}
