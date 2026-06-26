import {LobbyParticipantEvent} from './lobby-participant-event';

export interface ParticipantDisconnectedEvent extends LobbyParticipantEvent {
  participantId: string;
}
