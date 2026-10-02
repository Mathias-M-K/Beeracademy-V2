import {Component, computed, effect, inject, signal} from '@angular/core';
import {GameService} from '../../services/game/game.service';
import {AnimatedText} from '../../common/components/animated-text/animated-text';
import {AnimatedNumber} from '../../common/components/animated-number/animated-number';
import {
  ParticipantBadge
} from '../../pages/lobby-page/participant-overview/participant/participant-badge/participant-badge';
import {AchievementService} from '../../services/achievement/achievement-service';
import {Achievement} from '../../services/achievement/models/achievement';

type EndOfGamePage =
  | { kind: 'start' }
  | { kind: 'achievement'; achievement: Achievement }
  | { kind: 'summary' };

@Component({
  imports: [
    AnimatedNumber,
    AnimatedText,
    ParticipantBadge
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

  protected readonly pages = computed<EndOfGamePage[]>(() => [
    { kind: 'start' },
    ...this.achievementService
      .achievements()
      .map((achievement) => ({ kind: 'achievement' as const, achievement })),
    { kind: 'summary' },
  ]);

  protected readonly currentPageIndex = signal(0);
  protected readonly currentPage = computed(() => this.pages()[this.currentPageIndex()]);

  private readonly currentAchievement = computed(() => {
    const page = this.currentPage();
    return page.kind === 'achievement' ? page.achievement : undefined;
  });

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
    this.currentPageIndex.update((index) => Math.min(this.pages().length - 1, index + 1));
  }


}
