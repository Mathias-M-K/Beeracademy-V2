import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { Observable, of, Subject, throwError } from 'rxjs';
import { JoinPage } from './join-page';
import { LobbyApi } from '../../services/apis/lobby-api.service';
import { GameApi } from '../../services/apis/game-api.service';
import { EventApi } from '../../services/apis/event.api';
import { ToastService } from '../../services/toast/toast.service';
import { DrawerService } from '../../services/drawer/drawer.service';
import {
  createDrawerServiceStub,
  createToastServiceStub,
  DrawerServiceStub,
  ToastServiceStub,
} from '../../../testing/stubs';
import { silenceConsole } from '../../../testing/console';
import { PartyDto } from '../../../api-models/model/partyDto';
import { PartyState } from '../../../api-models/model/partyState';
import { PartyParticipantDto } from '../../../api-models/model/partyParticipantDto';
import { PlayerConnectionEvent } from '../../../api-models/model/playerConnectionEvent';
import { ConnectionEvent } from '../../../api-models/model/connectionEvent';
import { ToastState } from '../../overlay/toast/models/toast-data';

describe('JoinPage', () => {
  const PARTY_ID = 'ABCDEFGHI';

  const FREE: PartyParticipantDto = {
    id: 'p1',
    name: 'Mathias',
    session: { isClaimed: false, isConnected: false },
  };
  const RESERVED: PartyParticipantDto = {
    id: 'p2',
    name: 'Lasse',
    session: { isClaimed: true, isConnected: false },
  };
  const CONNECTED: PartyParticipantDto = {
    id: 'p3',
    name: 'Frederik',
    session: { isClaimed: true, isConnected: true },
  };

  let lobbyApi: { fetchParticipantToken: ReturnType<typeof vi.fn> };
  let gameApi: {
    getGamePlayerToken: ReturnType<typeof vi.fn>;
    requestPlayerRelease: ReturnType<typeof vi.fn>;
  };
  let connectionEvents: Subject<PlayerConnectionEvent>;
  let eventApi: { getPlayerConnectionEventStream: ReturnType<typeof vi.fn> };
  let toasts: ToastServiceStub;
  let drawers: DrawerServiceStub;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    silenceConsole();
    lobbyApi = { fetchParticipantToken: vi.fn(() => of({})) };
    gameApi = {
      getGamePlayerToken: vi.fn(() => of(undefined)),
      requestPlayerRelease: vi.fn(() => of(undefined)),
    };
    connectionEvents = new Subject<PlayerConnectionEvent>();
    eventApi = { getPlayerConnectionEventStream: vi.fn(() => connectionEvents.asObservable()) };
    toasts = createToastServiceStub();
    drawers = createDrawerServiceStub();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function aParty(overrides: Partial<PartyDto> = {}): PartyDto {
    return {
      id: PARTY_ID,
      name: 'Friday game',
      partyState: PartyState.Lobby,
      participants: [],
      session: { isClaimed: true, isConnected: true },
      ...overrides,
    };
  }

  async function render(partyInfo: PartyDto) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { data: of({ partyInfo }) } },
        { provide: LobbyApi, useValue: lobbyApi },
        { provide: GameApi, useValue: gameApi },
        { provide: EventApi, useValue: eventApi },
        { provide: ToastService, useValue: toasts },
        { provide: DrawerService, useValue: drawers },
      ],
    });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(JoinPage);
    await fixture.whenStable();
    return fixture;
  }

  function button(fixture: ComponentFixture<JoinPage>, text: string): HTMLButtonElement {
    const match = Array.from(
      fixture.nativeElement.querySelectorAll('button') as HTMLButtonElement[],
    ).find((candidate) => candidate.textContent?.trim() === text);
    if (!match) throw new Error(`No button with text "${text}"`);
    return match;
  }

  function participantRow(fixture: ComponentFixture<JoinPage>, name: string): HTMLElement {
    const match = Array.from(
      fixture.nativeElement.querySelectorAll('app-existing-participant') as HTMLElement[],
    ).find((row) => row.querySelector('h4')?.textContent === name);
    if (!match) throw new Error(`No participant named "${name}"`);
    return match;
  }

  function statusOf(fixture: ComponentFixture<JoinPage>, name: string): string | undefined {
    return participantRow(fixture, name).querySelector('p')?.textContent?.trim();
  }

  async function emit(fixture: ComponentFixture<JoinPage>, event: PlayerConnectionEvent) {
    connectionEvents.next(event);
    await fixture.whenStable();
  }

  describe('party info', () => {
    it('shows the party name and how many have already joined', async () => {
      // Arrange
      const party = aParty({ participants: [FREE, RESERVED] });

      // Act
      const fixture = await render(party);

      // Assert
      const info: HTMLElement = fixture.nativeElement.querySelector('.info');
      expect(info.querySelector('h1')?.textContent).toBe('Friday game');
      expect(info.textContent).toContain('2 er allerede med');
    });

    it("listens for connection events of the party's participants", async () => {
      // Arrange
      const party = aParty();

      // Act
      await render(party);

      // Assert
      expect(eventApi.getPlayerConnectionEventStream).toHaveBeenCalledWith(PARTY_ID);
    });

    // known-issues: JoinPage subscribes to the connection event stream without takeUntilDestroyed, leaking the SSE connection
    it.fails('stops listening for connection events when the page is destroyed', async () => {
      // Arrange
      const teardown = vi.fn();
      eventApi.getPlayerConnectionEventStream.mockReturnValue(new Observable(() => teardown));
      const fixture = await render(aParty());

      // Act
      fixture.destroy();

      // Assert
      expect(teardown).toHaveBeenCalledOnce();
    });
  });

  describe('joining a lobby', () => {
    async function typeName(fixture: ComponentFixture<JoinPage>, name: string) {
      const input: HTMLInputElement = fixture.nativeElement.querySelector('#participant-name');
      input.value = name;
      input.dispatchEvent(new Event('input'));
      await fixture.whenStable();
      return input;
    }

    it.each([
      ['', true],
      ['M', true],
      ['Ma', false],
    ])('with the name "%s" has the join button disabled: %s', async (name, disabled) => {
      // Arrange
      const fixture = await render(aParty());

      // Act
      await typeName(fixture, name);

      // Assert
      expect(button(fixture, 'Deltag').disabled).toBe(disabled);
    });

    it('registers the participant and opens the lobby', async () => {
      // Arrange
      const fixture = await render(aParty());
      await typeName(fixture, 'Mathias');

      // Act
      button(fixture, 'Deltag').click();
      await fixture.whenStable();

      // Assert
      expect(lobbyApi.fetchParticipantToken).toHaveBeenCalledWith(PARTY_ID, 'Mathias');
      expect(navigate).toHaveBeenCalledWith(['/lobby']);
    });

    it('registers the participant when Enter is pressed in the name field', async () => {
      // Arrange
      const fixture = await render(aParty());
      const input = await typeName(fixture, 'Mathias');

      // Act
      input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
      await fixture.whenStable();

      // Assert
      expect(lobbyApi.fetchParticipantToken).toHaveBeenCalledWith(PARTY_ID, 'Mathias');
    });

    it('asks for a name instead of registering when Enter is pressed without a valid name', async () => {
      // Arrange
      const fixture = await render(aParty());
      const input = await typeName(fixture, 'M');

      // Act
      input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
      await fixture.whenStable();

      // Assert
      expect(lobbyApi.fetchParticipantToken).not.toHaveBeenCalled();
      expect(toasts.showToast).toHaveBeenCalledWith('Wtf', 'Du skal angive deltagernavn', 'error');
    });

    it('shows a loader while registering', async () => {
      // Arrange
      const registration = new Subject<object>();
      lobbyApi.fetchParticipantToken.mockReturnValue(registration);
      const fixture = await render(aParty());
      await typeName(fixture, 'Mathias');

      // Act
      button(fixture, 'Deltag').click();
      await fixture.whenStable();

      // Assert
      expect(fixture.nativeElement.querySelector('.lobby-input app-dot-loader')).not.toBeNull();
    });

    it('stays on the page and reports the failure when registration fails', async () => {
      // Arrange
      lobbyApi.fetchParticipantToken.mockReturnValue(throwError(() => new Error('409')));
      const fixture = await render(aParty());
      await typeName(fixture, 'Mathias');

      // Act
      button(fixture, 'Deltag').click();
      await fixture.whenStable();

      // Assert
      expect(navigate).not.toHaveBeenCalled();
      expect(toasts.showToast).toHaveBeenCalledWith(
        'Der skete en fejl',
        'Kunne ikke deltage i lobbyen',
        'error',
      );
      expect(button(fixture, 'Deltag')).toBeTruthy();
    });
  });

  describe('joining a game in progress', () => {
    const gameParty = () =>
      aParty({ partyState: PartyState.Game, participants: [FREE, RESERVED, CONNECTED] });

    it('lists the players instead of asking for a name', async () => {
      // Arrange
      const party = gameParty();

      // Act
      const fixture = await render(party);

      // Assert
      expect(fixture.nativeElement.querySelector('#participant-name')).toBeNull();
      expect(statusOf(fixture, 'Mathias')).toBe('Ledig');
      expect(statusOf(fixture, 'Lasse')).toBe('Reserveret');
      expect(statusOf(fixture, 'Frederik')).toBe('Forbundet');
    });

    it('joins the game as a free player', async () => {
      // Arrange
      const fixture = await render(gameParty());

      // Act
      participantRow(fixture, 'Mathias').querySelector('button')!.click();
      await fixture.whenStable();

      // Assert
      expect(gameApi.getGamePlayerToken).toHaveBeenCalledWith(PARTY_ID, FREE.id);
      expect(navigate).toHaveBeenCalledWith(['/game']);
    });

    it('reports when the game could not be joined', async () => {
      // Arrange
      gameApi.getGamePlayerToken.mockReturnValue(throwError(() => new Error('403')));
      const fixture = await render(gameParty());

      // Act
      participantRow(fixture, 'Mathias').querySelector('button')!.click();
      await fixture.whenStable();

      // Assert
      expect(navigate).not.toHaveBeenCalled();
      expect(toasts.showToast).toHaveBeenCalledWith(
        'Der skete en fejl',
        'Kunne ikke tilgå igangværende spil',
        'error',
      );
    });

    describe('requesting the release of a reserved player', () => {
      async function requestRelease(fixture: ComponentFixture<JoinPage>) {
        participantRow(fixture, 'Lasse').querySelector('button')!.click();
        await fixture.whenStable();
      }

      it('asks the game to release the player and waits for it', async () => {
        // Arrange
        const fixture = await render(gameParty());

        // Act
        await requestRelease(fixture);

        // Assert
        expect(gameApi.requestPlayerRelease).toHaveBeenCalledWith(PARTY_ID, RESERVED.id);
        expect(drawers.showConfirmationDrawer).toHaveBeenCalledWith('Lasse');
        expect(statusOf(fixture, 'Lasse')).toBe('Afventer...');
      });

      it('reports when the request could not be sent', async () => {
        // Arrange
        gameApi.requestPlayerRelease.mockReturnValue(throwError(() => new Error('500')));
        const fixture = await render(gameParty());

        // Act
        await requestRelease(fixture);

        // Assert
        expect(toasts.showToast).toHaveBeenCalledWith(
          'Der skete en fejl',
          'Kunne ikke sende anmodning',
          'error',
          ToastState.error,
        );
        expect(drawers.showConfirmationDrawer).not.toHaveBeenCalled();
        expect(statusOf(fixture, 'Lasse')).toBe('Reserveret');
      });

      it('joins as the player automatically once it is released', async () => {
        // Arrange
        const fixture = await render(gameParty());
        await requestRelease(fixture);

        // Act
        await emit(fixture, {
          playerId: RESERVED.id,
          connectionEvent: ConnectionEvent.Released,
        });

        // Assert
        expect(gameApi.getGamePlayerToken).toHaveBeenCalledWith(PARTY_ID, RESERVED.id);
        expect(navigate).toHaveBeenCalledWith(['/game']);
      });

      it('stops waiting when the player reconnects instead', async () => {
        // Arrange
        const fixture = await render(gameParty());
        await requestRelease(fixture);

        // Act
        await emit(fixture, {
          playerId: RESERVED.id,
          connectionEvent: ConnectionEvent.Connected,
        });

        // Assert
        expect(statusOf(fixture, 'Lasse')).toBe('Forbundet');
      });

      it('does not join automatically after waiting was cancelled', async () => {
        // Arrange
        const fixture = await render(gameParty());
        await requestRelease(fixture);
        participantRow(fixture, 'Lasse').querySelector('button')!.click();
        await fixture.whenStable();

        // Act
        await emit(fixture, {
          playerId: RESERVED.id,
          connectionEvent: ConnectionEvent.Released,
        });

        // Assert
        expect(statusOf(fixture, 'Lasse')).toBe('Ledig');
        expect(gameApi.getGamePlayerToken).not.toHaveBeenCalled();
      });
    });

    describe('connection events', () => {
      it.each([
        [ConnectionEvent.Connected, 'Mathias', 'Forbundet'],
        [ConnectionEvent.Disconnected, 'Frederik', 'Reserveret'],
        [ConnectionEvent.Released, 'Lasse', 'Ledig'],
      ])('%s updates %s to "%s"', async (connectionEvent, name, expectedStatus) => {
        // Arrange
        const party = gameParty();
        const fixture = await render(party);
        const playerId = party.participants.find((participant) => participant.name === name)!.id;

        // Act
        await emit(fixture, { playerId, connectionEvent });

        // Assert
        expect(statusOf(fixture, name)).toBe(expectedStatus);
      });

      it('leaves other players untouched', async () => {
        // Arrange
        const fixture = await render(gameParty());

        // Act
        await emit(fixture, { playerId: FREE.id, connectionEvent: ConnectionEvent.Connected });

        // Assert
        expect(statusOf(fixture, 'Lasse')).toBe('Reserveret');
        expect(statusOf(fixture, 'Frederik')).toBe('Forbundet');
      });

      it('does not join automatically when a player nobody waits for is released', async () => {
        // Arrange
        const fixture = await render(gameParty());

        // Act
        await emit(fixture, { playerId: RESERVED.id, connectionEvent: ConnectionEvent.Released });

        // Assert
        expect(gameApi.getGamePlayerToken).not.toHaveBeenCalled();
      });
    });
  });
});
