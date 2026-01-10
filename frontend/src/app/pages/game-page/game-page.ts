import {ChangeDetectionStrategy, Component, computed, OnInit, Signal} from '@angular/core';
import {WebsocketService} from '../../services/websocket.service';
import {GameService} from '../../services/game.service';
import {PlayerDto} from '../../../api-models/model/playerDto';
import {Chug} from '../../../api-models/model/chug';
import {Suit} from '../../../api-models/model/suit';
import {Turn} from '../../../api-models/model/turn';
import {Card} from '../../../api-models/model/card';

@Component({
  selector: 'app-game-page',
  imports: [],
  templateUrl: './game-page.html',
  styleUrl: './game-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GamePage implements OnInit {

  protected connectionStatus = computed(()=>this.websocketService.connectionStatus());
  protected players: Signal<PlayerDto[]>;

  constructor(
    private websocketService: WebsocketService,
    private gameService: GameService // Injecting it to ensure it's instantiated
  ) {
    this.players = computed(()=>this.gameService.players());
  }

  ngOnInit(): void {
    this.websocketService.connectToWebSocket();

    setTimeout(()=>{
      this.addChug();
      this.addTurn();
      console.log("Adding chug");
    },5000);
  }

  protected printState(){
    this.gameService.printState();
  }

  protected readonly JSON = JSON;

  protected addChug() {
    const players = this.players();
    if (players.length === 0) {
      console.warn("Cannot add chug: No players found in state.");
      return;
    }

    const chug: Chug = {
        suit: Suit.Circle,
        chugTime: '00.02.64'
    }
    const id: string | undefined = players[0].id;

    if (!id) {
      console.warn("Cannot add chug: Player ID is missing.");
      return;
    }

    this.gameService.addChugToPlayer(chug, id);
  }

  protected addTurn(){
    const players = this.players();
    if (players.length === 0) {
      console.warn("Cannot add chug: No players found in state.");
      return;
    }

    const card : Card = {
      suit: Suit.Circle,
      rank: 10
    }

    const turn: Turn ={
      round: 1,
      card: card,
      duration: '00:05:35'
    }
    const id: string | undefined = players[0].id;

    if (!id) {
      console.warn("Cannot add chug: Player ID is missing.");
      return;
    }

    this.gameService.addTurnToPlayer(turn, id);

  }
}
