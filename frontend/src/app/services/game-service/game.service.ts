import {computed, Injectable, Signal, signal} from '@angular/core';
import {WebsocketEnvelope} from '../models/websocket-envelope';
import {GameClientEvenEnvelope} from '../models/categories/game-client-event/game-client-even-envelope';
import {GameClientConnectedEvent} from '../models/categories/game-client-event/game-client-connected.event';
import {WebsocketService} from '../websocket.service';
import {GameDto} from '../../../api-models/model/gameDto';
import {Chug} from '../../../api-models/model/chug';
import {PlayerDto} from '../../../api-models/model/playerDto';
import {Turn} from '../../../api-models/model/turn';
import {GameInfo} from './models/game-info';

@Injectable({
  providedIn: 'root',
})
export class GameService {

  private gameState = signal<GameDto | undefined>(undefined);
  public players = computed(() => this.gameState()?.players ?? []);
  public gameInfo: Signal<GameInfo | undefined>;


  constructor(private websocketService: WebsocketService) {
    this.websocketService.messages$.subscribe(message => {
      this.handleEvent(message);
    });

    this.gameInfo = computed<GameInfo | undefined>(() => {
      const state = this.gameState();
      if (!state?.id || !state?.name) {
        return undefined;
      }
      return { id: state.id, name: state.name };
    });
  }

  public printState() {
    console.log("State", this.gameState());
  }

  private getPlayer(playerId: string): PlayerDto | undefined {
    return this.gameState()?.players?.find(p => p.id === playerId);
  }

  public handleEvent(message: WebsocketEnvelope) {
    console.log("Websocket Message:", message);
    switch (message.category) {
      case 'GAME_CLIENT_EVENT':
        const gameClientEvent = message as GameClientEvenEnvelope;

        switch (gameClientEvent.payload.type) {
          case 'CLIENT_CONNECTED':
            console.log("Client connected!");
            const payload: GameClientConnectedEvent = gameClientEvent.payload as GameClientConnectedEvent;
            console.log("Payload", payload.game);
            this.gameState.set(payload.game);
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


}
