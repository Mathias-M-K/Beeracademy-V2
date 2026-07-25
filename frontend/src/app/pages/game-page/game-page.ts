import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit
} from '@angular/core';
import {GameService} from '../../services/game/game.service';
import {TimerService} from '../../services/timer-service/timer.service';
import {TimerState} from '../../../api-models/model/timerState';
import {TimerType} from '../../services/timer-service/models/TimerType';
import {WebsocketService} from '../../services/websocket.service';
import {Header} from './header/header';
import {CardCount} from './card-count/card-count';
import {DrawPanel} from './draw-panel/draw-panel';
import {PodiumComponent} from './podium/podium.component';
import {PlayerGrid} from './player-grid/player-grid';


@Component({
  selector: 'app-game-page',
  imports: [
    Header,
    CardCount,
    DrawPanel,
    PodiumComponent,
    PlayerGrid
  ],
  templateUrl: './game-page.html',
  styleUrl: './game-page.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keyup.space)': 'drawCard()',
  },
})
export class GamePage implements OnInit, OnDestroy {

  private readonly gameTimer = inject(TimerService).getTimer(TimerType.GAME);
  private readonly playerTimer = inject(TimerService).getTimer(TimerType.PLAYER);
  private readonly websocketService = inject(WebsocketService);
  private readonly gameService: GameService = inject(GameService);

  protected connectionStatus = computed(() => this.websocketService.connectionStatus());
  protected players = this.gameService.players;
  protected gameInfo = this.gameService.gameInfo;
  protected currentCard = this.gameService.currentCard;
  protected currentPlayer = this.gameService.currentPlayer;
  protected awaitingChug = this.gameService.awaitingChugFromPlayer;
  protected gameState = this.gameService.gameState;
  protected timerState = computed(() => this.gameService.gameTimeReport()?.state);

  protected formattedGameTime = this.gameTimer.currentDuration;
  protected formattedPlayerTime = this.playerTimer.currentDuration;


  ngOnDestroy(): void {
    this.websocketService.disconnect();
    this.gameService.resetGameData();
  }

  ngOnInit(): void {
    this.websocketService.connectToGameWebsocket();
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
    this.gameService.dispatchDrawCardAction(this.playerTimer.currentDuration() ?? 0);
  }

  protected readonly TimerState = TimerState;
}
