import { Component, computed, inject, signal } from '@angular/core';
import { GameService } from '../../services/game/game.service';
import { AnimatedText } from '../../common/components/animated-text/animated-text';
import { AnimatedNumber } from '../../common/components/animated-number/animated-number';
import { ParticipantBadge } from '../../pages/lobby-page/participant-overview/participant/participant-badge/participant-badge';
import { AchievementService } from '../../services/achievement/achievement-service';
import { Achievement } from '../../services/achievement/models/achievement';
import { TimerService } from '../../services/timer-service/timer.service';
import { TimerType } from '../../services/timer-service/models/TimerType';
import { GameTimeFormatPipe } from '../../pipes/game-time-format-pipe';
import { DecimalPipe } from '@angular/common';
import { Dot } from '../../common/dot/dot';
import { Player } from '../../services/game/models/player';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MaterialIcon } from '../../common/components/material-icon/material-icon';

type EndOfGamePage =
  { kind: 'start' } | { kind: 'achievement'; achievement: Achievement } | { kind: 'summary' };

interface PlayerSummary {
  player: Player;
  sips: number;
  beers: number;
  totalRoundTime: number;
  avgRoundTime: number;
  bestChugTime?: number;
  achievements: Achievement[];
}

const sum = (values: number[]): number => values.reduce((total, value) => total + value, 0);

@Component({
  imports: [
    AnimatedNumber,
    AnimatedText,
    ParticipantBadge,
    GameTimeFormatPipe,
    DecimalPipe,
    Dot,
    MaterialIcon,
  ],
  selector: 'app-end-game-panel',
  styleUrl: './end-of-game-panel.component.scss',
  templateUrl: './end-of-game-panel.component.html',
  host: {
    '[style.--background-color]': 'background()',
  },
})
export class EndOfGamePanel {
  private readonly router = inject(Router);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly gameService = inject(GameService);
  private readonly achievementService = inject(AchievementService);
  private readonly gameTimer = inject(TimerService).getTimer(TimerType.GAME);

  protected readonly background = computed(
    () => this.currentAchievement()?.player.color ?? 'var(--nice-black)',
  );

  protected readonly partyName = computed(() => this.gameService.gameInfo()?.name ?? '');
  protected readonly gameTime = computed(() => this.gameTimer.currentDuration() ?? 0);
  protected readonly pauseTime = computed(() => this.gameService.gameTimeReport()?.pausedTime ?? 0);

  protected readonly pages = computed<EndOfGamePage[]>(() => [
    { kind: 'start' },
    ...this.achievementService
      .achievements()
      .map((achievement) => ({ kind: 'achievement' as const, achievement })),
    { kind: 'summary' },
  ]);
  protected readonly currentPageIndex = signal(0);
  /** Second and third place always take up room, so pages don't shift when one is missing. */
  protected readonly runnerUpSlots = [0, 1];
  protected readonly currentPage = computed(() => this.pages()[this.currentPageIndex()]);

  protected readonly achievements = this.achievementService.achievements;
  private readonly achievementsByPlayer = this.achievementService.achievementsByPlayer;

  protected readonly playerSummaries = computed<PlayerSummary[]>(() =>
    this.players().map((player) => {
      const turns = player.stats?.turns ?? [];
      const chugTimes = (player.stats?.chugs ?? [])
        .map((chug) => chug.chugTimeMillis)
        .filter((time) => time !== undefined);

      const sips = sum(turns.map((turn) => turn.card?.rank ?? 0));
      // The first round is untimed, so its turns are recorded as 0 ms and left out of the average.
      const timedTurnDurations = turns
        .map((turn) => turn.durationInMillis ?? 0)
        .filter((millis) => millis > 0);
      const totalRoundTime = sum(timedTurnDurations);

      return {
        player,
        sips,
        beers: sips / player.sipsInABeer,
        totalRoundTime,
        avgRoundTime: timedTurnDurations.length ? totalRoundTime / timedTurnDurations.length : 0,
        bestChugTime: chugTimes.length ? Math.min(...chugTimes) : undefined,
        achievements: this.achievementsByPlayer().get(player.id) ?? [],
      };
    }),
  );

  protected readonly beersConsumedTotal = computed(() =>
    sum(this.playerSummaries().map((summary) => summary.beers)),
  );
  protected readonly sipsConsumedTotal = computed(() =>
    sum(this.playerSummaries().map((summary) => summary.sips)),
  );

  private readonly currentAchievement = computed(() => {
    const page = this.currentPage();
    return page.kind === 'achievement' ? page.achievement : undefined;
  });

  protected players = this.gameService.players;

  protected readonly isCompact = toSignal(
    this.breakpointObserver.observe('(max-width: 500px)').pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  protected previousPage(): void {
    this.currentPageIndex.update((index) => Math.max(0, index - 1));
  }

  protected nextPage(): void {
    this.currentPageIndex.update((index) => Math.min(this.pages().length - 1, index + 1));
  }

  protected restart(): void {
    this.currentPageIndex.set(1);
  }

  protected leavePage(): void {
    void this.router.navigate(['/']);
  }
}
