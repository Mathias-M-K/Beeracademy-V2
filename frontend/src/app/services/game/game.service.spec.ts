import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { GameService } from './game.service';
import { WebsocketService } from '../websocket.service';
import { OverlayService } from '../overlay/overlay.service';
import { ToastService } from '../toast/toast.service';
import { DrawerService } from '../drawer/drawer.service';
import { FakeWebsocketService } from '../../../testing/fake-websocket.service';
import {
  createDrawerServiceStub,
  createOverlayServiceStub,
  createToastServiceStub,
  DrawerServiceStub,
  OverlayServiceStub,
  ToastServiceStub,
} from '../../../testing/stubs';
import {
  aCard,
  aGameDto,
  aTimeReport,
  aTimerReports,
  gameEvents,
  PARTY_ID,
  PLAYER_1,
  PLAYER_2,
  PLAYER_3,
} from '../../../testing/game-builders';
import { silenceConsole } from '../../../testing/console';
import { flushMicrotasks } from '../../../testing/async';
import { GameDto } from '../../../api-models/model/gameDto';
import { GameState } from '../../../api-models/model/gameState';
import { Role } from '../../../api-models/model/role';
import { Suit } from '../../../api-models/model/suit';
import { TimerState } from '../../../api-models/model/timerState';
import { WebsocketCode } from '../../../api-models/model/websocketCode';
import { ChugOverlay } from '../../overlay/chug-overlay/chug-overlay';
import { ReconnectingOverlay } from '../../overlay/reconnecting-overlay/reconnecting-overlay';
import { PLAYER_COLORS } from '../../common/theme/player-colors';

describe('GameService', () => {
  let service: GameService;
  let websocket: FakeWebsocketService;
  let overlays: OverlayServiceStub;
  let drawers: DrawerServiceStub;
  let toasts: ToastServiceStub;
  let navigate: ReturnType<typeof vi.spyOn>;
  let onVisibilityChange: () => void;

  beforeEach(() => {
    silenceConsole();

    // GameService registers a document listener it never removes; capture it instead of
    // letting listeners from every test pile up on the shared jsdom document.
    const addEventListener = document.addEventListener.bind(document);
    vi.spyOn(document, 'addEventListener').mockImplementation((type, listener, options) => {
      if (type === 'visibilitychange') {
        onVisibilityChange = listener as () => void;
        return;
      }
      addEventListener(type, listener, options);
    });

    websocket = new FakeWebsocketService();
    overlays = createOverlayServiceStub();
    drawers = createDrawerServiceStub();
    toasts = createToastServiceStub();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: WebsocketService, useValue: websocket },
        { provide: OverlayService, useValue: overlays },
        { provide: DrawerService, useValue: drawers },
        { provide: ToastService, useValue: toasts },
      ],
    });

    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    service = TestBed.inject(GameService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function connect(): Promise<void> {
    const connection = service.connectToWebsocket();
    await websocket.acceptConnection();
    await connection;
  }

  async function joinGame(game: GameDto, role: Role = Role.GameClient): Promise<void> {
    await connect();
    await websocket.emit(gameEvents.snapshot(game));
    await websocket.emit(gameEvents.identity('client-1', role));
  }

  function setPageVisibility(state: DocumentVisibilityState): void {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(state);
  }

  describe('game snapshot', () => {
    it('exposes the game through its signals', async () => {
      // Arrange
      const game = aGameDto({ currentRound: 4, lastCard: aCard(7), nextPlayerToDraw: PLAYER_2 });

      // Act
      await joinGame(game);

      // Assert
      expect(service.gameInfo()).toEqual({ id: PARTY_ID, name: 'Friday game' });
      expect(service.gameState()).toBe(GameState.InProgress);
      expect(service.currentRound()).toBe(4);
      expect(service.currentCard()).toEqual(aCard(7));
      expect(service.currentPlayer()?.id).toBe(PLAYER_2);
      expect(service.remainingCardsByRank()).toEqual(game.remainingCardsCount);
      expect(service.gameTimeReport()).toEqual(game.timerReports?.gameTimeReport);
      expect(service.playerTimeReport()).toEqual(game.timerReports?.playerTimeReport);
    });

    it('maps players and colours them by seat', async () => {
      // Arrange
      const game = aGameDto();

      // Act
      await joinGame(game);

      // Assert
      expect(service.players().map((player) => [player.id, player.color])).toEqual([
        [PLAYER_1, PLAYER_COLORS[0]],
        [PLAYER_2, PLAYER_COLORS[1]],
        [PLAYER_3, PLAYER_COLORS[2]],
      ]);
    });

    it('caps the displayed round at 13', async () => {
      // Arrange
      const game = aGameDto({ currentRound: 14 });

      // Act
      await joinGame(game);

      // Assert
      expect(service.currentRound()).toBe(13);
    });

    it('has no game info when the party id is missing', async () => {
      // Arrange
      const game = aGameDto({ partyId: undefined });

      // Act
      await joinGame(game);

      // Assert
      expect(service.gameInfo()).toBeUndefined();
    });

    it('treats the player who drew last as current while awaiting a chug', async () => {
      // Arrange
      const game = aGameDto({
        gameState: GameState.AwaitingChug,
        lastPlayerToDraw: PLAYER_3,
        nextPlayerToDraw: PLAYER_1,
      });

      // Act
      await joinGame(game);

      // Assert
      expect(service.currentPlayer()?.id).toBe(PLAYER_3);
    });

    it('opens the chug overlay when the game is awaiting a chug', async () => {
      // Arrange
      const game = aGameDto({ gameState: GameState.AwaitingChug, lastPlayerToDraw: PLAYER_2 });

      // Act
      await joinGame(game);

      // Assert
      expect(overlays.openOverlay).toHaveBeenCalledOnce();
      expect(overlays.openOverlay).toHaveBeenCalledWith({
        component: ChugOverlay,
        data: expect.objectContaining({ playerToChug: expect.objectContaining({ id: PLAYER_2 }) }),
      });
      expect(service.playerTimeReport()?.state).toBe(TimerState.Paused);
    });

    it('opens only one chug overlay when the same chug arrives twice', async () => {
      // Arrange
      const game = aGameDto({ gameState: GameState.AwaitingChug, lastPlayerToDraw: PLAYER_2 });
      await joinGame(game);

      // Act
      await websocket.emit(gameEvents.snapshot(game));

      // Assert
      expect(overlays.openOverlay).toHaveBeenCalledOnce();
    });

    it('starts a game that is awaiting start', async () => {
      // Arrange
      const game = aGameDto({ gameState: GameState.AwaitingStart });

      // Act
      await joinGame(game);

      // Assert
      expect(websocket.sent).toEqual([
        { category: 'GAME_CLIENT_ACTION', payload: { type: 'START_GAME' } },
      ]);
    });

    it('opens the pause panel when the game timer is paused', async () => {
      // Arrange
      const game = aGameDto({
        timerReports: aTimerReports({ gameTimeReport: aTimeReport({ state: TimerState.Paused }) }),
      });

      // Act
      await joinGame(game);

      // Assert
      expect(drawers.showGamePausedDrawer).toHaveBeenCalledOnce();
    });
  });

  describe('identity', () => {
    it('recognises a game client', async () => {
      // Arrange
      const game = aGameDto();

      // Act
      await joinGame(game, Role.GameClient);

      // Assert
      expect(service.isGameClient()).toBe(true);
    });

    it('recognises a player client as not a game client', async () => {
      // Arrange
      const game = aGameDto();

      // Act
      await joinGame(game, Role.PlayerClient);

      // Assert
      expect(service.isGameClient()).toBe(false);
    });

    // known-issues: GameService.isPlayer negates the signal instead of its value
    it.fails('recognises a player client as a player', async () => {
      // Arrange
      const game = aGameDto();

      // Act
      await joinGame(game, Role.PlayerClient);

      // Assert
      expect(service.isPlayer()).toBe(true);
    });
  });

  describe('card drawn', () => {
    it('shows the card, advances the turn and records it on the drawer', async () => {
      // Arrange
      await joinGame(aGameDto({ lastCard: aCard(3) }));

      // Act
      await websocket.emit(
        gameEvents.drawCard({ card: aCard(9, Suit.Club), drawnBy: PLAYER_1, nextToDraw: PLAYER_2 }),
      );

      // Assert
      expect(service.currentCard()).toEqual(aCard(9, Suit.Club));
      expect(service.currentPlayer()?.id).toBe(PLAYER_2);
      expect(service.players()[0].stats?.turns).toEqual([
        { round: 1, card: aCard(9, Suit.Club), durationInMillis: 500 },
      ]);
    });

    it('decrements the remaining count of the drawn rank only', async () => {
      // Arrange
      await joinGame(aGameDto());

      // Act
      await websocket.emit(
        gameEvents.drawCard({ card: aCard(9), drawnBy: PLAYER_1, nextToDraw: PLAYER_2 }),
      );

      // Assert
      const counts = service.remainingCardsByRank();
      expect(counts.find((entry) => entry.rank === 9)?.count).toBe(2);
      expect(counts.filter((entry) => entry.count === 3)).toHaveLength(12);
    });

    it('starts the game timer on the first card of the game', async () => {
      // Arrange
      await joinGame(
        aGameDto({
          timerReports: aTimerReports({
            gameTimeReport: aTimeReport({ state: TimerState.NotStarted }),
          }),
        }),
      );

      // Act
      await websocket.emit(
        gameEvents.drawCard({ card: aCard(9), drawnBy: PLAYER_1, nextToDraw: PLAYER_2 }),
      );

      // Assert
      expect(service.gameTimeReport()?.state).toBe(TimerState.Running);
    });

    it('starts the player timer when the last player finishes the first round', async () => {
      // Arrange
      await joinGame(
        aGameDto({
          lastCard: aCard(3),
          nextPlayerToDraw: PLAYER_3,
          timerReports: aTimerReports({
            playerTimeReport: aTimeReport({ state: TimerState.NotStarted }),
          }),
        }),
      );

      // Act
      await websocket.emit(
        gameEvents.drawCard({ card: aCard(9), drawnBy: PLAYER_3, nextToDraw: PLAYER_1 }),
      );

      // Assert
      expect(service.playerTimeReport()?.state).toBe(TimerState.Running);
    });

    it('starts a new round when the turn passes back to the first player', async () => {
      // Arrange
      await joinGame(aGameDto({ lastCard: aCard(3), nextPlayerToDraw: PLAYER_3 }));

      // Act
      await websocket.emit(
        gameEvents.drawCard({ card: aCard(9), drawnBy: PLAYER_3, nextToDraw: PLAYER_1 }),
      );

      // Assert
      expect(service.currentRound()).toBe(2);
    });

    it('resets the player timer between turns after the first round', async () => {
      // Arrange
      await joinGame(aGameDto({ currentRound: 2, lastCard: aCard(3) }));

      // Act
      await websocket.emit(
        gameEvents.drawCard({ card: aCard(9), drawnBy: PLAYER_1, nextToDraw: PLAYER_2 }),
      );

      // Assert
      expect(service.playerTimeReport()).toEqual(
        expect.objectContaining({ elapsedTime: 0, activeTime: 0 }),
      );
    });

    it('keeps the drawer as current player and opens the chug overlay on an ace', async () => {
      // Arrange
      await joinGame(aGameDto({ lastCard: aCard(3) }));

      // Act
      await websocket.emit(
        gameEvents.drawCard({ card: aCard(14), drawnBy: PLAYER_1, nextToDraw: PLAYER_2 }),
      );

      // Assert
      expect(service.currentPlayer()?.id).toBe(PLAYER_1);
      expect(overlays.openOverlay).toHaveBeenCalledWith({
        component: ChugOverlay,
        data: {
          players: service.players(),
          playerToChug: expect.objectContaining({ id: PLAYER_1 }),
          isGameClient: true,
        },
      });
    });
  });

  describe('chug overlay', () => {
    async function openChugOverlay(role: Role): Promise<void> {
      await joinGame(aGameDto({ lastCard: aCard(3) }), role);
      await websocket.emit(
        gameEvents.drawCard({
          card: aCard(14, Suit.Spade),
          drawnBy: PLAYER_1,
          nextToDraw: PLAYER_2,
        }),
      );
    }

    it('registers the chug time when a game client closes the overlay', async () => {
      // Arrange
      await openChugOverlay(Role.GameClient);

      // Act
      await overlays.handles[0].close(4200);
      await flushMicrotasks();

      // Assert
      expect(websocket.sent).toEqual([
        {
          category: 'GAME_CLIENT_ACTION',
          payload: { type: 'REGISTER_CHUG', chug: { suit: Suit.Spade, chugTimeMillis: 4200 } },
        },
      ]);
    });

    it('does not register a chug when a player client closes the overlay', async () => {
      // Arrange
      await openChugOverlay(Role.PlayerClient);

      // Act
      await overlays.handles[0].close(4200);
      await flushMicrotasks();

      // Assert
      expect(websocket.sent).toEqual([]);
    });
  });

  describe('chug registered', () => {
    it('records the chug, moves on to the next player and resumes play', async () => {
      // Arrange
      await joinGame(
        aGameDto({
          gameState: GameState.AwaitingChug,
          lastPlayerToDraw: PLAYER_1,
          nextPlayerToDraw: PLAYER_2,
        }),
      );
      const chug = { suit: Suit.Heart, chugTimeMillis: 3100 };

      // Act
      await websocket.emit(gameEvents.chug({ chug, chuggedBy: PLAYER_1, nextToDraw: PLAYER_2 }));

      // Assert
      expect(service.players()[0].stats?.chugs).toEqual([chug]);
      expect(service.currentPlayer()?.id).toBe(PLAYER_2);
      expect(service.gameState()).toBe(GameState.InProgress);
    });

    it('hands the turn to the next player after an ace was chugged', async () => {
      // Arrange
      await joinGame(aGameDto({ lastCard: aCard(3) }), Role.PlayerClient);
      await websocket.emit(
        gameEvents.drawCard({ card: aCard(14), drawnBy: PLAYER_1, nextToDraw: PLAYER_2 }),
      );
      const chug = { suit: Suit.Heart, chugTimeMillis: 3100 };

      // Act
      await websocket.emit(gameEvents.chug({ chug, chuggedBy: PLAYER_1, nextToDraw: PLAYER_2 }));

      // Assert
      expect(service.currentPlayer()?.id).toBe(PLAYER_2);
    });

    it('closes the chug overlay', async () => {
      // Arrange
      await joinGame(aGameDto({ gameState: GameState.AwaitingChug, lastPlayerToDraw: PLAYER_1 }));
      const chug = { suit: Suit.Heart, chugTimeMillis: 3100 };

      // Act
      await websocket.emit(gameEvents.chug({ chug, chuggedBy: PLAYER_1, nextToDraw: PLAYER_2 }));

      // Assert
      await expect(overlays.handles[0].closed).resolves.toBeUndefined();
    });

    it('restarts the player timer after the first round', async () => {
      // Arrange
      await joinGame(
        aGameDto({
          currentRound: 3,
          gameState: GameState.AwaitingChug,
          lastPlayerToDraw: PLAYER_1,
        }),
      );
      const chug = { suit: Suit.Heart, chugTimeMillis: 3100 };

      // Act
      await websocket.emit(gameEvents.chug({ chug, chuggedBy: PLAYER_1, nextToDraw: PLAYER_2 }));

      // Assert
      expect(service.playerTimeReport()?.state).toBe(TimerState.Running);
    });

    // known-issues: server-driven overlay close is reported back as a user action
    it.fails('does not register a chug of its own when the server reports one', async () => {
      // Arrange
      await joinGame(aGameDto({ lastCard: aCard(3) }), Role.GameClient);
      await websocket.emit(
        gameEvents.drawCard({ card: aCard(14), drawnBy: PLAYER_1, nextToDraw: PLAYER_2 }),
      );
      const chug = { suit: Suit.Heart, chugTimeMillis: 3100 };

      // Act
      await websocket.emit(gameEvents.chug({ chug, chuggedBy: PLAYER_1, nextToDraw: PLAYER_2 }));

      // Assert
      expect(websocket.sent).toEqual([]);
    });
  });

  describe('game lifecycle', () => {
    it('marks the game as in progress when it starts', async () => {
      // Arrange
      await joinGame(aGameDto({ gameState: GameState.AwaitingStart }));

      // Act
      await websocket.emit(gameEvents.start());

      // Assert
      expect(service.gameState()).toBe(GameState.InProgress);
    });

    it('updates the timers and shows the pause panel when paused', async () => {
      // Arrange
      await joinGame(aGameDto({ currentRound: 2, nextPlayerToDraw: PLAYER_2 }));
      const reports = aTimerReports({
        gameTimeReport: aTimeReport({
          state: TimerState.Paused,
          activeTime: 60000,
          pausedTime: 5000,
          pauses: [1000, 1500],
        }),
        playerTimeReport: aTimeReport({ state: TimerState.Paused }),
      });

      // Act
      await websocket.emit(gameEvents.paused(reports));

      // Assert
      expect(service.gameTimeReport()).toEqual(reports.gameTimeReport);
      expect(service.playerTimeReport()).toEqual(reports.playerTimeReport);
      expect(drawers.showGamePausedDrawer).toHaveBeenCalledWith({
        cardsLeft: 39,
        currentRound: 2,
        currentPauseTime: 2500,
        currentPlayer: expect.objectContaining({ id: PLAYER_2 }),
        elapsedGameTime: 60000,
        partyId: PARTY_ID,
      });
    });

    it('shows a single pause panel for repeated pause events', async () => {
      // Arrange
      await joinGame(aGameDto());
      const reports = aTimerReports({ gameTimeReport: aTimeReport({ state: TimerState.Paused }) });

      // Act
      await websocket.emit(gameEvents.paused(reports));
      await websocket.emit(gameEvents.paused(reports));

      // Assert
      expect(drawers.showGamePausedDrawer).toHaveBeenCalledOnce();
    });

    it('resumes the game when a game client closes the pause panel', async () => {
      // Arrange
      await joinGame(aGameDto(), Role.GameClient);
      await websocket.emit(gameEvents.paused(aTimerReports()));

      // Act
      await drawers.handles[0].close();
      await flushMicrotasks();

      // Assert
      expect(websocket.lastSent()).toEqual({
        category: 'GAME_CLIENT_ACTION',
        payload: { type: 'RESUME_GAME' },
      });
    });

    it('does not resume the game when a player client closes the pause panel', async () => {
      // Arrange
      await joinGame(aGameDto(), Role.PlayerClient);
      await websocket.emit(gameEvents.paused(aTimerReports()));

      // Act
      await drawers.handles[0].close();
      await flushMicrotasks();

      // Assert
      expect(websocket.sent).toEqual([]);
    });

    it('updates the timers and closes the pause panel when resumed', async () => {
      // Arrange
      await joinGame(aGameDto(), Role.PlayerClient);
      await websocket.emit(gameEvents.paused(aTimerReports()));
      const reports = aTimerReports({ gameTimeReport: aTimeReport({ activeTime: 90000 }) });

      // Act
      await websocket.emit(gameEvents.resumed(reports));

      // Assert
      expect(service.gameTimeReport()).toEqual(reports.gameTimeReport);
      await expect(drawers.handles[0].closed).resolves.toBeUndefined();
    });

    // known-issues: server-driven overlay close is reported back as a user action
    it.fails('does not echo a resume when the server reports the game resumed', async () => {
      // Arrange
      await joinGame(aGameDto(), Role.GameClient);
      await websocket.emit(gameEvents.paused(aTimerReports()));

      // Act
      await websocket.emit(gameEvents.resumed(aTimerReports()));

      // Assert
      expect(websocket.sent).toEqual([]);
    });

    it('finishes the game, pauses both timers and dismisses open overlays', async () => {
      // Arrange
      await joinGame(aGameDto(), Role.PlayerClient);
      await websocket.emit(gameEvents.paused(aTimerReports()));

      // Act
      await websocket.emit(gameEvents.end(aTimerReports()));

      // Assert
      expect(service.gameState()).toBe(GameState.Finished);
      expect(service.gameTimeReport()?.state).toBe(TimerState.Paused);
      expect(service.playerTimeReport()?.state).toBe(TimerState.Paused);
      await expect(drawers.handles[0].closed).resolves.toBeUndefined();
    });

    // known-issues: dismissing overlays on game end dispatches their close actions
    it.fails(
      'sends nothing when the game ends while a game client has the chug overlay open',
      async () => {
        // Arrange
        await joinGame(aGameDto({ lastCard: aCard(3) }), Role.GameClient);
        await websocket.emit(
          gameEvents.drawCard({ card: aCard(14), drawnBy: PLAYER_1, nextToDraw: PLAYER_2 }),
        );

        // Act
        await websocket.emit(gameEvents.end(aTimerReports()));

        // Assert
        expect(websocket.sent).toEqual([]);
      },
    );

    it('disconnects and clears the game when the game page is destroyed', async () => {
      // Arrange
      await joinGame(aGameDto({ gameState: GameState.AwaitingChug }), Role.GameClient);

      // Act
      service.onGamePageDestroyed();
      await flushMicrotasks();

      // Assert
      expect(websocket.disconnect).toHaveBeenCalledOnce();
      expect(service.gameInfo()).toBeUndefined();
      expect(service.players()).toEqual([]);
      await expect(overlays.handles[0].closed).resolves.toBeUndefined();
      expect(websocket.sent).toEqual([]);
      expect(websocket.connectionAttempts).toBe(1);
    });
  });

  describe('player sessions', () => {
    it.each([
      ['connects', gameEvents.playerConnected, { isConnected: true, isClaimed: true }],
      ['disconnects', gameEvents.playerDisconnected, { isConnected: false, isClaimed: true }],
      ['is released', gameEvents.playerReleased, { isConnected: false, isClaimed: false }],
      [
        'is kicked',
        (id: string) => gameEvents.playerKicked(id),
        { isConnected: false, isClaimed: false },
      ],
    ])('updates the session when a player %s', async (_, event, expectedSession) => {
      // Arrange
      await joinGame(aGameDto());

      // Act
      await websocket.emit(event(PLAYER_2));

      // Assert
      expect(service.players()[1].sessionInfo).toEqual(expectedSession);
      expect(service.players()[0].sessionInfo).toEqual({ isConnected: true, isClaimed: true });
    });

    it('tracks each release request once', async () => {
      // Arrange
      await joinGame(aGameDto());

      // Act
      await websocket.emit(gameEvents.releaseRequested(PLAYER_2));
      await websocket.emit(gameEvents.releaseRequested(PLAYER_3));
      await websocket.emit(gameEvents.releaseRequested(PLAYER_2));

      // Assert
      expect(service.releaseRequests()).toEqual([PLAYER_2, PLAYER_3]);
    });

    it('drops the release request when the player connects', async () => {
      // Arrange
      await joinGame(aGameDto());
      await websocket.emit(gameEvents.releaseRequested(PLAYER_2));

      // Act
      await websocket.emit(gameEvents.playerConnected(PLAYER_2));

      // Assert
      expect(service.releaseRequests()).toEqual([]);
    });

    it('drops the release request and releases the player', async () => {
      // Arrange
      await joinGame(aGameDto());
      await websocket.emit(gameEvents.releaseRequested(PLAYER_2));

      // Act
      service.dispatchReleaseAction(PLAYER_2);

      // Assert
      expect(service.releaseRequests()).toEqual([]);
      expect(websocket.lastSent()).toEqual({
        category: 'GAME_CLIENT_ACTION',
        payload: { type: 'RELEASE_PLAYER', playerId: PLAYER_2 },
      });
    });
  });

  describe('dispatching actions', () => {
    it.each([
      ['pause', () => service.dispatchPauseGameAction(), { type: 'PAUSE_GAME' }],
      ['resume', () => service.dispatchResumeGameAction(), { type: 'RESUME_GAME' }],
      ['start', () => service.dispatchStartGameAction(), { type: 'START_GAME' }],
      ['draw', () => service.dispatchDrawCardAction(1234), { type: 'DRAW_CARD', duration: 1234 }],
      [
        'kick',
        () => service.dispatchKickAction(PLAYER_3, 'Asleep'),
        { type: 'KICK_PLAYER', playerId: PLAYER_3, reason: 'Asleep' },
      ],
    ])('sends a %s action as a game client action', async (_, dispatch, payload) => {
      // Arrange
      await joinGame(aGameDto());

      // Act
      dispatch();

      // Assert
      expect(websocket.sent).toEqual([{ category: 'GAME_CLIENT_ACTION', payload }]);
    });

    it('registers a chug with the suit of the current card', async () => {
      // Arrange
      await joinGame(aGameDto({ lastCard: aCard(14, Suit.Moon) }));

      // Act
      service.dispatchChugAction(2500);

      // Assert
      expect(websocket.sent).toEqual([
        {
          category: 'GAME_CLIENT_ACTION',
          payload: { type: 'REGISTER_CHUG', chug: { suit: Suit.Moon, chugTimeMillis: 2500 } },
        },
      ]);
    });

    it('reconnects instead of sending when the socket is gone', async () => {
      // Arrange
      setPageVisibility('visible');
      await joinGame(aGameDto());
      websocket.connected = false;

      // Act
      service.dispatchPauseGameAction();

      // Assert
      expect(websocket.sent).toEqual([]);
      expect(websocket.connectToGameWebsocket).toHaveBeenLastCalledWith(15000);
    });
  });

  describe('unrecognised messages', () => {
    it('ignores messages from other categories', async () => {
      // Arrange
      await joinGame(aGameDto());

      // Act
      await websocket.emit({ ...gameEvents.start(), category: 'LOBBY_CLIENT_EVENT' });

      // Assert
      expect(service.gameState()).toBe(GameState.InProgress);
    });

    it('ignores unknown event types', async () => {
      // Arrange
      await joinGame(aGameDto());

      // Act
      const emitting = websocket.emit({
        category: 'GAME_EVENT',
        payload: { type: 'NOPE' },
      } as never);

      // Assert
      await expect(emitting).resolves.toBeUndefined();
    });
  });

  describe('connection', () => {
    it('rejects the initial connection without handling the error itself', async () => {
      // Arrange
      const connection = service.connectToWebsocket();

      // Act
      await websocket.rejectConnection(WebsocketCode.SessionOccupied);

      // Assert
      await expect(connection).rejects.toMatchObject({ cause: WebsocketCode.SessionOccupied });
      expect(toasts.showToast).not.toHaveBeenCalled();
      expect(navigate).not.toHaveBeenCalled();
    });

    it('sends the user to the start page when the game no longer exists', async () => {
      // Arrange
      await joinGame(aGameDto());

      // Act
      await websocket.dropConnection(WebsocketCode.GameNotFound);

      // Assert
      expect(toasts.showToast).toHaveBeenCalledWith(
        'Der skete en fejl',
        'Spillet findes ikke længere',
        'error',
        'error',
      );
      expect(navigate).toHaveBeenCalledWith(['/']);
    });

    it('sends the user to the start page when kicked', async () => {
      // Arrange
      await joinGame(aGameDto());

      // Act
      await websocket.dropConnection(WebsocketCode.Kicked);

      // Assert
      expect(toasts.showToast).toHaveBeenCalledWith(
        'Fjernet fra spillet',
        'Du blev fjernet fra spillet',
        'sports_martial_arts',
      );
      expect(navigate).toHaveBeenCalledWith(['/']);
    });

    it('sends the user to the start page on an unexpected close code', async () => {
      // Arrange
      await joinGame(aGameDto());

      // Act
      await websocket.dropConnection(WebsocketCode.Unknown);

      // Assert
      expect(toasts.showToast).toHaveBeenCalledWith(
        'Der skete en fejl',
        'Kunne ikke forbinde til spillet',
        'error',
        'error',
      );
      expect(navigate).toHaveBeenCalledWith(['/']);
    });

    it('does nothing when the connection closes cleanly', async () => {
      // Arrange
      await joinGame(aGameDto());

      // Act
      await websocket.closeConnection();

      // Assert
      expect(navigate).not.toHaveBeenCalled();
      expect(websocket.connectionAttempts).toBe(1);
    });

    it.each([
      WebsocketCode.GoingAway,
      WebsocketCode.AbnormalClosure,
      WebsocketCode.ServiceRestart,
      WebsocketCode.TryAgainLater,
    ])('reconnects behind an overlay after transient close code %i', async (code) => {
      // Arrange
      setPageVisibility('visible');
      await joinGame(aGameDto());

      // Act
      await websocket.dropConnection(code);

      // Assert
      expect(websocket.connectToGameWebsocket).toHaveBeenLastCalledWith(15000);
      expect(overlays.openOverlay).toHaveBeenCalledWith({ component: ReconnectingOverlay });
    });

    it('closes the reconnecting overlay once reconnected', async () => {
      // Arrange
      setPageVisibility('visible');
      await joinGame(aGameDto());
      await websocket.dropConnection(WebsocketCode.AbnormalClosure);

      // Act
      await websocket.acceptConnection();

      // Assert
      await expect(overlays.handles[0].closed).resolves.toBeUndefined();
      expect(navigate).not.toHaveBeenCalled();
    });

    it('waits for the page to become visible before reconnecting', async () => {
      // Arrange
      setPageVisibility('hidden');
      await joinGame(aGameDto());

      // Act
      await websocket.dropConnection(WebsocketCode.AbnormalClosure);

      // Assert
      expect(websocket.connectionAttempts).toBe(1);
    });

    it('reconnects a dropped game when the page becomes visible again', async () => {
      // Arrange
      setPageVisibility('hidden');
      await joinGame(aGameDto());
      await websocket.dropConnection(WebsocketCode.AbnormalClosure);
      setPageVisibility('visible');

      // Act
      onVisibilityChange();

      // Assert
      expect(websocket.connectionAttempts).toBe(2);
    });

    it('does not reconnect on visibility when still connected', async () => {
      // Arrange
      setPageVisibility('visible');
      await joinGame(aGameDto());

      // Act
      onVisibilityChange();

      // Assert
      expect(websocket.connectionAttempts).toBe(1);
    });

    it('does not reconnect on visibility when there is no game', () => {
      // Arrange
      setPageVisibility('visible');

      // Act
      onVisibilityChange();

      // Assert
      expect(websocket.connectionAttempts).toBe(0);
    });

    // known-issues: a failed reconnect never retries (isReconnecting is still set in .catch)
    it.fails('retries a reconnect that fails with a transient close code', async () => {
      // Arrange
      setPageVisibility('visible');
      await joinGame(aGameDto());
      await websocket.dropConnection(WebsocketCode.AbnormalClosure);

      // Act
      await websocket.rejectConnection(WebsocketCode.AbnormalClosure);

      // Assert
      expect(websocket.connectionAttempts).toBe(3);
    });

    // known-issues: a failed reconnect never retries, so the attempt limit is unreachable
    it.fails('gives up with a toast after three failed reconnects', async () => {
      // Arrange
      setPageVisibility('visible');
      await joinGame(aGameDto());
      await websocket.dropConnection(WebsocketCode.AbnormalClosure);

      // Act
      for (let attempt = 0; attempt < 3 && websocket.hasPendingConnection; attempt++) {
        await websocket.rejectConnection(WebsocketCode.AbnormalClosure);
      }

      // Assert
      expect(toasts.showToast).toHaveBeenCalledWith(
        'Kunne ikke forbinde',
        'Efter flere forsøg var det ikke muligt at forbinde til spillet',
        'error',
        'error',
      );
    });
  });
});
