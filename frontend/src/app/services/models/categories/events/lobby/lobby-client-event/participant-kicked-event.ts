import {LobbyClientEvent} from './lobby-client-event';

export interface ParticipantKickedEvent extends LobbyClientEvent {
  kickReason: string;
  participantId: string;
}
