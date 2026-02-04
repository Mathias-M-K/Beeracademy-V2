import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  Signal,
  ViewChild,
  WritableSignal
} from '@angular/core';
import {WebsocketService} from '../../services/websocket.service';
import {GameService} from '../../services/game-service/game.service';
import {PlayerDto} from '../../../api-models/model/playerDto';
import {Suit} from '../../../api-models/model/suit';
import {Turn} from '../../../api-models/model/turn';
import {Card} from '../../../api-models/model/card';
import {GameInfo} from '../../services/game-service/models/game-info';
import {GameIdPipe} from '../../pipes/game-id-pipe';
import {GameTimeFormatPipe} from '../../pipes/game-time-format-pipe';
import {TimerService} from '../../services/timer-service/timer.service';
import {GameState} from '../../../api-models/model/gameState';
import {TimerState} from '../../../api-models/model/timerState';
import {TimerType} from '../../services/timer-service/models/TimerType';

@Component({
  selector: 'app-game-page',
  imports: [
    GameIdPipe,
    GameTimeFormatPipe
  ],
  templateUrl: './game-page.html',
  styleUrl: './game-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GamePage implements OnInit, OnDestroy {

  @ViewChild("chugTime")
  private chugTimeField!: ElementRef;

  protected connectionStatus = computed(() => this.websocketService.connectionStatus());
  protected players: Signal<PlayerDto[]>;
  protected gameInfo: Signal<GameInfo | undefined>;
  protected currentCard: WritableSignal<Card | undefined>;
  protected currentPlayer: WritableSignal<PlayerDto | undefined>;
  protected awaitingChug: Signal<PlayerDto | undefined>;
  protected gameState: Signal<GameState | undefined>;
  protected timerState: Signal<TimerState | undefined>

  private gameTimer = inject(TimerService).getTimer(TimerType.GAME);
  private playerTimer = inject(TimerService).getTimer(TimerType.PLAYER);
  protected formattedGameTime = this.gameTimer.currentDuration;
  protected formattedPlayerTime = this.playerTimer.currentDuration;


  constructor(private websocketService: WebsocketService, private gameService: GameService) { // Injecting it to ensure it's instantiated) {
    this.players = this.gameService.players;
    this.gameInfo = this.gameService.gameInfo;
    this.currentCard = this.gameService.currentCard;
    this.currentPlayer = this.gameService.currenPlayer;
    this.awaitingChug = this.gameService.awaitingChugFromPlayer;
    this.gameState = this.gameService.gameState;
    // @ts-ignore
    this.timerState = computed(() => this.gameService.timeReports()?.gameTimeReport?.state);
  }

  ngOnDestroy(): void {
    this.websocketService.closeConnection();
    this.gameService.resetGameData();
  }

  ngOnInit(): void {
    this.websocketService.connectToWebSocket();
  }

  protected startGame() {
    this.gameService.dispatchStartGameAction();
  }

  protected pauseGame() {
    this.gameService.dispatchPauseGameAction();
  }

  protected resumeGame() {
    this.gameService.dispatchResumeGameAction();
  }

  protected drawCard() {
    this.gameService.dispatchDrawCardAction();
  }


  protected addTurn() {
    const players = this.players();
    if (players.length === 0) {
      console.warn("Cannot add chug: No players found in state.");
      return;
    }

    const card: Card = {
      suit: Suit.Circle,
      rank: 10
    }

    const turn: Turn = {
      round: 1,
      card: card,
      durationInMillis: 1500
    }
    const id: string | undefined = players[0].id;

    if (!id) {
      console.warn("Cannot add chug: Player ID is missing.");
      return;
    }

    this.gameService.addTurnToPlayer(turn, id);

  }

  protected registerChug() {
    this.gameService.dispatchChugAction(this.chugTimeField.nativeElement.value);
  }

  protected readonly GameState = GameState;
  protected readonly TimerState = TimerState;
}
