import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GamePage } from './game-page';
import { GameService } from '../../services/game/game.service';
import { TimerService } from '../../services/timer-service/timer.service';
import { TimerType } from '../../services/timer-service/models/TimerType';
import { DrawerService } from '../../services/drawer/drawer.service';
import { createDrawerServiceStub, DrawerServiceStub } from '../../../testing/stubs';
import {
  aCard,
  aTimeReport,
  fullRankCounts,
  PARTY_ID,
  PLAYER_2,
  threePlayers,
} from '../../../testing/game-builders';
import { Player } from '../../services/game/models/player';
import { GameInfo } from '../../services/game/models/game-info';
import { Card } from '../../../api-models/model/card';
import { TimeReport } from '../../../api-models/model/timeReport';
import { TimerState } from '../../../api-models/model/timerState';

describe('GamePage', () => {
  let drawers: DrawerServiceStub;
  let playerTime: ReturnType<typeof signal<number | undefined>>;
  let gameService: {
    players: ReturnType<typeof signal<Player[]>>;
    gameInfo: ReturnType<typeof signal<GameInfo | undefined>>;
    currentCard: ReturnType<typeof signal<Card | undefined>>;
    currentPlayer: ReturnType<typeof signal<Player | undefined>>;
    currentRound: ReturnType<typeof signal<number>>;
    gameTimeReport: ReturnType<typeof signal<TimeReport | undefined>>;
    remainingCardsByRank: ReturnType<typeof signal<ReturnType<typeof fullRankCounts>>>;
    isGameClient: ReturnType<typeof signal<boolean>>;
    onGamePageDestroyed: ReturnType<typeof vi.fn>;
    dispatchStartGameAction: ReturnType<typeof vi.fn>;
    dispatchPauseGameAction: ReturnType<typeof vi.fn>;
    dispatchResumeGameAction: ReturnType<typeof vi.fn>;
    dispatchDrawCardAction: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    const players = threePlayers().map((dto) => Player.fromPlayerDto(dto));
    gameService = {
      players: signal(players),
      gameInfo: signal<GameInfo | undefined>({ id: PARTY_ID, name: 'Friday game' }),
      currentCard: signal<Card | undefined>(aCard(7)),
      currentPlayer: signal<Player | undefined>(players[1]),
      currentRound: signal(4),
      gameTimeReport: signal<TimeReport | undefined>(aTimeReport({ state: TimerState.Running })),
      remainingCardsByRank: signal(fullRankCounts()),
      isGameClient: signal(true),
      onGamePageDestroyed: vi.fn(),
      dispatchStartGameAction: vi.fn(),
      dispatchPauseGameAction: vi.fn(),
      dispatchResumeGameAction: vi.fn(),
      dispatchDrawCardAction: vi.fn(),
    };
    playerTime = signal<number | undefined>(4321);
    const timers = {
      [TimerType.GAME]: { currentDuration: signal<number | undefined>(3_723_000) },
      [TimerType.PLAYER]: { currentDuration: playerTime },
    };
    drawers = createDrawerServiceStub();

    TestBed.configureTestingModule({
      providers: [
        { provide: GameService, useValue: gameService },
        { provide: TimerService, useValue: { getTimer: (type: TimerType) => timers[type] } },
        { provide: DrawerService, useValue: drawers },
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function render() {
    const fixture = TestBed.createComponent(GamePage);
    await fixture.whenStable();
    return fixture;
  }

  async function pressSpace(fixture: ComponentFixture<GamePage>) {
    document.dispatchEvent(new KeyboardEvent('keyup', { key: ' ' }));
    await fixture.whenStable();
  }

  describe('game overview', () => {
    it('shows who is drawing', async () => {
      // Arrange
      gameService.currentPlayer.set(gameService.players()[1]);

      // Act
      const fixture = await render();

      // Assert
      expect(fixture.nativeElement.querySelector('.player-info h3').textContent).toBe('Player 2');
      expect(fixture.nativeElement.querySelector('app-player-card.is-drawing h2').textContent).toBe(
        'Player 2',
      );
    });

    it('lets the game end once the page is left', async () => {
      // Arrange
      const fixture = await render();

      // Act
      fixture.destroy();

      // Assert
      expect(gameService.onGamePageDestroyed).toHaveBeenCalledOnce();
    });
  });

  describe('drawing a card', () => {
    it("draws with the current player's time when the game client clicks the deck", async () => {
      // Arrange
      const fixture = await render();
      const deck: HTMLElement = fixture.nativeElement.querySelector('app-card.backside');

      // Act
      deck.click();

      // Assert
      expect(gameService.dispatchDrawCardAction).toHaveBeenCalledWith(4321);
    });

    it('draws when the game client presses Space', async () => {
      // Arrange
      const fixture = await render();

      // Act
      await pressSpace(fixture);

      // Assert
      expect(gameService.dispatchDrawCardAction).toHaveBeenCalledWith(4321);
    });

    it('draws with zero time when the player timer has no duration yet', async () => {
      // Arrange
      playerTime.set(undefined);
      const fixture = await render();

      // Act
      await pressSpace(fixture);

      // Assert
      expect(gameService.dispatchDrawCardAction).toHaveBeenCalledWith(0);
    });

    it('does not show the deck to players', async () => {
      // Arrange
      gameService.isGameClient.set(false);

      // Act
      const fixture = await render();

      // Assert
      expect(fixture.nativeElement.querySelector('app-card.backside')).toBeNull();
    });

    // known-issues: GamePage's document:keyup.space host listener is not gated to the game client, so players send DRAW_CARD game-client actions the backend rejects
    it.fails('does not draw when a player presses Space', async () => {
      // Arrange
      gameService.isGameClient.set(false);
      const fixture = await render();

      // Act
      await pressSpace(fixture);

      // Assert
      expect(gameService.dispatchDrawCardAction).not.toHaveBeenCalled();
    });
  });

  it('shows every player in the grid', async () => {
    // Arrange
    gameService.currentPlayer.set(gameService.players().find((player) => player.id === PLAYER_2));

    // Act
    const fixture = await render();

    // Assert
    const names = Array.from(
      fixture.nativeElement.querySelectorAll('app-player-card h2') as HTMLElement[],
    ).map((name) => name.textContent);
    expect(names).toEqual(['Player 1', 'Player 2', 'Player 3']);
  });
});
