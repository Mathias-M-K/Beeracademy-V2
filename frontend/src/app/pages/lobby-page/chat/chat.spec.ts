import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Chat } from './chat';
import { ChatService } from '../../../services/chat/chat.service';
import { ChatServiceStub, createChatServiceStub } from '../../../../testing/lobby-page-stubs';
import { Emoji } from '../../../../api-models/model/emoji';
import { MessageDirection } from '../../../services/chat/models/message-direction';

describe('Chat', () => {
  let chatService: ChatServiceStub;

  const EMOJIS: [string, Emoji][] = [
    ['🍺', Emoji.Beer],
    ['🤮', Emoji.Vomit],
    ['🎊', Emoji.Confetti],
    ['😂', Emoji.CryLaugh],
    ['🔥', Emoji.Fire],
    ['💀', Emoji.Skull],
  ];

  beforeEach(() => {
    chatService = createChatServiceStub();
    TestBed.configureTestingModule({
      providers: [{ provide: ChatService, useValue: chatService }],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function render() {
    const fixture = TestBed.createComponent(Chat);
    await fixture.whenStable();
    return fixture;
  }

  function emojiButton(fixture: ComponentFixture<Chat>, emoji: string): HTMLElement {
    const match = Array.from(
      fixture.nativeElement.querySelectorAll('.emoji-row > div') as HTMLElement[],
    ).find((candidate) => candidate.textContent?.trim() === emoji);
    if (!match) throw new Error(`No emoji "${emoji}"`);
    return match;
  }

  function messageField(fixture: ComponentFixture<Chat>): HTMLInputElement {
    return fixture.nativeElement.querySelector('input[aria-label="message-field"]');
  }

  describe('messages', () => {
    it('shows every message with its sender', async () => {
      // Arrange
      const fixture = await render();

      // Act
      chatService.messages.set([
        {
          senderId: 'p1',
          senderName: 'Mathias',
          message: 'Skål',
          direction: MessageDirection.IN,
          fromHost: true,
        },
        {
          senderId: '',
          senderName: 'Mig',
          message: 'Skål igen',
          direction: MessageDirection.OUT,
          fromHost: false,
        },
      ]);
      await fixture.whenStable();

      // Assert
      const messages = Array.from(
        fixture.nativeElement.querySelectorAll('app-message') as HTMLElement[],
      ).map((message) => [
        message.querySelector('p')?.textContent,
        message.querySelector('h3')?.textContent,
      ]);
      expect(messages).toEqual([
        ['Mathias', 'Skål'],
        ['Mig', 'Skål igen'],
      ]);
    });
  });

  describe('sending a message', () => {
    it('sends the typed message and clears the field when Send is clicked', async () => {
      // Arrange
      const fixture = await render();
      messageField(fixture).value = 'Skål';
      const send = Array.from(
        fixture.nativeElement.querySelectorAll('button') as HTMLElement[],
      ).find((button) => button.textContent?.trim() === 'Send')!;

      // Act
      send.click();
      await fixture.whenStable();

      // Assert
      expect(chatService.sendMessage).toHaveBeenCalledWith('Skål');
      expect(messageField(fixture).value).toBe('');
    });

    it('sends the typed message and clears the field when Enter is pressed', async () => {
      // Arrange
      const fixture = await render();
      messageField(fixture).value = 'Skål';

      // Act
      messageField(fixture).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      await fixture.whenStable();

      // Assert
      expect(chatService.sendMessage).toHaveBeenCalledWith('Skål');
      expect(messageField(fixture).value).toBe('');
    });
  });

  describe('sending an emoji', () => {
    it.each(EMOJIS)('sends %s when it is clicked', async (display, emoji) => {
      // Arrange
      const fixture = await render();

      // Act
      emojiButton(fixture, display).click();

      // Assert
      expect(chatService.sendEmoji).toHaveBeenCalledWith(emoji);
    });

    // known-issues: chat.html binds (keydown.enter) to the sendEmojiAction factory instead of sendEmoji, so Enter sends nothing
    it.fails('sends the emoji when Enter is pressed on it', async () => {
      // Arrange
      const fixture = await render();

      // Act
      emojiButton(fixture, '🍺').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      await fixture.whenStable();

      // Assert
      expect(chatService.sendEmoji).toHaveBeenCalledWith(Emoji.Beer);
    });
  });
});
