import { LobbyDTO } from '../api-models/model/lobbyDTO';
import { LobbyParticipantDTO } from '../api-models/model/lobbyParticipantDTO';
import { Emoji } from '../api-models/model/emoji';
import { Role } from '../api-models/model/role';
import { ExceptionResponse } from '../api-models/model/exceptionResponse';
import { LobbyEventEnvelope } from '../app/services/models/categories/events/lobby/lobby-event-envelope';

export const LOBBY_PARTY_ID = 'LOBBY1234';
export const PARTICIPANT_1 = 'lp1';
export const PARTICIPANT_2 = 'lp2';
export const PARTICIPANT_3 = 'lp3';

export function aLobbyParticipant(
  overrides: Partial<LobbyParticipantDTO> = {},
): LobbyParticipantDTO {
  return {
    id: PARTICIPANT_1,
    name: 'Participant 1',
    title: 'Rookie',
    sipsInABeer: 14,
    canDrawAce: true,
    active: true,
    ...overrides,
  };
}

export function threeParticipants(): LobbyParticipantDTO[] {
  return [
    aLobbyParticipant({ id: PARTICIPANT_1, name: 'Participant 1' }),
    aLobbyParticipant({ id: PARTICIPANT_2, name: 'Participant 2' }),
    aLobbyParticipant({ id: PARTICIPANT_3, name: 'Participant 3' }),
  ];
}

export function aLobbyDto(overrides: Partial<LobbyDTO> = {}): LobbyDTO {
  return {
    name: 'Friday lobby',
    partyId: LOBBY_PARTY_ID,
    participants: threeParticipants(),
    ...overrides,
  };
}

function lobbyEvent(
  type: string,
  fields: object = {},
  category = 'LOBBY_CLIENT_EVENT',
): LobbyEventEnvelope {
  return { category, payload: { type, ...fields } } as LobbyEventEnvelope;
}

export const lobbyEvents = {
  snapshot: (lobby: LobbyDTO) => lobbyEvent('HELLO_LOBBY_SNAPSHOT', { lobby }),
  identity: (id: string, role: Role) => lobbyEvent('HELLO_IDENTITY', { id, role }),
  newParticipant: (participant: LobbyParticipantDTO) =>
    lobbyEvent('NEW_PARTICIPANT', { participant }),
  messageSent: (senderId: string, message: string) =>
    lobbyEvent('MESSAGE_SENT', { senderId, message }, 'LOBBY_PARTICIPANT_EVENT'),
  emojiSent: (senderId: string, emoji: Emoji) =>
    lobbyEvent('EMOJI_SENT', { senderId, emoji }, 'LOBBY_PARTICIPANT_EVENT'),
  participantRemoved: (participantId: string, kickReason = 'Too drunk') =>
    lobbyEvent('PARTICIPANT_REMOVED', { participantId, kickReason }),
  participantDisconnected: (participantId: string) =>
    lobbyEvent('PARTICIPANT_DISCONNECTED', { participantId }, 'LOBBY_PARTICIPANT_EVENT'),
  settingsUpdated: (participantId: string, sipsInABeer: number, canDrawAce: boolean) =>
    lobbyEvent('SETTINGS_UPDATED', { participantId, sipsInABeer, canDrawAce }),
  participantsRearranged: (participants: LobbyParticipantDTO[]) =>
    lobbyEvent('PARTICIPANTS_REARRANGED', { participants }),
  exception: (response: ExceptionResponse) => lobbyEvent('EXCEPTION_RESPONSE', { response }),
};
