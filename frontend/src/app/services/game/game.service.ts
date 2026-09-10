import {computed, inject, Service, linkedSignal, signal, WritableSignal} from '@angular/core';
import {WebsocketEnvelope} from '../models/websocket-envelope';
import {GameDto} from '../../../api-models/model/gameDto';
import {Chug} from '../../../api-models/model/chug';
import {Turn} from '../../../api-models/model/turn';
import {GameInfo} from './models/game-info';
import {drawCardAction} from '../models/categories/actions/game/game-client-action/draw-card-action';
import {GameEventEnvelope} from '../models/categories/events/game/game-event-envelope';
import {DrawCardEvent} from '../models/categories/events/game/game-event/draw-card-event';
import {TimerState} from '../../../api-models/model/timerState';
import {pauseGameAction} from '../models/categories/actions/game/game-client-action/pause-game-action';
import {resumeGameAction} from '../models/categories/actions/game/game-client-action/resume-game-action';
import {GamePausedEvent} from '../models/categories/events/game/game-event/game-paused-event';
import {GameResumedEvent} from '../models/categories/events/game/game-event/game-resumed-event';
import {chugAction} from '../models/categories/actions/game/game-client-action/chug-action';
import {ChugEvent} from '../models/categories/events/game/game-event/chug-event';
import {GameState} from '../../../api-models/model/gameState';
import {TimeReport} from '../../../api-models/model/timeReport';
import {GameEndEvent} from '../models/categories/events/game/game-event/game-end-event';
import {WebsocketService} from '../websocket.service';
import {GameAction} from '../models/categories/actions/game/game-action';
import {startGameAction} from '../models/categories/actions/game/game-client-action/start-game-action';
import {gameClientActionEnvelope} from '../models/categories/actions/game/game-action-envelope';
import {OverlayService} from '../overlay/overlay.service';
import {ChugOverlay} from '../../overlay/chug-overlay/chug-overlay';
import {Player} from './models/player';
import {playerColor} from '../../common/theme/player-colors';
import {ToastService} from '../toast/toast.service';
import {ToastState} from '../../overlay/toast/models/toast-data';
import {GameStateEvent} from '../models/categories/events/game/common/game-state-event';
import {identifyFromEvent, Identity} from '../models/identity';
import {IdentityEvent} from '../models/categories/events/common/identity-event';
import {BeerLoaderOverlay} from '../../overlay/beer-loader-overlay/beer-loader-overlay';
import {Role} from '../../../api-models/model/role';
import {Router} from '@angular/router';
import {OverlayHandle} from '../overlay/models/overlay-handle';
import {GamePausedData} from '../../drawer/game-paused-drawer/models/game-paused-data';
import {ChugOverlayData} from '../../overlay/chug-overlay/models/chug-overlay-data';
import {ReconnectingOverlay} from '../../overlay/reconnecting-overlay/reconnecting-overlay';
import {WebsocketCodes} from '../../../api-models/model/websocketCodes';
import {releasePlayerAction} from '../models/categories/actions/game/game-client-action/release-player-action';
import {PlayerConnectedEvent} from '../models/categories/events/game/player-client-event/player-connected-event';
import {PlayerDisconnectedEvent} from '../models/categories/events/game/player-client-event/player-disconnected-event';
import {PlayerReleasedEvent} from '../models/categories/events/game/game-event/player-released-event';
import {kickPlayerAction} from '../models/categories/actions/game/game-client-action/kick-player-action';
import {PlayerKickedEvent} from '../models/categories/events/game/game-event/player-kicked-event';
import {
  PlayerReleaseRequestedEvent
} from '../models/categories/events/game/game-client-event/player-release-requested.event';
import {DrawerService} from '../drawer/drawer.service';

//TODO The way the timers work and integrates is weird, or at least I don't understand it - Look at new DumbTimer, it's the way to go
@Service()
export class GameService {

  private readonly websocketService = inject(WebsocketService);
  private readonly overlayService = inject(OverlayService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly drawerService = inject(DrawerService);

  private readonly gameStateObj = signal<GameDto | undefined>(undefined);
  public gameTimeReport = linkedSignal(() => this.gameStateObj()?.timerReports?.gameTimeReport);
  public playerTimeReport = linkedSignal(() => this.gameStateObj()?.timerReports?.playerTimeReport);

  private readonly playerDTOs = computed(() => this.gameStateObj()?.players ?? []);
  public players = linkedSignal(() => {
    return this.playerDTOs().map((dto, index) => {
      const player = Player.fromPlayerDto(dto);
      player.color = playerColor(index);
      return player;
    })
  })
  public gameInfo = linkedSignal<GameInfo | undefined>(() => {
    const state = this.gameStateObj();
    if (!state?.partyId || !state?.name) {
      return undefined;
    }

    const gameInfo: GameInfo = {
      id: state.partyId,
      name: state.name
    };

    return gameInfo;
  });
  public gameState = linkedSignal(() => this.gameStateObj()?.gameState);
  private readonly _currentRound = linkedSignal(() => this.gameStateObj()?.currentRound ?? 0);
  public readonly currentRound = computed(() => {
    return Math.min(13, this._currentRound());
  })
  public currentCard = linkedSignal(() => this.gameStateObj()?.lastCard);

  private readonly currentPlayerId = linkedSignal(() => {
    if (this.gameState() === GameState.AwaitingChug) {
      return this.gameStateObj()?.lastPlayerToDraw;
    }
    // return this.currentCard()?.rank === 14 ? this.gameStateObj()?.lastPlayerToDraw : this.gameStateObj()?.nextPlayerToDraw
    return this.gameStateObj()?.nextPlayerToDraw
  });
  public readonly currentPlayer = computed(() => {
    const id = this.currentPlayerId();
    if (!id) return undefined;
    return this.players().find((player) => player.id === id);
  });

  private readonly _remainingCardsByRank = linkedSignal(() => this.gameStateObj()?.remainingCardsCount ?? []);
  public readonly remainingCardsByRank = this._remainingCardsByRank.asReadonly();

  private readonly remainingCardsCount = computed(() => {
    return this._remainingCardsByRank()
      .reduce((total, rank) => total + (rank.count??0), 0);
  })

  private readonly identity = signal<Identity | undefined>(undefined)
  private readonly role = computed(() => this.identity()?.role);
  public readonly isGameClient = computed(() => this.role() === Role.GameClient);
  public readonly isPlayer = computed(() => !this.isGameClient);

  private readonly _releaseRequests = signal<string[]>([]);
  public readonly releaseRequests = this._releaseRequests.asReadonly();

  private gamePausedPanel?: OverlayHandle<void>;
  private chugOverlay?: OverlayHandle<number>;

  private isReconnecting: boolean = false;
  private reconnectCount: number = 0;
  private readonly reconnectCountLimit: number = 3;

  constructor() {
    document.addEventListener('visibilitychange', () => this.onPageGainFocus());
  }

  public connectToWebsocket(isReconnect: boolean = false, timeoutMs?: number) {

    let overlayHandle: OverlayHandle<void> | undefined;

    if (isReconnect) {
      this.reconnectCount++;
      overlayHandle = this.overlayService.openOverlay<void>({component: ReconnectingOverlay});
    } else {
      const loaderMsg = ['Henter øl', 'Blander kort', 'Varmer serveren op', 'Tjekker vejeret', 'Drikker en øl']
      overlayHandle = this.overlayService.openOverlay<void>({component: BeerLoaderOverlay, data: loaderMsg});
    }

    this.websocketService.connectToGameWebsocket(timeoutMs).then(msgObs => {
      this.reconnectCount = 0;
      msgObs.subscribe({
        next: message => this.handleWebsocketMessage(message),
        error: err => this.handleWebsocketConnectionDroppedWithError(err),
        complete: () => this.handleWebsocketConnectionDroppedClean(),
      });
    }).catch((error) => {
      this.handleWebsocketConnectionDroppedWithError(error);
    }).finally(() => {
      this.isReconnecting = false;

      const closed = overlayHandle ? overlayHandle.close() : Promise.resolve();
      closed.then(() => {
        this.onGameLoad();
      })
    });
  }

  public reconnectToWebsocket() {
    if (this.isReconnecting) return;
    if (this.reconnectCount >= this.reconnectCountLimit) {
      this.toastService.showToast("Kunne ikke forbinde", "Efter flere forsøg var det ikke muligt at forbinde til spillet", "error", ToastState.error);
      this.navigateToWelcome();
      return;
    }
    this.isReconnecting = true;
    this.connectToWebsocket(true, 15000);
  }

  private onGameLoad() {
    switch (this.gameState()) {
      case GameState.AwaitingChug:
        return this.openChugOverlay();
      case GameState.AwaitingStart: {
        this.dispatchStartGameAction();
      }
    }

    if (this.gameTimeReport()?.state === TimerState.Paused) {
      this.openPausePanel();
    }


  }

  /**
   * When page gains focus, e.g. after phone have been locked or user used another app or tab
   * @private
   */
  private onPageGainFocus() {
    const visibilityState = document.visibilityState;
    console.debug('Visibility:', visibilityState, ', socket is connected:', this.websocketService.isConnected());
    if (visibilityState !== 'visible') return;
    this.resumeConnectionIfDropped();
  }

  /**
   * Reconnects a game whose socket died while we were away. Safe to call repeatedly — it no-ops
   * unless there is a game to resume and its socket is gone.
   * @private
   */
  private resumeConnectionIfDropped() {
    if (!this.gameStateObj()) return;
    if (this.websocketService.isConnected()) return;
    this.reconnectCount = 0;
    this.reconnectToWebsocket();
  }

  private handleWebsocketConnectionDroppedClean() {
    // do nothing yet, but log the error. A game can be reconnected, implementation is soon
    console.warn("Lost connection to game-websocket, no errors");
  }

  private handleWebsocketConnectionDroppedWithError(error?: unknown) {

    const errorObj = error as Error;
    console.debug("Lost connection to game-websocket. Message: ", errorObj?.message, ', code: ', errorObj?.cause);

    switch (errorObj.cause) {
      case WebsocketCodes.GameNotFound: {
        this.toastService.showToast("Der skete en fejl", "Spillet findes ikke længere", 'error', ToastState.error);
        this.navigateToWelcome();
        break;
      }
      case WebsocketCodes.GoingAway:
      case WebsocketCodes.AbnormalClosure:
      case WebsocketCodes.ServiceRestart:
      case WebsocketCodes.TryAgainLater: {
        const visibilityState = document.visibilityState;
        console.warn('Transient disconnect, awaiting resume. Code:', errorObj.cause, ', Page visible:', visibilityState);
        if (visibilityState !== 'visible') return;

        this.reconnectToWebsocket();
        break;
      }
      case WebsocketCodes.Kicked: {
        this.toastService.showToast("Fjernet fra spillet", "Du blev fjernet fra spillet", 'sports_martial_arts');
        this.navigateToWelcome();
        break;
      }
      default:
        this.handleFailedToConnectToGame();
    }

  }

  private handleFailedToConnectToGame() {
    this.toastService.showToast("Der skete en fejl", "Kunne ikke forbinde til spillet", "error", ToastState.error);
    this.navigateToWelcome();
  }

  private handleWebsocketMessage(msg: WebsocketEnvelope) {

    const supportedEventCategories: string[] = ['GAME_EVENT', 'GAME_CLIENT_EVENT', 'PLAYER_CLIENT_EVENT'];

    if (!supportedEventCategories.includes(msg.category)) {
      console.error("Can't handle messages of category:", msg.category, "Message:", msg);
      return;
    }

    const event: GameEventEnvelope = msg as GameEventEnvelope;

    switch (event.payload.type) {
      case 'HELLO_GAME_SNAPSHOT' :
        return this.handleGameSnapshot(event);
      case 'HELLO_IDENTITY' :
        return this.handleIdentity(event);
      case 'CLIENT_CONNECTED' :
        return this.handleGameClientConnected();
      case 'DRAW_CARD':
        return this.handleDrawCardEvent(event);
      case 'CHUG':
        return this.handleChugEvent(event);
      case 'GAME_START':
        return this.handleGameStartEvent();
      case 'GAME_PAUSED':
        return this.handleGamePausedEvent(event);
      case 'GAME_RESUMED':
        return this.handleGameResumedEvent(event);
      case 'GAME_END':
        return this.handleGameEndEvent(event);
      case 'PLAYER_CONNECTED':
        return this.handlePlayerConnected(event);
      case 'PLAYER_DISCONNECTED':
        return this.handlePlayerDisconnected(event);
      case 'PLAYER_RELEASED':
        return this.handlePlayerReleased(event);
      case 'PLAYER_KICKED':
        return this.handlePlayerKickedEvent(event);
      case 'PLAYER_RELEASE_REQUESTED':
        return this.handlePlayerReleaseRequested(event);
      default:
        console.warn("Could not handle websocket message", event);
    }
  }

  //Handle websocket messages
  private handleIdentity(event: GameEventEnvelope) {
    const identityEvent: IdentityEvent = event.payload as IdentityEvent;
    this.identity.set(identifyFromEvent(identityEvent));
  }

  private handleGameClientConnected() {
    this.toastService.showToast("Client connected", "Good", "error", ToastState.success);
  }

  private handleGameSnapshot(event: GameEventEnvelope) {
    const stateEvent: GameStateEvent = event.payload as GameStateEvent;
    this.gameStateObj.set(stateEvent.gameState);
  }

  private handleDrawCardEvent(event: GameEventEnvelope) {
    const drawCardEvent: DrawCardEvent = event.payload as DrawCardEvent;

    if (!this.currentCard()) {
      this.startTimer(this.gameTimeReport);
    }

    let lastPlayer = this.players().at(this.players().length - 1);
    if (this.currentRound() === 1 && drawCardEvent.drawnBy === lastPlayer?.id) {
      this.startTimer(this.playerTimeReport);
    }

    const card = drawCardEvent.turn.card!;
    const isChugCard = card?.rank === 14;
    this.currentCard.set(card);

    this._remainingCardsByRank.update((counts) =>
      counts.map((entry) =>
        entry.rank === card.rank ? {...entry, count: (entry.count ?? 1) - 1} : entry,
      ),
    );

    if (drawCardEvent.nextToDraw === this.players().at(0)?.id) {
      this._currentRound.update(currentRound => currentRound + 1);
    }

    this.currentPlayerId.set(isChugCard ? drawCardEvent.drawnBy : drawCardEvent.nextToDraw);


    this.addTurnToPlayer(drawCardEvent.turn, drawCardEvent.drawnBy);

    if (this.currentRound() > 1) {
      this.resetTimer(this.playerTimeReport);
    }


    if (isChugCard) {
      this.openChugOverlay();
    }
  }

  private handleChugEvent(event: GameEventEnvelope) {
    const chugEvent: ChugEvent = event.payload as ChugEvent;
    this.addChugToPlayer(chugEvent.chug, chugEvent.chuggedBy);
    this.currentPlayerId.set(chugEvent.nextToDraw);

    if (this.currentRound() > 1) {
      this.startTimer(this.playerTimeReport);
    }

    this.gameState.set(GameState.InProgress);

    this.chugOverlay?.close();
  }

  private handleGameStartEvent() {
    this.gameState.set(GameState.InProgress);
  }

  private handleGamePausedEvent(event: GameEventEnvelope) {
    const gamePausedEvent: GamePausedEvent = event.payload as GamePausedEvent;
    this.gameTimeReport.set(gamePausedEvent.timerReports?.gameTimeReport);
    this.playerTimeReport.set(gamePausedEvent.timerReports?.playerTimeReport);

    this.openPausePanel();
  }

  private handleGameResumedEvent(event: GameEventEnvelope) {
    const gameResumedEvent: GameResumedEvent = event.payload as GameResumedEvent;
    this.gameTimeReport.set(gameResumedEvent.timerReports?.gameTimeReport);
    this.playerTimeReport.set(gameResumedEvent.timerReports?.playerTimeReport);

    this.gamePausedPanel?.close();
  }

  private handleGameEndEvent(event: GameEventEnvelope) {
    const gameEndEvent: GameEndEvent = event.payload as GameEndEvent;
    console.log("Game end!", gameEndEvent);
    this.gameTimeReport.set(gameEndEvent.timeReports.gameTimeReport);
    this.playerTimeReport.set(gameEndEvent.timeReports.playerTimeReport);
    this.endGame();
  }

  private handlePlayerConnected(event: GameEventEnvelope) {
    const playerConnectedEvent: PlayerConnectedEvent = event.payload as PlayerConnectedEvent;
    if (this.releaseRequests().includes(playerConnectedEvent.playerId)) {
      this._releaseRequests.update(playerIds => playerIds.filter(playerId => playerId !== playerConnectedEvent.playerId));
    }
    this.updatePlayerConnectionStatus(playerConnectedEvent.playerId, true, true);
  }

  private handlePlayerDisconnected(event: GameEventEnvelope) {
    const playerConnectedEvent: PlayerConnectedEvent = event.payload as PlayerDisconnectedEvent;
    this.updatePlayerConnectionStatus(playerConnectedEvent.playerId, false, true);
  }

  private handlePlayerReleased(event: GameEventEnvelope) {
    const playerConnectedEvent: PlayerConnectedEvent = event.payload as PlayerReleasedEvent;
    this.updatePlayerConnectionStatus(playerConnectedEvent.playerId, false, false);
  }

  private handlePlayerKickedEvent(event: GameEventEnvelope) {
    const playerKickedEvent: PlayerKickedEvent = event.payload as PlayerKickedEvent;
    this.updatePlayerConnectionStatus(playerKickedEvent.playerId, false, false);
  }

  private handlePlayerReleaseRequested(event: GameEventEnvelope) {
    const playerReleaseRequestedEvent: PlayerReleaseRequestedEvent = event.payload as PlayerReleaseRequestedEvent;
    this.registerNewReleaseRequestOnPlayer(playerReleaseRequestedEvent.playerId);
  }


  //Dispatch actions
  private dispatchGameAction(action: GameAction) {

    if (!this.websocketService.isConnected()) {
      console.warn('Action dispatched without a socket, treating as a page resume.', action);
      this.resumeConnectionIfDropped();
      return;
    }

    this.websocketService.send(gameClientActionEnvelope(action));
  }

  public dispatchStartGameAction() {
    this.dispatchGameAction(startGameAction())
  }

  public dispatchPauseGameAction() {
    this.dispatchGameAction(pauseGameAction());
  }

  public dispatchResumeGameAction() {
    this.dispatchGameAction(resumeGameAction());
  }

  public dispatchDrawCardAction(duration: number) {
    this.dispatchGameAction(drawCardAction(duration));
  }

  public dispatchChugAction(chugTimeInMillis: number) {
    const chug: Chug = {suit: this.currentCard()?.suit, chugTimeMillis: chugTimeInMillis};
    this.dispatchGameAction(chugAction(chug));
  }

  public dispatchReleaseAction(playerId: string) {
    if (this.releaseRequests().includes(playerId)) {
      this._releaseRequests.update(playerIds => playerIds.filter(requestPlayerId => requestPlayerId !== playerId));
    }
    this.dispatchGameAction(releasePlayerAction(playerId))
  }

  public dispatchKickAction(playerId: string, reason: string) {
    this.dispatchGameAction(kickPlayerAction(playerId, reason))
  }


  //helper methods
  private startTimer(timeReport: WritableSignal<TimeReport | undefined>) {
    timeReport.update((report) => {
      if (!report) return report;
      return {
        ...report,
        state: TimerState.Running
      };
    });
  }

  private resetTimer(timeReport: WritableSignal<TimeReport | undefined>) {
    timeReport.update((report) => {
      if (!report) return report;
      return {
        ...report,
        elapsedTime: 0,
        activeTime: 0,
      };
    });
  }

  private pauseTimer(timeReport: WritableSignal<TimeReport | undefined>) {
    timeReport.update((report) => {
      if (!report) return report;
      return {
        ...report,
        state: TimerState.Paused,
      };
    });
  }

  private addChugToPlayer(chug: Chug, playerId: string): void {
    this.players.update(players => players.map(player =>
      player.id === playerId ? {
        ...player,
        stats: {
          ...player.stats,
          chugs: [...(player.stats?.chugs ?? []), chug]
        }
      } : player
    ));
  }

  private addTurnToPlayer(turn: Turn, playerId: string): void {
    this.players.update(players => players.map(player =>
      player.id === playerId ? {
        ...player,
        stats: {
          ...player.stats,
          turns: [...(player.stats?.turns ?? []), turn]
        }
      } : player
    ));
  }

  private updatePlayerConnectionStatus(playerId: string, connected: boolean, claimed: boolean): void {

    this.players.update(players => players.map(player =>
      player.id === playerId ?
        {...player, sessionInfo: {isConnected: connected, isClaimed: claimed}} : player
    ))

  }

  private registerNewReleaseRequestOnPlayer(playerId: string): void {
    this._releaseRequests.update(players =>
      players.includes(playerId) ? players : [...players, playerId],
    );
  }

  private openPausePanel() {
    // A reconnect and a paused-event can both land on the same pause — only ever show one.

    const gameTimeReport = this.gameTimeReport();
    const partyId = this.gameInfo()?.id;
    console.log("gameTimeReport", gameTimeReport);
    if (this.gamePausedPanel || !gameTimeReport || !partyId) return;

    const pausesTotal = gameTimeReport.pausedTime ?? 0;
    const registeredPausesSummed = gameTimeReport.pauses?.reduce((accumulated, current) => accumulated + current, 0) ?? 0;
    const currentPause = pausesTotal - registeredPausesSummed;

    const elapsedTime = gameTimeReport.activeTime ?? 0;
    const gamePausedData: GamePausedData = {
      cardsLeft: this.remainingCardsCount(),
      currentRound: this.currentRound(),
      currentPauseTime: currentPause,
      currentPlayer: this.currentPlayer()!,
      elapsedGameTime: elapsedTime,
      partyId: partyId
    };
    this.gamePausedPanel = this.drawerService.showGamePausedDrawer(gamePausedData);

    this.gamePausedPanel.closed.then(() => {
      this.gamePausedPanel = undefined;
      if (this.isGameClient()) {
        this.dispatchResumeGameAction();
      }
    })


  }

  private openChugOverlay() {
    // A reconnect and a card-drawn event can both land on the same chug — only ever show one.
    if (this.chugOverlay) return;

    this.pauseTimer(this.playerTimeReport);

    const chugData: ChugOverlayData = {
      players: this.players(),
      playerToChug: this.currentPlayer()!,
      isGameClient: this.isGameClient()
    }
    this.chugOverlay = this.overlayService.openOverlay<number>({component: ChugOverlay, data: chugData});

    this.chugOverlay.closed.then((chugTime) => {
      this.chugOverlay = undefined;
      if (this.isGameClient()) {
        this.dispatchChugAction(chugTime ?? 0);
      }

    });
  }

  //Diverse

  public endGame() {
    this.gameState.set(GameState.Finished);
    this.pauseTimer(this.gameTimeReport);
    this.pauseTimer(this.playerTimeReport);
    this.dismissAllOverlays();
  }

  public onGamePageDestroyed() {
    this.websocketService.disconnect();
    this.gameStateObj.set(undefined);
    this.dismissAllOverlays(true);
  }

  // Guests can't close the chug/pause overlays themselves — don't strand them behind one
  private dismissAllOverlays(ignoreAnimation = false) {
    this.gamePausedPanel?.dismiss(ignoreAnimation);
    this.chugOverlay?.dismiss(ignoreAnimation);

    // A dismissal never resolves `closed`, so the handlers that normally clear these don't run.
    this.gamePausedPanel = undefined;
    this.chugOverlay = undefined;
  }

  private navigateToWelcome() {
    this.router.navigate(['/']);
  }


}
