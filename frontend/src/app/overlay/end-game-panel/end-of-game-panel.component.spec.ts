import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { of } from 'rxjs';
import { EndOfGamePanel } from './end-of-game-panel.component';
import { GameService } from '../../services/game/game.service';
import { AchievementService } from '../../services/achievement/achievement-service';
import { TimerService } from '../../services/timer-service/timer.service';
import { Player } from '../../services/game/models/player';
import { Achievement } from '../../services/achievement/models/achievement';
import { aCard, aPlayerDto, aTimeReport, PLAYER_1, PLAYER_2 } from '../../../testing/game-builders';

describe('EndOfGamePanel', () => {
  let compact: boolean;
  let players: ReturnType<typeof signal<Player[]>>;
  let achievements: ReturnType<typeof signal<Achievement[]>>;
  let gameDuration: ReturnType<typeof signal<number | undefined>>;

  const anna = Player.fromPlayerDto(aPlayerDto({ id: PLAYER_1, name: 'Anna' }));
  const bo = Player.fromPlayerDto(aPlayerDto({ id: PLAYER_2, name: 'Bo' }));

  function anAchievement(overrides: Partial<Achievement> = {}): Achievement {
    return {
      title: 'Flest øl',
      additionalInfo: '',
      unit: 'øl',
      digitsInfo: '1.0-2',
      player: anna,
      value: 2,
      runnerUps: [],
      ...overrides,
    };
  }

  beforeEach(() => {
    compact = false;
    gameDuration = signal<number | undefined>(60_000);
    players = signal<Player[]>([anna, bo]);
    achievements = signal<Achievement[]>([
      anAchievement({ runnerUps: [{ player: bo, value: 1 }] }),
      anAchievement({ title: 'Hurtigste bunde-tid', unit: 's' }),
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: GameService,
          useValue: {
            players,
            gameInfo: signal({ name: 'Friday game' }),
            gameTimeReport: signal(aTimeReport({ pausedTime: 0 })),
          },
        },
        {
          provide: AchievementService,
          useValue: {
            achievements,
            achievementsByPlayer: computed(() => new Map<string, Achievement[]>()),
          },
        },
        {
          provide: TimerService,
          useValue: { getTimer: () => ({ currentDuration: gameDuration }) },
        },
        {
          provide: BreakpointObserver,
          useValue: { observe: () => of({ matches: compact, breakpoints: {} }) },
        },
      ],
    });
  });

  async function render() {
    const fixture = TestBed.createComponent(EndOfGamePanel);
    await fixture.whenStable();
    return fixture;
  }

  function text(fixture: ComponentFixture<EndOfGamePanel>, selector: string): string {
    return fixture.nativeElement.querySelector(selector)?.textContent.trim() ?? '';
  }

  function button(fixture: ComponentFixture<EndOfGamePanel>, label: string): HTMLButtonElement {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button') as HTMLButtonElement[],
    );
    return buttons.find(
      (candidate) =>
        candidate.textContent?.trim() === label || candidate.getAttribute('aria-label') === label,
    )!;
  }

  async function click(fixture: ComponentFixture<EndOfGamePanel>, label: string, times = 1) {
    for (let i = 0; i < times; i++) {
      button(fixture, label).click();
      await fixture.whenStable();
    }
  }

  describe('on a wide screen', () => {
    it('steps from the start page through each award to the summary', async () => {
      // Arrange
      const fixture = await render();
      const startCount = text(fixture, '.page-count');

      // Act
      await click(fixture, 'Næste', 3);

      // Assert
      expect(startCount).toBe('1/4');
      expect(text(fixture, '.page-count')).toBe('4/4');
      expect(fixture.nativeElement.querySelector('#summery-page')).not.toBeNull();
      expect(button(fixture, 'Næste').disabled).toBe(true);
    });

    it('shows the game time once the timer has caught up', async () => {
      // Arrange
      gameDuration.set(undefined);
      const fixture = await render();

      // Act
      gameDuration.set(61_000);
      await fixture.whenStable();

      // Assert
      expect(text(fixture, '#start-page p:last-child')).toBe('Friday game • 00:01:01');
    });

    it('cannot go back from the start page', async () => {
      // Act
      const fixture = await render();

      // Assert
      expect(button(fixture, 'Tilbage').disabled).toBe(true);
    });

    it('goes back a page', async () => {
      // Arrange
      const fixture = await render();
      await click(fixture, 'Næste', 2);

      // Act
      await click(fixture, 'Tilbage');

      // Assert
      expect(text(fixture, '.page-count')).toBe('2/4');
    });

    it('keeps room for a missing runner-up so the page does not shift', async () => {
      // Arrange
      const fixture = await render();

      // Act
      await click(fixture, 'Næste');

      // Assert
      const places = fixture.nativeElement.querySelectorAll('.runner-ups .nth-place');
      const empty = fixture.nativeElement.querySelectorAll('.runner-ups .nth-place.empty');
      expect(places.length).toBe(2);
      expect(empty.length).toBe(1);
      expect(empty[0].getAttribute('aria-hidden')).toBe('true');
    });

    it("summarises each player's game, averaging only the timed turns", async () => {
      // Arrange
      const player = Player.fromPlayerDto(
        aPlayerDto({
          id: PLAYER_1,
          name: 'Anna',
          stats: {
            turns: [
              { round: 1, card: aCard(7), durationInMillis: 0 },
              { round: 2, card: aCard(7), durationInMillis: 4_000 },
              { round: 3, card: aCard(14), durationInMillis: 2_000 },
            ],
            chugs: [{ chugTimeMillis: 3_000 }, { chugTimeMillis: 1_500 }],
          },
        }),
      );
      players.set([player]);
      const fixture = await render();

      // Act
      await click(fixture, 'Næste', 3);

      // Assert
      const row = fixture.nativeElement.querySelector('.player-overview > div');
      const stats = Array.from(row.querySelectorAll('.simple-stat h3') as HTMLElement[]).map(
        (stat) => stat.textContent?.trim(),
      );
      expect(stats).toEqual(['2', '28', '00:00:03', '00:00:06', '1.50']);
      expect(text(fixture, '.header .game-stat:nth-of-type(1) .stat')).toBe('2.0');
    });

    it('shows no best chug for a player who never chugged', async () => {
      // Arrange
      players.set([anna]);
      const fixture = await render();

      // Act
      await click(fixture, 'Næste', 3);

      // Assert
      const stats = fixture.nativeElement.querySelectorAll('.player-overview .simple-stat h3');
      expect(stats[stats.length - 1].textContent.trim()).toBe('--');
    });

    it('leaves the game from the summary', async () => {
      // Arrange
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      const fixture = await render();
      await click(fixture, 'Næste', 3);

      // Act
      await click(fixture, 'Forlad spil');

      // Assert
      expect(navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('on a compact screen', () => {
    beforeEach(() => {
      compact = true;
    });

    it('moves between pages with the tap zones', async () => {
      // Arrange
      const fixture = await render();
      await click(fixture, 'Næste', 2);

      // Act
      await click(fixture, 'Forrige');

      // Assert
      expect(text(fixture, '.page-count')).toBe('2/4');
    });

    it('replaces the tap zones with restart and leave on the summary', async () => {
      // Arrange
      const fixture = await render();
      await click(fixture, 'Næste', 3);
      const tapZonesOnSummary = fixture.nativeElement.querySelector('.tap-zones');

      // Act
      await click(fixture, 'Se kåringen igen');

      // Assert
      expect(tapZonesOnSummary).toBeNull();
      expect(text(fixture, '.page-count')).toBe('2/4');
    });
  });
});
