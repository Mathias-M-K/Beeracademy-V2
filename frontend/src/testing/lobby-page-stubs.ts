import { signal, WritableSignal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Mock } from 'vitest';
import { EmojiInfo } from '../app/services/chat/models/emoji-info';
import { MessageInfo } from '../app/services/chat/models/message-info';
import { LobbyParticipantDTO } from '../api-models/model/lobbyParticipantDTO';
import { Emoji } from '../api-models/model/emoji';

/** {@link ChatService} stand-in: tests write `messages` and push reactions through `emojiReactions`. */
export interface ChatServiceStub {
  messages: WritableSignal<MessageInfo[]>;
  emojiReactions: Subject<EmojiInfo>;
  emojis: Observable<EmojiInfo>;
  sendMessage: Mock<(text: string) => void>;
  sendEmoji: Mock<(emoji: Emoji) => void>;
}

export function createChatServiceStub(): ChatServiceStub {
  const emojiReactions = new Subject<EmojiInfo>();
  return {
    messages: signal<MessageInfo[]>([]),
    emojiReactions,
    emojis: emojiReactions.asObservable(),
    sendMessage: vi.fn(),
    sendEmoji: vi.fn(),
  };
}

/** {@link LobbyService} stand-in whose state is plain writable signals a test sets directly. */
export interface LobbyServiceStub {
  title: WritableSignal<string | undefined>;
  partyId: WritableSignal<string | undefined>;
  participants: WritableSignal<LobbyParticipantDTO[]>;
  readableRole: WritableSignal<string>;
  self: WritableSignal<LobbyParticipantDTO | undefined>;
  isHost: WritableSignal<boolean>;
  creatingGame: WritableSignal<boolean>;
  startGame: Mock<() => void>;
  leaveLobby: Mock<() => void>;
  requestParticipantCreation: Mock<(name: string) => void>;
  requestParticipantRemoval: Mock<(participantId: string) => void>;
  requestParticipantSettingsUpdate: Mock<
    (sipsInABeer: number, canDrawAce: boolean, participantId?: string) => void
  >;
  requestParticipantsRearranged: Mock<(participants: LobbyParticipantDTO[]) => void>;
}

export function createLobbyServiceStub(): LobbyServiceStub {
  return {
    title: signal<string | undefined>(undefined),
    partyId: signal<string | undefined>(undefined),
    participants: signal<LobbyParticipantDTO[]>([]),
    readableRole: signal('Ukendt'),
    self: signal<LobbyParticipantDTO | undefined>(undefined),
    isHost: signal(false),
    creatingGame: signal(false),
    startGame: vi.fn(),
    leaveLobby: vi.fn(),
    requestParticipantCreation: vi.fn(),
    requestParticipantRemoval: vi.fn(),
    requestParticipantSettingsUpdate: vi.fn(),
    requestParticipantsRearranged: vi.fn(),
  };
}
