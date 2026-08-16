import {computed, inject, Injectable, linkedSignal, signal, WritableSignal} from '@angular/core';
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
import {RankCountDto} from '../../../api-models/model/rankCountDto';
import {ToastService} from '../toast/toast.service';
import {ToastState} from '../../overlay/toast/models/toast-data';
import {GameStateEvent} from '../models/categories/events/game/common/game-state-event';
import {identifyFromEvent, Identity} from '../models/identity';
import {IdentityEvent} from '../models/categories/events/common/identity-event';
import {GameNotStartedOverlay} from '../../overlay/game-state-overlay/game-not-started-overlay.component';
import {BeerLoaderOverlay} from '../../overlay/beer-loader-overlay/beer-loader-overlay';
import {Role} from '../../../api-models/model/role';
import {Router} from '@angular/router';
import {OverlayHandle} from '../overlay/models/overlay-handle';
import {GamePausedOverlay} from '../../overlay/game-paused-overlay/game-paused-overlay';
import {GamePausedOverlayData} from '../../overlay/game-paused-overlay/models/game-paused-overlay-data';
import {ChugOverlayData} from '../../overlay/chug-overlay/models/chug-overlay-data';
import {ReconnectingOverlay} from '../../overlay/reconnecting-overlay/reconnecting-overlay';
import {WebsocketCodes} from '../../../api-models/model/websocketCodes';

//TODO The way the timers work and integrates is weird, or at least I don't understand it - Look at new DumbTimer, it's the way to go
@Injectable({
  providedIn: 'root',
})
export class GameService {

  private readonly websocketService = inject(WebsocketService);
  private readonly overlayService = inject(OverlayService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  private readonly gameStateObj = signal<GameDto | undefined>(undefined);
  public gameTimeReport = linkedSignal(() => this.gameStateObj()?.timerReports?.gameTimeReport);
  public playerTimeReport = linkedSignal(() => this.gameStateObj()?.timerReports?.playerTimeReport);

  private readonly playerDTOs = linkedSignal(() => this.gameStateObj()?.players ?? []);
  public players = computed(() => {

    return this.playerDTOs().map((dto, index) => {
      const player = Player.fromPlayerDto(dto);
      player.color = playerColor(index);
      return player;
    })
  })
  public gameInfo = linkedSignal<GameInfo | undefined>(() => {
    const state = this.gameStateObj();
    if (!state?.id || !state?.name) {
      return undefined;
    }

    const gameInfo: GameInfo = {
      id: state.id,
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

  private readonly currentPlayerId = linkedSignal(() => this.currentCard()?.rank === 14 ? this.gameStateObj()?.lastPlayerToDraw : this.gameStateObj()?.nextPlayerToDraw,);
  public readonly currentPlayer = computed(() => {
    const id = this.currentPlayerId();
    if (!id) return undefined;
    return this.players().find((player) => player.id === id);
  });

  private readonly _remainingCardsCount = linkedSignal(() => {
    const list = this.gameStateObj()?.remainingCardsCount;

    if (list) {
      return list;
    } else {
      const otherList: RankCountDto[] = [];
      return otherList;
    }
  });
  public readonly remainingCardsCount = this._remainingCardsCount.asReadonly();

  private readonly identity = signal<Identity | undefined>(undefined)
  private readonly role = computed(() => this.identity()?.role);
  private readonly isGameClient = computed(() => this.role() === Role.GameClient);

  private gameNotStartedOverlay?: OverlayHandle<void>;
  private gamePausedOverlay?: OverlayHandle<void>;
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
        this.gameNotStartedOverlay = this.overlayService.openOverlay<void, boolean>({
          component: GameNotStartedOverlay,
          data: this.isGameClient()
        });

        if (this.isGameClient()) {
          this.gameNotStartedOverlay.closed.then(() => {
            this.gameNotStartedOverlay = undefined;
            this.dispatchStartGameAction();
          })
        }

        break;
      }
    }

    if (this.gameTimeReport()?.state === TimerState.Paused) {
      this.openPauseOverlay(this.gameTimeReport()!);
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
      default:
        this.handleFailedToConnectToGame();
    }

  }

  private handleFailedToConnectToGame() {
    this.toastService.showToast("Der skete en fejl", "Kunne ikke forbinde til spillet", "error", ToastState.error);
    this.navigateToWelcome();
  }

  public handleWebsocketMessage(msg: WebsocketEnvelope) {

    const supportedEventCategories: string[] = ['GAME_EVENT', 'GAME_CLIENT_EVENT', 'PLAYER_CLIENT_EVENT'];

    if (!supportedEventCategories.includes(msg.category)) {
      console.error("Can't handle message", msg);
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
    }
  }

  /**Handle websocket messages**/
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

    const card = drawCardEvent.turn.card!;
    const isChugCard = card?.rank === 14;
    this.currentCard.set(card);

    this._remainingCardsCount.update((counts) =>
      counts.map((entry) =>
        entry.rank === card.rank ? {...entry, count: (entry.count ?? 1) - 1} : entry,
      ),
    );

    if (drawCardEvent.nextToDraw === this.players().at(0)?.id) {
      this._currentRound.update(currentRound => currentRound + 1);
    }

    this.currentPlayerId.set(isChugCard ? drawCardEvent.drawnBy : drawCardEvent.nextToDraw);


    this.addTurnToPlayer(drawCardEvent.turn, drawCardEvent.drawnBy);
    this.resetTimer(this.playerTimeReport);

    if (isChugCard) {
      this.openChugOverlay();
    }
  }


  private handleChugEvent(event: GameEventEnvelope) {
    const chugEvent: ChugEvent = event.payload as ChugEvent;
    this.addChugToPlayer(chugEvent.chug, chugEvent.chuggedBy);
    this.currentPlayerId.set(chugEvent.nextToDraw);
    this.startTimer(this.playerTimeReport);
    this.gameState.set(GameState.InProgress);

    this.chugOverlay?.close();
  }

  private handleGameStartEvent() {
    this.startTimer(this.gameTimeReport);
    this.startTimer(this.playerTimeReport);
    this.gameState.set(GameState.InProgress);

    this.gameNotStartedOverlay?.close();
  }


  private handleGamePausedEvent(event: GameEventEnvelope) {
    const gamePausedEvent: GamePausedEvent = event.payload as GamePausedEvent;
    this.gameTimeReport.set(gamePausedEvent.timerReports?.gameTimeReport);
    this.playerTimeReport.set(gamePausedEvent.timerReports?.playerTimeReport);

    this.openPauseOverlay(gamePausedEvent.timerReports.gameTimeReport!);
  }

  private handleGameResumedEvent(event: GameEventEnvelope) {
    const gameResumedEvent: GameResumedEvent = event.payload as GameResumedEvent;
    this.gameTimeReport.set(gameResumedEvent.timerReports?.gameTimeReport);
    this.playerTimeReport.set(gameResumedEvent.timerReports?.playerTimeReport);

    this.gamePausedOverlay?.close();
  }

  private handleGameEndEvent(event: GameEventEnvelope) {
    const gameEndEvent: GameEndEvent = event.payload as GameEndEvent;
    console.log("Game end!", gameEndEvent);
    this.gameTimeReport.set(gameEndEvent.timeReports.gameTimeReport);
    this.playerTimeReport.set(gameEndEvent.timeReports.playerTimeReport);
    this.endGame();
  }


  /**Dispatch actions**/
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


  /**helper methods**/
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

  public addChugToPlayer(chug: Chug, playerId: string): void {
    this.playerDTOs.update(players => players.map(player =>
      player.id === playerId ? {
        ...player,
        stats: {
          ...player.stats,
          chugs: [...(player.stats?.chugs ?? []), chug]
        }
      } : player
    ));
    console.log(`Added chug to player ${playerId}.`);
  }

  public addTurnToPlayer(turn: Turn, playerId: string): void {
    this.playerDTOs.update(players => players.map(player =>
      player.id === playerId ? {
        ...player,
        stats: {
          ...player.stats,
          turns: [...(player.stats?.turns ?? []), turn]
        }
      } : player
    ));
    console.log(`Added turn to player ${playerId}.`);
  }

  /**Overlay**/
  private openPauseOverlay(timeReport: TimeReport) {
    // A reconnect and a paused-event can both land on the same pause — only ever show one.
    if (this.gamePausedOverlay) return;

    const elapsedTime = timeReport.activeTime ?? 0;
    const gamePausedData: GamePausedOverlayData = {
      currentPlayer: this.currentPlayer()!,
      time: elapsedTime,
      isGameClient: this.isGameClient()
    };
    this.gamePausedOverlay = this.overlayService.openOverlay<void>({
      component: GamePausedOverlay,
      data: gamePausedData
    });

    this.gamePausedOverlay.closed.then(() => {
      this.gamePausedOverlay = undefined;
      if (!this.isGameClient()) return;
      this.dispatchResumeGameAction();
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
      if (!this.isGameClient()) return;
      this.dispatchChugAction(chugTime ?? 0);
    });
  }

  /**Diverse**/

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

  /** Guests can't close the chug/pause overlays themselves — don't strand them behind one. */
  private dismissAllOverlays(ignoreAnimation = false) {
    this.gameNotStartedOverlay?.dismiss(ignoreAnimation);
    this.gamePausedOverlay?.dismiss(ignoreAnimation);
    this.chugOverlay?.dismiss(ignoreAnimation);

    // A dismissal never resolves `closed`, so the handlers that normally clear these don't run.
    this.gameNotStartedOverlay = undefined;
    this.gamePausedOverlay = undefined;
    this.chugOverlay = undefined;
  }

  private navigateToWelcome() {
    this.router.navigate(['/']);
  }


}
