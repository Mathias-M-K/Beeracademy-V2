import {Component, computed, effect, inject, signal} from '@angular/core';
import {GameService} from '../../services/game/game.service';
import {AnimatedText} from '../../common/components/animated-text/animated-text';
import {AnimatedNumber} from '../../common/components/animated-number/animated-number';
import {
  ParticipantBadge
} from '../../pages/lobby-page/participant-overview/participant/participant-badge/participant-badge';
import {tweenedNumber} from '../../common/tweened-number';
import {DecimalPipe} from '@angular/common';
import {AchievementService} from '../../services/achievement/achievement-service';
import {Achievement} from '../../services/achievement/models/achievement';

interface EndOfGamePage {
  achievementTitle: string;
  statValue: number;
  statUnit: string;
  explanation: string;

  playerName: string;
  playerColor: string;

  id: number;
}

@Component({
  imports: [
    AnimatedNumber,
    AnimatedText,
    ParticipantBadge,
    DecimalPipe
  ],
  selector: 'app-end-game-panel',
  styleUrl: './end-of-game-panel.component.scss',
  templateUrl: './end-of-game-panel.component.html',
  host: {
    '[style.--background-color]': 'background()'
  }
})
export class EndOfGamePanel {

  private readonly gameService = inject(GameService);
  private readonly achievementService = inject(AchievementService);

  protected readonly background = computed(
    () => this.currentAchievement()?.player.color ?? 'var(--nice-black)',
  );

  protected readonly achievements = this.achievementService.achievements;

  protected readonly currentPageIndex = signal(0);
  private readonly summaryPageIndex = computed(() => this.achievements().length + 1);

  protected isStartPage = computed(() => this.currentPageIndex() === 0);
  protected isSummaryPage = computed(() => this.currentPageIndex() === this.summaryPageIndex());
  protected isAchievementPage = computed(() => !this.isStartPage() && !this.isSummaryPage());

  protected readonly currentAchievement = computed<Achievement | undefined>(
    () => this.achievements()[this.currentPageIndex() - 1],
  );

  private readonly _statValue = computed(() => this.currentAchievement()?.value ?? 0);
  protected readonly statValue = tweenedNumber(this._statValue);


  protected players = this.gameService.players;

  constructor() {
    effect(() => {
      console.log(this.achievementService.achievements());
    });
  }

  protected previousPage(): void {
    this.currentPageIndex.update((index) => Math.max(0, index - 1));
  }

  protected nextPage(): void {
    this.currentPageIndex.update((index) => Math.min(this.summaryPageIndex(), index + 1));
  }


}
