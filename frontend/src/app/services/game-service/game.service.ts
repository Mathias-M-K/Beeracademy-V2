import {computed, Injectable, linkedSignal, signal} from '@angular/core';
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
import {Observable, Subject} from 'rxjs';
import {ChugAction} from '../models/categories/game-client-action/chug-action';

@Injectable({
  providedIn: 'root',
})
export class GameService {

  private onGameStarted: Subject<void> = new Subject<void>();
  public onGameStarted$: Observable<void> = this.onGameStarted.asObservable();

  private gameState = signal<GameDto | undefined>(undefined);

  public players = linkedSignal(() => this.gameState()?.players ?? []);
  public gameInfo

  public currentCard = linkedSignal(() => this.gameState()?.lastCard);
  public currenPlayer = linkedSignal(() => {
    const players = this.gameState()?.players;
    const currentPlayerId = this.gameState()?.currentPlayerId;

    if (!players || !currentPlayerId) return;

    return players.find((player) => player.id === currentPlayerId);
  })

  public timeReport = linkedSignal(() => this.gameState()?.timeReport);

  public awaitingChug = computed(()=>this.currentCard()?.rank === 14);

  constructor(private websocketService: WebsocketService) {

    this.websocketService.messages$.subscribe(message => {
      this.handleEvent(message);
    });

    this.gameInfo = linkedSignal<GameInfo | undefined>(() => {
      const state = this.gameState();
      if (!state?.id || !state?.name) {
        return undefined;
      }

      return {id: state.id, name: state.name, isStarted: state.timeReport?.state !== TimerState.NotStarted};
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

  public dispatchDrawCardAction() {
    const drawCardAction: DrawCardAction = {type: 'DRAW_CARD', duration: 123}
    const clientActionEnvelope: GameClientEvenEnvelope = {payload: drawCardAction, category: 'GAME_CLIENT_ACTION'}
    this.websocketService.sendMessage(clientActionEnvelope);
  }

  public dispatchChugAction(chugTimeInMillis: number){
    const chugAction: ChugAction = {duration: chugTimeInMillis, playerId: this.currenPlayer()?.id!, suit: this.currentCard()?.suit!, type: 'REGISTER_CHUG'}
    const gameClientActionEnvelope: GameClientActionEnvelope = {category: "GAME_CLIENT_ACTION", payload: chugAction};
    this.websocketService.sendMessage(gameClientActionEnvelope);
    this.dispatchDrawCardAction();
  }

  public handleEvent(message: WebsocketEnvelope) {
    console.log("Websocket Message:", message);
    switch (message.category) {
      case 'GAME_CLIENT_EVENT':
        const gameClientEvent = message as GameClientEvenEnvelope;

        switch (gameClientEvent.payload.type) {
          case 'CLIENT_CONNECTED':
            const payload: GameClientConnectedEvent = gameClientEvent.payload as GameClientConnectedEvent;
            this.gameState.set(payload.game);
        }
        break;
      case 'GAME_EVENT':
        const gameEvent: GameEventEnvelope = message as GameEventEnvelope;

        switch (gameEvent.payload.type) {
          case 'DRAW_CARD':
            const drawCardEvent: DrawCardEvent = gameEvent.payload as DrawCardEvent;
            this.currentCard.set(drawCardEvent.turn.card);
            this.currenPlayer.set(this.getPlayer(drawCardEvent.newPlayerId));
            this.addTurnToPlayer(drawCardEvent.turn, drawCardEvent.previousPlayerId);
            break
          case 'GAME_START':
            this.onGameStarted.next();
            break;
          case 'GAME_PAUSED' :
            const gamePausedEvent: GamePausedEvent = gameEvent.payload as GamePausedEvent;
            this.timeReport.set(gamePausedEvent.timeReport);
            break
          case 'GAME_RESUMED' :
            const gameResumedEvent: GamePausedEvent = gameEvent.payload as GameResumedEvent;
            this.timeReport.set(gameResumedEvent.timeReport);
            break
        }
    }
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

  public resetGameData() {
    this.gameState.set(undefined);
  }


}
