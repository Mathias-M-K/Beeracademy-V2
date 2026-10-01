import { computed, Signal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BreakpointObserver } from '@angular/cdk/layout';
import { of } from 'rxjs';
import { MockInstance } from 'vitest';
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
import { PlayerTurn } from '../../services/game/models/playerTurn';

describe('GamePage', () => {
  let compact: boolean;
  let scrollTo: MockInstance<Element['scrollTo']>;
  let drawers: DrawerServiceStub;
  let playerTime: ReturnType<typeof signal<number | undefined>>;
  let gameService: {
    players: ReturnType<typeof signal<Player[]>>;
    gameInfo: ReturnType<typeof signal<GameInfo | undefined>>;
    currentCard: ReturnType<typeof signal<Card | undefined>>;
    currentPlayer: ReturnType<typeof signal<Player | undefined>>;
    previousPlayer: ReturnType<typeof signal<Player | undefined>>;
    nextPlayer: ReturnType<typeof signal<Player | undefined>>;
    turns: ReturnType<typeof signal<PlayerTurn[]>>;
    currentRound: ReturnType<typeof signal<number>>;
    gameTimeReport: ReturnType<typeof signal<TimeReport | undefined>>;
    remainingCardsByRank: ReturnType<typeof signal<ReturnType<typeof fullRankCounts>>>;
    changeOfDrawingAce: ReturnType<typeof signal<number>>;
    isGameClient: ReturnType<typeof signal<boolean>>;
    isPlayer: Signal<boolean>;
    onGamePageDestroyed: ReturnType<typeof vi.fn>;
    dispatchStartGameAction: ReturnType<typeof vi.fn>;
    dispatchPauseGameAction: ReturnType<typeof vi.fn>;
    dispatchResumeGameAction: ReturnType<typeof vi.fn>;
    dispatchDrawCardAction: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    const players = threePlayers().map((dto) => Player.fromPlayerDto(dto));
    const isGameClient = signal(true);
    gameService = {
      players: signal(players),
      gameInfo: signal<GameInfo | undefined>({ id: PARTY_ID, name: 'Friday game' }),
      currentCard: signal<Card | undefined>(aCard(7)),
      currentPlayer: signal<Player | undefined>(players[1]),
      previousPlayer: signal<Player | undefined>(players[0]),
      nextPlayer: signal<Player | undefined>(players[2]),
      turns: signal<PlayerTurn[]>([]),
      currentRound: signal(4),
      gameTimeReport: signal<TimeReport | undefined>(aTimeReport({ state: TimerState.Running })),
      remainingCardsByRank: signal(fullRankCounts()),
      changeOfDrawingAce: signal(7.69),
      isGameClient,
      isPlayer: computed(() => !isGameClient()),
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
    compact = false;
    Element.prototype.scrollTo = () => undefined;
    scrollTo = vi.spyOn(Element.prototype, 'scrollTo');

    TestBed.configureTestingModule({
      providers: [
        { provide: GameService, useValue: gameService },
        { provide: TimerService, useValue: { getTimer: (type: TimerType) => timers[type] } },
        { provide: DrawerService, useValue: drawers },
        {
          provide: BreakpointObserver,
          useValue: { observe: () => of({ matches: compact, breakpoints: {} }) },
        },
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete (Element.prototype as Partial<Element>).scrollTo;
  });

  async function render() {
    const fixture = TestBed.createComponent(GamePage);
    await fixture.whenStable();
    return fixture;
  }

  function pageScroller(fixture: ComponentFixture<GamePage>): HTMLElement {
    return fixture.nativeElement.querySelector('.pages');
  }

  function pageSegments(fixture: ComponentFixture<GamePage>): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('segmented-control .segment p'));
  }

  function selectedPage(fixture: ComponentFixture<GamePage>): string {
    return fixture.nativeElement
      .querySelector('segmented-control .segment.selected p')
      .textContent.trim();
  }

  /** Holds animation frames back so a test decides when the next frame runs. */
  function captureAnimationFrames(): { flush(): void } {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      frames.push(callback),
    );
    return { flush: () => frames.splice(0).forEach((frame) => frame(0)) };
  }

  /** Lays the two pages out 300px apart and scrolls the 300px wide scroller to `scrollLeft`. */
  function layOutPages(fixture: ComponentFixture<GamePage>, scrollLeft: number) {
    const pages = Array.from(pageScroller(fixture).querySelectorAll('.page')) as HTMLElement[];
    pages.forEach((page, index) => {
      Object.defineProperty(page, 'offsetLeft', { configurable: true, value: index * 300 });
      page.getBoundingClientRect = () => ({ left: index * 300 - scrollLeft }) as DOMRect;
    });
    pageScroller(fixture).getBoundingClientRect = () => ({ left: 0 }) as DOMRect;
    pageScroller(fixture).scrollLeft = scrollLeft;
  }

  function drawButton(fixture: ComponentFixture<GamePage>): HTMLButtonElement {
    return fixture.nativeElement.querySelector('app-draw-panel .buttons button');
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
      expect(fixture.nativeElement.querySelector('#current-player').textContent).toBe('Player 2');
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
    it("draws with the current player's time when the game client clicks draw", async () => {
      // Arrange
      const fixture = await render();

      // Act
      drawButton(fixture).click();

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

    it('disables drawing for players', async () => {
      // Arrange
      gameService.isGameClient.set(false);

      // Act
      const fixture = await render();

      // Assert
      expect(drawButton(fixture).disabled).toBe(true);
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

  describe('pages on a compact screen', () => {
    it('has no page switch on a wide screen', async () => {
      // Arrange
      compact = false;

      // Act
      const fixture = await render();

      // Assert
      expect(fixture.nativeElement.querySelector('segmented-control')).toBeNull();
    });

    it('starts on the game page', async () => {
      // Arrange
      compact = true;

      // Act
      const fixture = await render();

      // Assert
      expect(pageSegments(fixture).map((segment) => segment.textContent?.trim())).toEqual([
        'Spil',
        'Podie',
      ]);
      expect(selectedPage(fixture)).toBe('Spil');
    });

    it('scrolls to the podium when its segment is selected', async () => {
      // Arrange
      compact = true;
      const fixture = await render();
      layOutPages(fixture, 0);
      scrollTo.mockClear();

      // Act
      pageSegments(fixture)[1].click();
      await fixture.whenStable();

      // Assert
      expect(selectedPage(fixture)).toBe('Podie');
      expect(scrollTo.mock.contexts).toEqual([pageScroller(fixture)]);
      expect(scrollTo).toHaveBeenCalledWith({ left: 300, behavior: 'smooth' });
    });

    it('follows a swipe once per animation frame without scrolling back', async () => {
      // Arrange
      compact = true;
      const frames = captureAnimationFrames();
      const fixture = await render();
      pageScroller(fixture).dispatchEvent(new Event('pointerdown'));
      layOutPages(fixture, 280);
      scrollTo.mockClear();

      // Act
      pageScroller(fixture).dispatchEvent(new Event('scroll'));
      pageScroller(fixture).dispatchEvent(new Event('scroll'));
      await fixture.whenStable();
      const beforeFrame = selectedPage(fixture);
      frames.flush();
      await fixture.whenStable();

      // Assert
      expect(beforeFrame).toBe('Spil');
      expect(selectedPage(fixture)).toBe('Podie');
      expect(scrollTo).not.toHaveBeenCalled();
    });

    it('ignores scrolling it did not start from a swipe', async () => {
      // Arrange
      compact = true;
      const frames = captureAnimationFrames();
      const fixture = await render();
      layOutPages(fixture, 280);

      // Act
      pageScroller(fixture).dispatchEvent(new Event('scroll'));
      frames.flush();
      await fixture.whenStable();

      // Assert
      expect(selectedPage(fixture)).toBe('Spil');
    });

    it('selects the page a swipe settles on', async () => {
      // Arrange
      compact = true;
      const fixture = await render();
      pageScroller(fixture).dispatchEvent(new Event('pointerdown'));
      layOutPages(fixture, 280);

      // Act
      pageScroller(fixture).dispatchEvent(new Event('scrollend'));
      await fixture.whenStable();

      // Assert
      expect(selectedPage(fixture)).toBe('Podie');
    });
  });
});
