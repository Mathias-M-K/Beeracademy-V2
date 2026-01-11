import {computed, Injectable, linkedSignal, Signal, signal} from '@angular/core';
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
import {Observable, Subject} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GameService {

  private gameState = signal<GameDto | undefined>(undefined);

  public players = computed(() => this.gameState()?.players ?? []);
  public gameInfo: Signal<GameInfo | undefined>;

  public currentCard = linkedSignal(() => this.gameState()?.lastCard);

  public timeReport = computed(()=>this.gameState()?.timeReport);

  private onGameStarted= new Subject<void>();
  public onGameStarted$: Observable<void> = this.onGameStarted.asObservable();


  constructor(private websocketService: WebsocketService) {

    this.websocketService.messages$.subscribe(message => {
      this.handleEvent(message);
    });

    this.gameInfo = computed<GameInfo | undefined>(() => {
      const state = this.gameState();
      if (!state?.id || !state?.name) {
        return undefined;
      }
      return {id: state.id, name: state.name};
    });
  }

  public startGame() {
    const startGameAction: StartGameAction = {type: 'START_GAME'};
    const clientActionEnvelope: GameClientActionEnvelope = {payload: startGameAction, category: 'GAME_CLIENT_ACTION'};
    this.websocketService.sendMessage(clientActionEnvelope);
  }

  public drawCard() {
    const drawCardAction: DrawCardAction = {type: 'DRAW_CARD', duration: 123}
    const clientActionEnvelope: GameClientEvenEnvelope = {payload: drawCardAction, category: 'GAME_CLIENT_ACTION'}
    this.websocketService.sendMessage(clientActionEnvelope);
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
            this.currentCard.set(drawCardEvent.newCard);
            break;
          case 'GAME_START':
            this.onGameStarted.next();
            break
        }
    }
  }

  private updatePlayer(playerId: string, updater: (player: PlayerDto) => PlayerDto): void {
    this.gameState.update(oldState => {
      if (!oldState || !oldState.players) {
        return oldState;
      }

      const updatedPlayers = oldState.players.map(player =>
        player.id === playerId ? updater(player) : player
      );

      return {
        ...oldState,
        players: updatedPlayers
      };
    });
  }

  public addChugToPlayer(chug: Chug, playerId: string): void {
    this.updatePlayer(playerId, player => ({
      ...player,
      stats: {
        ...player.stats,
        chugs: [...(player.stats?.chugs ?? []), chug]
      }
    }));
    console.log(`Added chug to player ${playerId}.`);
  }

  public addTurnToPlayer(turn: Turn, playerId: string): void {
    this.updatePlayer(playerId, player => ({
      ...player,
      stats: {
        ...player.stats,
        turns: [...(player.stats?.turns ?? []), turn]
      }
    }));
    console.log(`Added turn to player ${playerId}.`);
  }

  public resetGameData() {
    this.gameState.set(undefined);
  }


}
