import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { ChatService } from './chat.service';
import { LobbyService } from '../lobby/lobby.service';
import { MessageInfo } from './models/message-info';
import { EmojiInfo } from './models/emoji-info';
import { MessageDirection } from './models/message-direction';
import { Emoji } from '../../../api-models/model/emoji';

describe('ChatService', () => {
  let service: ChatService;
  let lobby: {
    chatMessages: Subject<MessageInfo>;
    emojiReactions: Subject<EmojiInfo>;
    lobbyReset: Subject<void>;
    isHost: ReturnType<typeof signal<boolean>>;
    sendMessage: ReturnType<typeof vi.fn>;
    sendEmoji: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    lobby = {
      chatMessages: new Subject<MessageInfo>(),
      emojiReactions: new Subject<EmojiInfo>(),
      lobbyReset: new Subject<void>(),
      isHost: signal(false),
      sendMessage: vi.fn(),
      sendEmoji: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: LobbyService, useValue: lobby }],
    });

    service = TestBed.inject(ChatService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function anIncomingMessage(overrides: Partial<MessageInfo> = {}): MessageInfo {
    return {
      direction: MessageDirection.IN,
      message: 'Cheers',
      senderName: 'Participant 1',
      senderId: 'lp1',
      fromHost: false,
      ...overrides,
    };
  }

  function anIncomingEmoji(overrides: Partial<EmojiInfo> = {}): EmojiInfo {
    return {
      direction: MessageDirection.IN,
      emoji: Emoji.Beer,
      emojiAsString: '🍺',
      senderName: 'Participant 1',
      senderId: 'lp1',
      fromHost: false,
      ...overrides,
    };
  }

  describe('incoming chat', () => {
    it('starts with an empty history', () => {
      // Arrange
      const fresh = service;

      // Act
      const messages = fresh.messages();

      // Assert
      expect(messages).toEqual([]);
    });

    it('appends messages from the lobby in arrival order', () => {
      // Arrange
      const first = anIncomingMessage({ message: 'First' });
      const second = anIncomingMessage({ message: 'Second', senderId: 'lp2' });

      // Act
      lobby.chatMessages.next(first);
      lobby.chatMessages.next(second);

      // Assert
      expect(service.messages()).toEqual([first, second]);
    });

    it('forwards emoji reactions from the lobby', () => {
      // Arrange
      const received: EmojiInfo[] = [];
      service.emojis.subscribe((emoji) => received.push(emoji));
      const emoji = anIncomingEmoji();

      // Act
      lobby.emojiReactions.next(emoji);

      // Assert
      expect(received).toEqual([emoji]);
      expect(service.messages()).toEqual([]);
    });

    it('clears the history when the lobby resets', () => {
      // Arrange
      lobby.chatMessages.next(anIncomingMessage());

      // Act
      lobby.lobbyReset.next();

      // Assert
      expect(service.messages()).toEqual([]);
    });
  });

  describe('sending messages', () => {
    it('shows the message locally and sends it to the lobby', () => {
      // Arrange
      const text = 'Skål';

      // Act
      service.sendMessage(text);

      // Assert
      expect(service.messages()).toEqual([
        {
          senderName: 'Mig',
          senderId: '',
          message: 'Skål',
          direction: MessageDirection.OUT,
          fromHost: false,
        },
      ]);
      expect(lobby.sendMessage).toHaveBeenCalledWith('Skål');
    });

    it('marks the local message as from the host when the user hosts', () => {
      // Arrange
      lobby.isHost.set(true);

      // Act
      service.sendMessage('Welcome');

      // Assert
      expect(service.messages()[0].fromHost).toBe(true);
    });

    it('trims the message shown locally', () => {
      // Arrange
      const text = '  Skål  ';

      // Act
      service.sendMessage(text);

      // Assert
      expect(service.messages()[0].message).toBe('Skål');
    });

    // known-issues: ChatService.sendMessage shows the trimmed text locally but sends the untrimmed text
    it.fails('sends the same trimmed text it shows locally', () => {
      // Arrange
      const text = '  Skål  ';

      // Act
      service.sendMessage(text);

      // Assert
      expect(lobby.sendMessage).toHaveBeenCalledWith('Skål');
    });

    it.each(['', '   '])('ignores the blank message %j', (text) => {
      // Arrange
      const blank = text;

      // Act
      service.sendMessage(blank);

      // Assert
      expect(service.messages()).toEqual([]);
      expect(lobby.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('sending emojis', () => {
    it('sends the emoji reaction and posts its glyph as a chat message', () => {
      // Arrange
      const emoji = Emoji.Confetti;

      // Act
      service.sendEmoji(emoji);

      // Assert
      expect(lobby.sendEmoji).toHaveBeenCalledWith(Emoji.Confetti);
      expect(lobby.sendMessage).toHaveBeenCalledWith('🎉');
      expect(service.messages()).toEqual([
        expect.objectContaining({ message: '🎉', direction: MessageDirection.OUT }),
      ]);
    });
  });
});
