import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ParticipantOverview } from './participant-overview';
import { ChatService } from '../../../services/chat/chat.service';
import { ChatServiceStub, createChatServiceStub } from '../../../../testing/lobby-page-stubs';
import { LobbyParticipantDTO } from '../../../../api-models/model/lobbyParticipantDTO';
import { Emoji } from '../../../../api-models/model/emoji';
import { MessageDirection } from '../../../services/chat/models/message-direction';

describe('ParticipantOverview', () => {
  let chatService: ChatServiceStub;

  const MATHIAS: LobbyParticipantDTO = {
    id: 'p1',
    name: 'Mathias',
    title: 'Rus',
    sipsInABeer: 14,
    canDrawAce: true,
    active: true,
  };
  const LASSE: LobbyParticipantDTO = { ...MATHIAS, id: 'p2', name: 'Lasse' };
  const FREDERIK: LobbyParticipantDTO = { ...MATHIAS, id: 'p3', name: 'Frederik' };

  beforeEach(() => {
    chatService = createChatServiceStub();
    TestBed.configureTestingModule({
      providers: [{ provide: ChatService, useValue: chatService }],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function render(participants: LobbyParticipantDTO[], isLobbyOwner: boolean) {
    const fixture = TestBed.createComponent(ParticipantOverview);
    fixture.componentRef.setInput('participants', participants);
    fixture.componentRef.setInput('isLobbyOwner', isLobbyOwner);
    await fixture.whenStable();
    return fixture;
  }

  function headerButton(fixture: ComponentFixture<ParticipantOverview>, text: string) {
    const match = Array.from(
      fixture.nativeElement.querySelectorAll('.buttons button') as HTMLButtonElement[],
    ).find((button) => button.textContent?.includes(text));
    if (!match) throw new Error(`No header button "${text}"`);
    return match;
  }

  function headerButtonTexts(fixture: ComponentFixture<ParticipantOverview>): string[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('.buttons button') as HTMLButtonElement[],
    ).map((button) => button.lastChild?.textContent?.trim() ?? '');
  }

  function rows(fixture: ComponentFixture<ParticipantOverview>): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('app-participant'));
  }

  function rowButton(row: HTMLElement, icon: string): HTMLButtonElement {
    const match = Array.from(row.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === icon,
    );
    if (!match) throw new Error(`No "${icon}" button in row`);
    return match;
  }

  function badgeInitials(fixture: ComponentFixture<ParticipantOverview>): string[] {
    return rows(fixture).map(
      (row) => row.querySelector('app-participant-badge h3')?.textContent ?? '',
    );
  }

  function names(fixture: ComponentFixture<ParticipantOverview>): string[] {
    return rows(fixture).map((row) =>
      row.querySelector('h3:not(app-participant-badge h3)')!.textContent!.trim(),
    );
  }

  it('shows how many participants there are', async () => {
    // Arrange
    const participants = [MATHIAS, LASSE];

    // Act
    const fixture = await render(participants, false);

    // Assert
    expect(fixture.nativeElement.querySelector('.header h3').textContent).toBe('Deltagere - 2');
  });

  describe('as the lobby owner', () => {
    it('offers to add participants and close the lobby', async () => {
      // Arrange
      const isLobbyOwner = true;

      // Act
      const fixture = await render([MATHIAS], isLobbyOwner);

      // Assert
      expect(headerButtonTexts(fixture)).toEqual(['Tilføj deltager', 'Luk Lobby']);
    });

    it.each([
      ['Tilføj deltager', 'addParticipant'],
      ['Luk Lobby', 'disconnect'],
    ] as const)('emits %s as %s', async (text, output) => {
      // Arrange
      const fixture = await render([MATHIAS], true);
      const spy = vi.fn();
      fixture.componentInstance[output].subscribe(spy);

      // Act
      headerButton(fixture, text).click();

      // Assert
      expect(spy).toHaveBeenCalledOnce();
    });

    it("emits a participant's id when it is removed", async () => {
      // Arrange
      const fixture = await render([MATHIAS, LASSE], true);
      const removeParticipant = vi.fn();
      fixture.componentInstance.removeParticipant.subscribe(removeParticipant);

      // Act
      rowButton(rows(fixture)[1], 'person_remove').click();

      // Assert
      expect(removeParticipant).toHaveBeenCalledWith(LASSE.id);
    });

    it('emits the participant whose settings are opened', async () => {
      // Arrange
      const fixture = await render([MATHIAS, LASSE], true);
      const openParticipantSettings = vi.fn();
      fixture.componentInstance.openParticipantSettings.subscribe(openParticipantSettings);

      // Act
      rowButton(rows(fixture)[1], 'settings').click();

      // Assert
      expect(openParticipantSettings).toHaveBeenCalledWith(LASSE);
    });
  });

  describe('as a participant', () => {
    it('offers to leave the lobby and open its own settings, but not to edit others', async () => {
      // Arrange
      const isLobbyOwner = false;

      // Act
      const fixture = await render([MATHIAS, LASSE], isLobbyOwner);

      // Assert
      expect(headerButtonTexts(fixture)).toEqual(['Forlad lobby', 'Indstillinger']);
      expect(rows(fixture).every((row) => row.querySelector('button') === null)).toBe(true);
    });

    it('emits disconnect when leaving', async () => {
      // Arrange
      const fixture = await render([MATHIAS], false);
      const disconnect = vi.fn();
      fixture.componentInstance.disconnect.subscribe(disconnect);

      // Act
      headerButton(fixture, 'Forlad lobby').click();

      // Assert
      expect(disconnect).toHaveBeenCalledOnce();
    });

    it('opens its own settings without naming a participant', async () => {
      // Arrange
      const fixture = await render([MATHIAS], false);
      const openParticipantSettings = vi.fn();
      fixture.componentInstance.openParticipantSettings.subscribe(openParticipantSettings);

      // Act
      headerButton(fixture, 'Indstillinger').click();

      // Assert
      expect(openParticipantSettings).toHaveBeenCalledWith(undefined);
    });
  });

  describe('short names', () => {
    it('abbreviates names to three upper-case letters and numbers duplicates', async () => {
      // Arrange
      const participants = [
        { ...MATHIAS, id: 'a', name: 'Mathias' },
        { ...MATHIAS, id: 'b', name: 'Mads' },
        { ...MATHIAS, id: 'c', name: 'matilde' },
        { ...MATHIAS, id: 'd', name: 'Mat' },
      ];

      // Act
      const fixture = await render(participants, false);

      // Assert
      expect(badgeInitials(fixture)).toEqual(['MAT', 'MAD', 'MAT2', 'MAT3']);
    });
  });

  describe('emoji reactions', () => {
    it("shows a reaction on the sender's badge only", async () => {
      // Arrange
      const fixture = await render([MATHIAS, LASSE], false);

      // Act
      chatService.emojiReactions.next({
        senderId: LASSE.id!,
        senderName: 'Lasse',
        direction: MessageDirection.IN,
        fromHost: false,
        emoji: Emoji.Fire,
        emojiAsString: '🔥',
      });
      await fixture.whenStable();

      // Assert
      const emojis = rows(fixture).map((row) => row.querySelector('.emoji')?.textContent);
      expect(emojis).toEqual(['', '🔥']);
    });
  });

  describe('rearranging', () => {
    function drop(fixture: ComponentFixture<ParticipantOverview>, from: number, to: number) {
      fixture.componentInstance.onDrop({
        previousIndex: from,
        currentIndex: to,
      } as CdkDragDrop<unknown>);
    }

    it('emits and shows the new order after a drop', async () => {
      // Arrange
      const fixture = await render([MATHIAS, LASSE, FREDERIK], true);
      const participantsRearranged = vi.fn();
      fixture.componentInstance.participantsRearranged.subscribe(participantsRearranged);

      // Act
      drop(fixture, 0, 2);
      await fixture.whenStable();

      // Assert
      expect(participantsRearranged).toHaveBeenCalledWith([LASSE, FREDERIK, MATHIAS]);
      expect(names(fixture)).toEqual(['Lasse', 'Frederik', 'Mathias']);
    });

    it('follows a new participant list from the lobby after a local rearrangement', async () => {
      // Arrange
      const fixture = await render([MATHIAS, LASSE], true);
      drop(fixture, 0, 1);
      await fixture.whenStable();

      // Act
      fixture.componentRef.setInput('participants', [MATHIAS, LASSE, FREDERIK]);
      await fixture.whenStable();

      // Assert
      expect(names(fixture)).toEqual(['Mathias', 'Lasse', 'Frederik']);
    });
  });
});
