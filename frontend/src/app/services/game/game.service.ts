import {computed, effect, inject, Injectable, linkedSignal, signal, WritableSignal} from '@angular/core';
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
import {Role} from '../../../api-models/model/role';
import {IdentityEvent} from '../models/categories/events/common/identity-event';

//TODO The way the timers work and integrates is weird, or at least I don't understand it - Look at new DumbTimer, it's the way to go
@Injectable({
  providedIn: 'root',
})
export class GameService {

  private readonly websocketService = inject(WebsocketService);
  private readonly overlayService = inject(OverlayService);
  private readonly toastService = inject(ToastService);

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
  public gameInfo
  public gameState = linkedSignal(() => this.gameStateObj()?.gameState);

  public currentCard = linkedSignal(() => this.gameStateObj()?.lastCard);

  public currentPlayer = linkedSignal(() => {
    const players = this.gameStateObj()?.players;
    const currentPlayerId = this.currentCard()?.rank === 14 ? this.gameStateObj()?.lastPlayerToDraw : this.gameStateObj()?.nextPlayerToDraw;

    if (!players || !currentPlayerId) return;

    return players.find((player) => player.id === currentPlayerId);
  });

  public awaitingChugFromPlayer = linkedSignal(() => {
    if (this.gameState() === GameState.AwaitingChug) {
      return this.currentPlayer();
    }
    return undefined;
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

  constructor() {
    effect(() => {
      if (this.gameState() === GameState.AwaitingChug && this.role() === Role.GameClient) {
        this.initiateChug();
      }
    });

    this.websocketService.messages$.subscribe(message => this.handleWebsocketMessage(message));

    this.gameInfo = linkedSignal<GameInfo | undefined>(() => {
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
  }

  public handleWebsocketMessage(msg: WebsocketEnvelope) {

    const supportedEventCategories: string[] = ['GAME_EVENT', 'GAME_CLIENT_EVENT', 'PLAYER_CLIENT_EVENT'];

    if (!supportedEventCategories.includes(msg.category)) {
      console.error("Can't handle message", msg);
      return;
    }

    console.debug("Handling event:", msg);

    const event: GameEventEnvelope = msg as GameEventEnvelope;

    switch (event.payload.type) {
      case 'HELLO_GAME_SNAPSHOT' :
        return this.handleGameSnapshot(event);
      case 'HELLO_IDENTITY' :
        return this.handleIdentity(event);
      case 'CLIENT_CONNECTED' :
        return this.handleGameClientConnected(event);
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

  private handleGameClientConnected(event: GameEventEnvelope) {
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

    const currentPlayerId = isChugCard ? drawCardEvent.drawnBy : drawCardEvent.nextToDraw;
    this.currentPlayer.set(this.getPlayer(currentPlayerId));

    this.addTurnToPlayer(drawCardEvent.turn, drawCardEvent.drawnBy);
    this.resetTimer(this.playerTimeReport);

    if (isChugCard) {
      this.gameState.set(GameState.AwaitingChug);
    }
  }

  private initiateChug() {
    this.pauseTimer(this.playerTimeReport);
    this.awaitingChugFromPlayer.set(this.currentPlayer());

    this.overlayService.openOverlay<number>({component: ChugOverlay, data: this.currentPlayer()})
      .closed.then((chugTime) => {
      this.dispatchChugAction(chugTime ?? 0)
    })
  }

  private handleChugEvent(event: GameEventEnvelope) {
    const chugEvent: ChugEvent = event.payload as ChugEvent;
    this.addChugToPlayer(chugEvent.chug, chugEvent.chuggedBy);
    this.currentPlayer.set(this.getPlayer(chugEvent.nextToDraw));
    this.awaitingChugFromPlayer.set(undefined);
    this.startTimer(this.playerTimeReport);
    this.gameState.set(GameState.InProgress);
  }

  private handleGameStartEvent() {
    this.startTimer(this.gameTimeReport);
    this.startTimer(this.playerTimeReport);
    this.gameState.set(GameState.InProgress);

    this.toastService.showToast("Spillet er igang!", "test test", "sports_bar")
  }

  private handleGamePausedEvent(event: GameEventEnvelope) {
    const gamePausedEvent: GamePausedEvent = event.payload as GamePausedEvent;
    this.gameTimeReport.set(gamePausedEvent.timerReports?.gameTimeReport);
    this.playerTimeReport.set(gamePausedEvent.timerReports?.playerTimeReport);
  }

  private handleGameResumedEvent(event: GameEventEnvelope) {
    const gameResumedEvent: GameResumedEvent = event.payload as GameResumedEvent;
    this.gameTimeReport.set(gameResumedEvent.timerReports?.gameTimeReport);
    this.playerTimeReport.set(gameResumedEvent.timerReports?.playerTimeReport);
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

  private getPlayer(playerId: string): Player | undefined {
    return this.players().find((player) => player.id === playerId);
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

  public endGame() {
    this.gameState.set(GameState.Finished);
    this.pauseTimer(this.gameTimeReport);
    this.pauseTimer(this.playerTimeReport);
  }

  public resetGameData() {
    this.gameStateObj.set(undefined);
  }


}
