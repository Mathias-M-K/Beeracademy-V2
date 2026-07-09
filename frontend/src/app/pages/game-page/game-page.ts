import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  Signal,
  WritableSignal
} from '@angular/core';
import {GameService} from '../../services/game/game.service';
import {PlayerDto} from '../../../api-models/model/playerDto';
import {Card} from '../../../api-models/model/card';
import {GameInfo} from '../../services/game/models/game-info';
import {TimerService} from '../../services/timer-service/timer.service';
import {GameState} from '../../../api-models/model/gameState';
import {TimerState} from '../../../api-models/model/timerState';
import {TimerType} from '../../services/timer-service/models/TimerType';
import {WebsocketService} from '../../services/websocket.service';
import {Header} from './header/header';
import {CardCount} from './card-count/card-count';
import {DrawPanel} from './draw-panel/draw-panel';
import {PodiumComponent} from './podium/podium.component';
import {PlayerGrid} from './player-grid/player-grid';
import {BeerBottle} from '../../common/beer-bottle/beer-bottle';


@Component({
  selector: 'app-game-page',
  imports: [
    Header,
    CardCount,
    DrawPanel,
    PodiumComponent,
    PlayerGrid,
    BeerBottle
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

  protected connectionStatus = computed(() => this.websocketService.connectionStatus());
  protected players: Signal<PlayerDto[]>;
  protected gameInfo: Signal<GameInfo | undefined>;
  protected currentCard: WritableSignal<Card | undefined>;
  protected currentPlayer: WritableSignal<PlayerDto | undefined>;
  protected awaitingChug: Signal<PlayerDto | undefined>;
  protected gameState: Signal<GameState | undefined>;
  protected timerState: Signal<TimerState | undefined>

  private readonly gameTimer = inject(TimerService).getTimer(TimerType.GAME);
  private readonly playerTimer = inject(TimerService).getTimer(TimerType.PLAYER);
  protected formattedGameTime = this.gameTimer.currentDuration;
  protected formattedPlayerTime = this.playerTimer.currentDuration;

  private readonly websocketService = inject(WebsocketService);
  private readonly gameService: GameService = inject(GameService);


  constructor() {
    this.players = this.gameService.players;
    this.gameInfo = this.gameService.gameInfo;
    this.currentCard = this.gameService.currentCard;
    this.currentPlayer = this.gameService.currentPlayer;
    this.awaitingChug = this.gameService.awaitingChugFromPlayer;
    this.gameState = this.gameService.gameState;
    this.timerState = computed(() => this.gameService.gameTimeReport()?.state);
  }

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
