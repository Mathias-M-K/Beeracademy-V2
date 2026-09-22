import {Component, computed, inject} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {GameTimeFormatPipe} from '../../../pipes/game-time-format-pipe';
import {MaterialIcon} from '../../../common/components/material-icon/material-icon';
import {toSignal} from '@angular/core/rxjs-interop';
import {map} from 'rxjs';
import {BreakpointObserver} from '@angular/cdk/layout';
import {GameService} from '../../../services/game/game.service';
import {TimerService} from '../../../services/timer-service/timer.service';
import {TimerType} from '../../../services/timer-service/models/TimerType';
import {DrawerService} from '../../../services/drawer/drawer.service';

interface Round {
  completed: boolean;
  isCurrent: boolean;
}

@Component({
  imports: [
    RouterOutlet,
    GameTimeFormatPipe,
    MaterialIcon
  ],
  selector: 'app-party-shell',
  styleUrl: './party-shell.component.scss',
  templateUrl: './party-shell.component.html',
  host: {
    '[style.--progress.%]': 'roundProgress()',
  }
})
export class PartyShellComponent {

  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly gameService = inject(GameService);
  private readonly gameTimer = inject(TimerService).getTimer(TimerType.GAME);
  private readonly drawerService = inject(DrawerService);

  protected gameDuration = this.gameTimer.currentDuration;
  protected currentRound = this.gameService.currentRound;
  protected roundProgress = computed(() => 100 / 13 * this.currentRound());

  protected roundIndicator = computed(() => {
    const rounds: Round[] = [];
    for (let i = 1; i <= 13; ++i) {

      if (i < this.currentRound()) {
        rounds.push({completed: true, isCurrent: false});
      } else if (i === this.currentRound()) {
        rounds.push({completed: false, isCurrent: true});
      } else {
        rounds.push({completed: false, isCurrent: false});
      }

    }
    return rounds;
  });

  protected readonly isCompact = toSignal(
    this.breakpointObserver.observe('(max-width: 650px)').pipe(map((result) => result.matches)),
    {initialValue: false},
  );

  protected pauseGame() {
    this.gameService.dispatchPauseGameAction();
  }

  protected showPlayers() {
    this.drawerService.showPlayerOverviewDrawer();
  }

  protected showSharePanel() {
    this.drawerService.showPartyShareDrawer(this.gameService.gameInfo()?.id ?? '');
  }
}
