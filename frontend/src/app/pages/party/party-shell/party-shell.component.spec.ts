import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { BreakpointObserver } from '@angular/cdk/layout';
import { of } from 'rxjs';
import { provideEnvironmentNgxMask } from 'ngx-mask';
import { PartyShellComponent } from './party-shell.component';
import { GameService } from '../../../services/game/game.service';
import { LobbyService } from '../../../services/lobby/lobby.service';
import { TimerService } from '../../../services/timer-service/timer.service';
import { TimerType } from '../../../services/timer-service/models/TimerType';
import { DrawerService } from '../../../services/drawer/drawer.service';
import { createDrawerServiceStub, DrawerServiceStub } from '../../../../testing/stubs';
import { aTimeReport, PARTY_ID } from '../../../../testing/game-builders';
import { GameInfo } from '../../../services/game/models/game-info';
import { TimeReport } from '../../../../api-models/model/timeReport';
import { TimerState } from '../../../../api-models/model/timerState';
import { GameState } from '../../../../api-models/model/gameState';

@Component({ template: '' })
class PhaseStub {}

describe('PartyShell', () => {
  let drawers: DrawerServiceStub;
  let gameService: {
    gameInfo: ReturnType<typeof signal<GameInfo | undefined>>;
    currentRound: ReturnType<typeof signal<number>>;
    gameTimeReport: ReturnType<typeof signal<TimeReport | undefined>>;
    isGameClient: ReturnType<typeof signal<boolean>>;
    gameState: ReturnType<typeof signal<GameState | undefined>>;
    firstCardDrawn: ReturnType<typeof signal<boolean>>;
    getContext: () => { partyName: string; partyId: string; isHost: boolean };
    dispatchPauseGameAction: ReturnType<typeof vi.fn>;
    dispatchResumeGameAction: ReturnType<typeof vi.fn>;
  };
  let lobbyService: {
    title: ReturnType<typeof signal<string | undefined>>;
    partyId: ReturnType<typeof signal<string | undefined>>;
    isHost: ReturnType<typeof signal<boolean>>;
    getContext: () => { partyName: string; partyId: string; isHost: boolean };
  };

  beforeEach(() => {
    gameService = {
      gameInfo: signal<GameInfo | undefined>({ id: PARTY_ID, name: 'Friday game' }),
      currentRound: signal(4),
      gameTimeReport: signal<TimeReport | undefined>(aTimeReport({ state: TimerState.Running })),
      isGameClient: signal(true),
      gameState: signal<GameState | undefined>(GameState.InProgress),
      firstCardDrawn: signal(true),
      getContext: () => ({
        partyName: gameService.gameInfo()?.name ?? '',
        partyId: gameService.gameInfo()?.id ?? '',
        isHost: gameService.isGameClient(),
      }),
      dispatchPauseGameAction: vi.fn(),
      dispatchResumeGameAction: vi.fn(),
    };
    lobbyService = {
      title: signal<string | undefined>('Hygge aften'),
      partyId: signal<string | undefined>('LOBBY1234'),
      isHost: signal(false),
      getContext: () => ({
        partyName: lobbyService.title() ?? '',
        partyId: lobbyService.partyId() ?? '',
        isHost: lobbyService.isHost(),
      }),
    };
    drawers = createDrawerServiceStub();
    const gameTimer = { currentDuration: signal<number | undefined>(3_723_000) };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: '',
            component: PartyShellComponent,
            children: [
              { path: 'lobby', component: PhaseStub, data: { phase: 'lobby' } },
              { path: 'game', component: PhaseStub, data: { phase: 'game' } },
            ],
          },
        ]),
        provideEnvironmentNgxMask(),
        { provide: GameService, useValue: gameService },
        { provide: LobbyService, useValue: lobbyService },
        {
          provide: TimerService,
          useValue: { getTimer: (type: TimerType) => type === TimerType.GAME && gameTimer },
        },
        { provide: DrawerService, useValue: drawers },
        {
          provide: BreakpointObserver,
          useValue: { observe: () => of({ matches: false, breakpoints: {} }) },
        },
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function render(url: '/game' | '/lobby'): Promise<HTMLElement> {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    await harness.fixture.whenStable();
    return harness.fixture.nativeElement.querySelector('app-party-shell');
  }

  function iconButton(shell: HTMLElement, icon: string): HTMLButtonElement {
    const match = Array.from(
      shell.querySelectorAll('.buttons button') as NodeListOf<HTMLButtonElement>,
    ).find((button) => button.textContent?.trim() === icon);
    if (!match) throw new Error(`No "${icon}" button`);
    return match;
  }

  function hasIconButton(shell: HTMLElement, icon: string): boolean {
    return Array.from(shell.querySelectorAll('.buttons button')).some(
      (button) => button.textContent?.trim() === icon,
    );
  }

  describe('in a game', () => {
    it('shows the game name, round and game time', async () => {
      // Arrange
      gameService.currentRound.set(4);

      // Act
      const shell = await render('/game');

      // Assert
      expect(shell.querySelector('.header h2')?.textContent).toBe('Friday game');
      expect(shell.textContent).toContain('Runde 4 af 13');
      expect(shell.querySelector('.time h1')?.textContent).toBe('01:02:03');
    });

    it('pauses a running game', async () => {
      // Arrange
      gameService.gameTimeReport.set(aTimeReport({ state: TimerState.Running }));
      const shell = await render('/game');

      // Act
      iconButton(shell, 'pause').click();

      // Assert
      expect(gameService.dispatchPauseGameAction).toHaveBeenCalledOnce();
    });

    it('cannot pause a game that is already paused', async () => {
      // Arrange
      gameService.gameTimeReport.set(aTimeReport({ state: TimerState.Paused }));

      // Act
      const shell = await render('/game');

      // Assert
      expect(iconButton(shell, 'pause').disabled).toBe(true);
    });

    it('cannot pause a game that has not started', async () => {
      // Arrange
      gameService.gameTimeReport.set(undefined);

      // Act
      const shell = await render('/game');

      // Assert
      expect(iconButton(shell, 'pause').disabled).toBe(true);
    });

    it('does not show the timer controls to players', async () => {
      // Arrange
      gameService.isGameClient.set(false);

      // Act
      const shell = await render('/game');

      // Assert
      expect(hasIconButton(shell, 'pause')).toBe(false);
      expect(hasIconButton(shell, 'play_arrow')).toBe(false);
    });

    it('opens the player overview', async () => {
      // Arrange
      const shell = await render('/game');

      // Act
      iconButton(shell, 'group').click();

      // Assert
      expect(drawers.showPlayerOverviewDrawer).toHaveBeenCalledOnce();
    });

    it('opens the share drawer for the game', async () => {
      // Arrange
      const shell = await render('/game');

      // Act
      iconButton(shell, 'share').click();

      // Assert
      expect(drawers.showPartyShareDrawer).toHaveBeenCalledWith(PARTY_ID);
    });

    it.each([
      ['no game info', undefined],
      ['an empty party id', { id: '', name: 'Friday game' }],
    ])('does not open the share drawer with %s', async (_, gameInfo) => {
      // Arrange
      gameService.gameInfo.set(gameInfo);
      const shell = await render('/game');

      // Act
      iconButton(shell, 'share').click();

      // Assert
      expect(drawers.showPartyShareDrawer).not.toHaveBeenCalled();
    });
  });

  describe('in a lobby', () => {
    it('shows the lobby name and party id without the game controls', async () => {
      // Arrange
      lobbyService.title.set('Hygge aften');

      // Act
      const shell = await render('/lobby');

      // Assert
      expect(shell.querySelector('.header h2')?.textContent).toBe('Hygge aften');
      expect(shell.textContent).toContain('Party-ID • LOB-BY1-234');
      expect(hasIconButton(shell, 'pause')).toBe(false);
      expect(hasIconButton(shell, 'group')).toBe(false);
    });

    it('opens the share drawer for the lobby', async () => {
      // Arrange
      const shell = await render('/lobby');

      // Act
      iconButton(shell, 'share').click();

      // Assert
      expect(drawers.showPartyShareDrawer).toHaveBeenCalledWith('LOBBY1234');
    });

    it('does not open the share drawer without a party id', async () => {
      // Arrange
      lobbyService.partyId.set(undefined);
      const shell = await render('/lobby');

      // Act
      iconButton(shell, 'share').click();

      // Assert
      expect(drawers.showPartyShareDrawer).not.toHaveBeenCalled();
    });
  });
});
