import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideEnvironmentNgxMask } from 'ngx-mask';
import { LobbyPage } from './lobby-page';
import { LobbyService } from '../../services/lobby/lobby.service';
import { DrawerService } from '../../services/drawer/drawer.service';
import { ChatService } from '../../services/chat/chat.service';
import { ParticipantOverview } from './participant-overview/participant-overview';
import {
  createChatServiceStub,
  createLobbyServiceStub,
  LobbyServiceStub,
} from '../../../testing/lobby-page-stubs';
import { createDrawerServiceStub, DrawerServiceStub } from '../../../testing/stubs';
import { flushMicrotasks } from '../../../testing/async';
import { silenceConsole } from '../../../testing/console';
import { LobbyParticipantDTO } from '../../../api-models/model/lobbyParticipantDTO';

describe('LobbyPage', () => {
  let lobbyService: LobbyServiceStub;
  let drawers: DrawerServiceStub;

  const MATHIAS: LobbyParticipantDTO = {
    id: 'p1',
    name: 'Mathias',
    title: 'Rus',
    sipsInABeer: 14,
    canDrawAce: true,
    active: true,
  };
  const LASSE: LobbyParticipantDTO = { ...MATHIAS, id: 'p2', name: 'Lasse' };

  beforeEach(() => {
    lobbyService = createLobbyServiceStub();
    lobbyService.title.set('Hygge aften');
    lobbyService.partyId.set('ABCDEFGHI');
    lobbyService.participants.set([MATHIAS, LASSE]);
    drawers = createDrawerServiceStub();
    TestBed.configureTestingModule({
      providers: [
        provideEnvironmentNgxMask(),
        { provide: LobbyService, useValue: lobbyService },
        { provide: DrawerService, useValue: drawers },
        { provide: ChatService, useValue: createChatServiceStub() },
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function render(isHost: boolean) {
    lobbyService.isHost.set(isHost);
    lobbyService.readableRole.set(isHost ? 'Vært' : 'Deltager');
    const fixture = TestBed.createComponent(LobbyPage);
    await fixture.whenStable();
    return fixture;
  }

  function buttons(fixture: ComponentFixture<LobbyPage>): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('button'));
  }

  function button(fixture: ComponentFixture<LobbyPage>, text: string): HTMLButtonElement {
    const match = buttons(fixture).find((candidate) => candidate.textContent?.includes(text));
    if (!match) throw new Error(`No button containing "${text}"`);
    return match;
  }

  function startButton(fixture: ComponentFixture<LobbyPage>): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector('button.start-btn');
  }

  function participantRow(fixture: ComponentFixture<LobbyPage>, name: string): HTMLElement {
    const match = Array.from(
      fixture.nativeElement.querySelectorAll('app-participant') as HTMLElement[],
    ).find((row) => row.textContent?.includes(name));
    if (!match) throw new Error(`No participant "${name}"`);
    return match;
  }

  function rowButton(fixture: ComponentFixture<LobbyPage>, name: string, icon: string) {
    const match = Array.from(participantRow(fixture, name).querySelectorAll('button')).find(
      (candidate) => candidate.textContent?.trim() === icon,
    );
    if (!match) throw new Error(`No "${icon}" button for "${name}"`);
    return match;
  }

  it('shows nothing until the lobby is known', async () => {
    // Arrange
    lobbyService.title.set(undefined);

    // Act
    const fixture = await render(true);

    // Assert
    expect(fixture.nativeElement.children).toHaveLength(0);
  });

  describe('starting the game', () => {
    it('lets the host start a game for the current participants', async () => {
      // Arrange
      const fixture = await render(true);

      // Act
      startButton(fixture)!.click();

      // Assert
      expect(startButton(fixture)!.textContent?.trim()).toBe('Opret spil • 2 Spillere');
      expect(lobbyService.startGame).toHaveBeenCalledOnce();
    });

    it('is not offered to participants', async () => {
      // Arrange
      const isHost = false;

      // Act
      const fixture = await render(isHost);

      // Assert
      expect(startButton(fixture)).toBeNull();
    });

    it('is not offered while the lobby is empty', async () => {
      // Arrange
      lobbyService.participants.set([]);

      // Act
      const fixture = await render(true);

      // Assert
      expect(startButton(fixture)).toBeNull();
    });

    it('shows a loader and cannot be started again while the game is being created', async () => {
      // Arrange
      const fixture = await render(true);

      // Act
      lobbyService.creatingGame.set(true);
      await fixture.whenStable();

      // Assert
      expect(startButton(fixture)!.disabled).toBe(true);
      expect(startButton(fixture)!.querySelector('app-dot-loader')).not.toBeNull();
    });
  });

  describe('managing participants', () => {
    it('adds the participant named in the new participant drawer', async () => {
      // Arrange
      const fixture = await render(true);
      button(fixture, 'Tilføj deltager').click();

      // Act
      await drawers.handles[0].close('Frederik');
      await flushMicrotasks();

      // Assert
      expect(drawers.showNewParticipantDrawer).toHaveBeenCalledOnce();
      expect(lobbyService.requestParticipantCreation).toHaveBeenCalledWith('Frederik');
    });

    it('adds nobody when the new participant drawer is dismissed', async () => {
      // Arrange
      const fixture = await render(true);
      button(fixture, 'Tilføj deltager').click();

      // Act
      await drawers.handles[0].dismiss();
      await flushMicrotasks();

      // Assert
      expect(lobbyService.requestParticipantCreation).not.toHaveBeenCalled();
    });

    it('requests removal of a participant', async () => {
      // Arrange
      const fixture = await render(true);

      // Act
      rowButton(fixture, 'Lasse', 'person_remove').click();

      // Assert
      expect(lobbyService.requestParticipantRemoval).toHaveBeenCalledWith(LASSE.id);
    });

    it('requests the new order when participants are rearranged', async () => {
      // Arrange
      const fixture = await render(true);
      const overview = fixture.debugElement.query(By.directive(ParticipantOverview))
        .componentInstance as ParticipantOverview;

      // Act
      overview.participantsRearranged.emit([LASSE, MATHIAS]);

      // Assert
      expect(lobbyService.requestParticipantsRearranged).toHaveBeenCalledWith([LASSE, MATHIAS]);
    });

    it.each([
      ['closing', true, 'Luk Lobby'],
      ['leaving', false, 'Forlad lobby'],
    ])('leaves the lobby when %s it', async (_, isHost, text) => {
      // Arrange
      const fixture = await render(isHost);

      // Act
      button(fixture, text).click();

      // Assert
      expect(lobbyService.leaveLobby).toHaveBeenCalledOnce();
    });
  });

  describe('participant settings', () => {
    it("lets the host change another participant's settings", async () => {
      // Arrange
      const fixture = await render(true);
      rowButton(fixture, 'Lasse', 'settings').click();

      // Act
      await drawers.handles[0].close({ sipsInABeer: 20, canDrawAce: false });
      await flushMicrotasks();

      // Assert
      expect(drawers.showLobbyParticipantSettingsDrawer).toHaveBeenCalledWith(LASSE);
      expect(lobbyService.requestParticipantSettingsUpdate).toHaveBeenCalledWith(
        20,
        false,
        LASSE.id,
      );
    });

    it('lets a participant change its own settings', async () => {
      // Arrange
      lobbyService.self.set(MATHIAS);
      const fixture = await render(false);
      button(fixture, 'Indstillinger').click();

      // Act
      await drawers.handles[0].close({ sipsInABeer: 10, canDrawAce: true });
      await flushMicrotasks();

      // Assert
      expect(drawers.showLobbyParticipantSettingsDrawer).toHaveBeenCalledWith(MATHIAS);
      expect(lobbyService.requestParticipantSettingsUpdate).toHaveBeenCalledWith(
        10,
        true,
        MATHIAS.id,
      );
    });

    it('changes nothing when the settings drawer is dismissed', async () => {
      // Arrange
      lobbyService.self.set(MATHIAS);
      const fixture = await render(false);
      button(fixture, 'Indstillinger').click();

      // Act
      await drawers.handles[0].dismiss();
      await flushMicrotasks();

      // Assert
      expect(lobbyService.requestParticipantSettingsUpdate).not.toHaveBeenCalled();
    });

    it('does not open settings when the participant itself is unknown', async () => {
      // Arrange
      const console = silenceConsole();
      lobbyService.self.set(undefined);
      const fixture = await render(false);

      // Act
      button(fixture, 'Indstillinger').click();

      // Assert
      expect(drawers.showLobbyParticipantSettingsDrawer).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });
});
