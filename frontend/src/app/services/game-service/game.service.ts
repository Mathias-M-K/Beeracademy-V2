import {Injectable, linkedSignal, signal, WritableSignal} from '@angular/core';
import {WebsocketEnvelope} from '../models/websocket-envelope';
import {GameClientEvenEnvelope} from '../models/categories/game-client-event/game-client-even-envelope';
import {GameClientConnectedEvent} from '../models/categories/game-client-event/game-client-connected.event';
import {WebsocketService} from '../websocket.service';
import {GameDto} from '../../../api-models/model/gameDto';
import {Chug} from '../../../api-models/model/chug';
import {PlayerDto} from '../../../api-models/model/playerDto';
import {Turn} from '../../../api-models/model/turn';
import {GameInfo} from './models/game-info';
import {DrawCardAction} from '../models/categories/game-client-action/draw-card-action';
import {StartGameAction} from '../models/categories/game-client-action/start-game-action';
import {GameClientActionEnvelope} from '../models/categories/game-client-action/game-client-action-envelope';
import {GameEventEnvelope} from '../models/categories/game-event/game-event-envelope';
import {DrawCardEvent} from '../models/categories/game-event/draw-card-event';
import {TimerState} from '../../../api-models/model/timerState';
import {PauseGameAction} from '../models/categories/game-client-action/pause-game-action';
import {ResumeGameAction} from '../models/categories/game-client-action/resume-game-action';
import {GamePausedEvent} from '../models/categories/game-event/game-paused-event';
import {GameResumedEvent} from '../models/categories/game-event/game-resumed-event';
import {ChugAction} from '../models/categories/game-client-action/chug-action';
import {ChugEvent} from '../models/categories/game-event/chug-event';
import {GameState} from '../../../api-models/model/gameState';
import {TimeReport} from '../../../api-models/model/timeReport';
import {GameEndEvent} from '../models/categories/game-event/game-end-event';

@Injectable({
  providedIn: 'root',
})
export class GameService {

  private gameStateObj = signal<GameDto | undefined>(undefined);
  public gameTimeReport = linkedSignal(() => this.gameStateObj()?.timerReports?.gameTimeReport);
  public playerTimeReport = linkedSignal(() => this.gameStateObj()?.timerReports?.playerTimeReport);

  public players = linkedSignal(() => this.gameStateObj()?.players ?? []);
  public gameInfo
  public gameState = linkedSignal(() => this.gameStateObj()?.gameState);

  public currentCard = linkedSignal(() => this.gameStateObj()?.lastCard);
  public currentPlayer = linkedSignal(() => {
    const players = this.gameStateObj()?.players;
    const currentPlayerId = this.gameStateObj()?.currentPlayerId;

    if (!players || !currentPlayerId) return;

    return players.find((player) => player.id === currentPlayerId);
  })

  public awaitingChugFromPlayer = signal<PlayerDto | undefined>(undefined)


  constructor(private websocketService: WebsocketService) {
    this.websocketService.messages$.subscribe(message => {
      this.handleEvent(message);
    });

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

  public dispatchStartGameAction() {
    const startGameAction: StartGameAction = {type: 'START_GAME'};
    const clientActionEnvelope: GameClientActionEnvelope = {payload: startGameAction, category: 'GAME_CLIENT_ACTION'};
    this.websocketService.sendMessage(clientActionEnvelope);
  }

  public dispatchPauseGameAction() {
    const pauseGameAction: PauseGameAction = {type: 'PAUSE_GAME'};
    const clientActionEnvelope: GameClientActionEnvelope = {payload: pauseGameAction, category: 'GAME_CLIENT_ACTION'};
    this.websocketService.sendMessage(clientActionEnvelope);
  }

  public dispatchResumeGameAction() {
    const resumeGameAction: ResumeGameAction = {type: 'RESUME_GAME'};
    const clientActionEnvelope: GameClientActionEnvelope = {payload: resumeGameAction, category: 'GAME_CLIENT_ACTION'};
    this.websocketService.sendMessage(clientActionEnvelope);
  }

  public dispatchDrawCardAction(duration: number) {
    const drawCardAction: DrawCardAction = {type: 'DRAW_CARD', duration: duration}
    const clientActionEnvelope: GameClientEvenEnvelope = {payload: drawCardAction, category: 'GAME_CLIENT_ACTION'}
    this.websocketService.sendMessage(clientActionEnvelope);
  }

  public dispatchChugAction(chugTimeInMillis: number) {
    const chug: Chug = {suit: this.currentCard()?.suit, chugTimeMillis: chugTimeInMillis};
    const chugAction: ChugAction = {type: 'REGISTER_CHUG', chug}
    const gameClientActionEnvelope: GameClientActionEnvelope = {category: "GAME_CLIENT_ACTION", payload: chugAction};
    this.websocketService.sendMessage(gameClientActionEnvelope);
  }

  public handleEvent(message: WebsocketEnvelope) {
    console.log("Websocket Message:", message);
    switch (message.category) {
      case 'GAME_CLIENT_EVENT':
        const gameClientEvent = message as GameClientEvenEnvelope;

        switch (gameClientEvent.payload.type) {
          case 'CLIENT_CONNECTED':
            const payload: GameClientConnectedEvent = gameClientEvent.payload as GameClientConnectedEvent;
            this.gameStateObj.set(payload.game);
        }
        break;
      case 'GAME_EVENT':
        const gameEvent: GameEventEnvelope = message as GameEventEnvelope;

        switch (gameEvent.payload.type) {
          case 'DRAW_CARD':
            const drawCardEvent: DrawCardEvent = gameEvent.payload as DrawCardEvent;
            this.currentCard.set(drawCardEvent.turn.card);
            this.currentPlayer.set(this.getPlayer(drawCardEvent.newPlayerId));
            this.addTurnToPlayer(drawCardEvent.turn, drawCardEvent.previousPlayerId);
            this.resetTimer(this.playerTimeReport);

            if (this.currentCard()?.rank === 14) {
              this.pauseTimer(this.playerTimeReport);
              this.awaitingChugFromPlayer.set(this.getPlayer(drawCardEvent.newPlayerId));
            }
            break;
          case 'CHUG' :
            const chugEvent: ChugEvent = gameEvent.payload as ChugEvent;
            this.addChugToPlayer(chugEvent.chug, chugEvent.playerId);
            this.currentPlayer.set(this.getPlayer(chugEvent.newPlayer));
            this.awaitingChugFromPlayer.set(undefined);
            this.startTimer(this.playerTimeReport);

            break
          case 'GAME_START':
            this.startTimer(this.gameTimeReport);
            this.startTimer(this.playerTimeReport);
            this.gameState.set(GameState.InProgress);
            break;
          case 'GAME_PAUSED' :
            const gamePausedEvent: GamePausedEvent = gameEvent.payload as GamePausedEvent;
            this.gameTimeReport.set(gamePausedEvent.timerReports?.gameTimeReport);
            this.playerTimeReport.set(gamePausedEvent.timerReports?.playerTimeReport);
            break
          case 'GAME_RESUMED' :
            const gameResumedEvent: GamePausedEvent = gameEvent.payload as GameResumedEvent;
            this.gameTimeReport.set(gameResumedEvent.timerReports?.gameTimeReport);
            this.playerTimeReport.set(gameResumedEvent.timerReports?.playerTimeReport);
            break
          case 'GAME_END' :
            const gameEndEvent: GameEndEvent = gameEvent.payload as GameEndEvent;
            console.log("Game end!", gameEndEvent);
            this.endGame();
        }
    }
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

  private getPlayer(playerId: string): PlayerDto | undefined {
    return this.players().find((player) => player.id === playerId);
  }

  public addChugToPlayer(chug: Chug, playerId: string): void {
    this.players.update(players => players.map(player =>
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
    this.players.update(players => players.map(player =>
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
