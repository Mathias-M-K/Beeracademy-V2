import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject, OnDestroy,
  OnInit
} from '@angular/core';
import {GameService} from '../../services/game/game.service';
import {TimerService} from '../../services/timer-service/timer.service';
import {TimerState} from '../../../api-models/model/timerState';
import {TimerType} from '../../services/timer-service/models/TimerType';
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
  private readonly gameService: GameService = inject(GameService);

  protected players = this.gameService.players;
  protected gameInfo = this.gameService.gameInfo;
  protected currentCard = this.gameService.currentCard;
  protected currentPlayer = this.gameService.currentPlayer;
  protected awaitingChug = this.gameService.awaitingChugFromPlayer;
  protected gameState = this.gameService.gameState;
  protected currentRound = this.gameService.currentRound;
  protected timerState = computed(() => this.gameService.gameTimeReport()?.state);


  protected formattedGameTime = this.gameTimer.currentDuration;
  protected formattedPlayerTime = this.playerTimer.currentDuration;

  remainingCardsCount = this.gameService.remainingCardsCount;

  ngOnInit(): void {
    this.gameService.connectToWebsocket();
  }

  ngOnDestroy() {
    this.gameService.onGamePageDestroyed();
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
