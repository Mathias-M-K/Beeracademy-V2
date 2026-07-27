import {LobbyEvent} from '../lobby-event';

export interface ParticipantSettingsUpdatedEvent extends LobbyEvent {
  canDrawAce: boolean;
  participantId: string;
  sipsInABeer: number;
}
