import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BreakpointObserver } from '@angular/cdk/layout';
import { of } from 'rxjs';
import { DrawPanel } from './draw-panel';
import { GameService } from '../../../services/game/game.service';
import { DrawerService } from '../../../services/drawer/drawer.service';
import { Player } from '../../../services/game/models/player';
import { PlayerTurn } from '../../../services/game/models/playerTurn';
import { aCard, aPlayerDto, PLAYER_1, PLAYER_2 } from '../../../../testing/game-builders';
import { Turn } from '../../../../api-models/model/turn';

describe('DrawPanel', () => {
  let showCardChangeDrawer: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Tweened numbers snap straight to their target, so the template shows final values.
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
    }));
    showCardChangeDrawer = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        {
          provide: BreakpointObserver,
          useValue: { observe: () => of({ matches: false, breakpoints: {} }) },
        },
        { provide: GameService, useValue: { isPlayer: signal(false) } },
        { provide: DrawerService, useValue: { showCardChangeDrawer } },
      ],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function aPlayer(id: string, name: string, turns: Turn[] = []): Player {
    return Player.fromPlayerDto(aPlayerDto({ id, name, stats: { turns, chugs: [] } }));
  }

  function turnsOf(player: Player): PlayerTurn[] {
    return (player.stats.turns ?? []).map((info) => ({ info, player }));
  }

  async function render(inputs: Partial<Record<keyof DrawPanel, unknown>> = {}) {
    const fixture = TestBed.createComponent(DrawPanel);
    fixture.componentRef.setInput('changeOfDrawingAce', 0);
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    await fixture.whenStable();
    return fixture;
  }

  function text(fixture: ComponentFixture<DrawPanel>, selector: string): string {
    return fixture.nativeElement.querySelector(selector)?.textContent.trim();
  }

  function stackedRanks(fixture: ComponentFixture<DrawPanel>): string[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('.card-stack app-card .top-left h1') as HTMLElement[],
    ).map((rank) => rank.textContent.trim());
  }

  describe('current player', () => {
    it("shows the player's average time and how the running turn moves it", async () => {
      // Arrange
      const player = aPlayer(PLAYER_1, 'Anna', [
        { round: 1, durationInMillis: 1_000 },
        { round: 2, durationInMillis: 2_000 },
        { round: 3, durationInMillis: 3_000 },
      ]);

      // Act
      const fixture = await render({ currentPlayer: player, currentPlayerTime: 6_000 });

      // Assert
      expect(text(fixture, '#current-player')).toBe('Anna');
      expect(text(fixture, '.current-time-average')).toBe('Snit 00:03:00');
      expect(text(fixture, '#delta')).toBe('Δ 1.00');
    });

    it('shows a zero average before the player has had a turn', async () => {
      // Arrange
      const player = aPlayer(PLAYER_1, 'Anna');

      // Act
      const fixture = await render({ currentPlayer: player, currentPlayerTime: 6_000 });

      // Assert
      expect(text(fixture, '.current-time-average')).toBe('Snit 00:00:00');
      expect(text(fixture, '#delta')).toBe('Δ 0.00');
    });
  });

  describe('previous draw', () => {
    it('shows the deck and no previous player before the first card is drawn', async () => {
      // Arrange
      const lastPlayer = aPlayer(PLAYER_2, 'Bo');

      // Act
      const fixture = await render({ turns: [], lastPlayer });

      // Assert
      expect(fixture.nativeElement.querySelector('app-card.backside')).not.toBeNull();
      expect(stackedRanks(fixture)).toEqual([]);
      expect(text(fixture, '.drawn-by h2')).toBe('--');
    });

    it('stacks the three latest cards, newest first, with who drew last', async () => {
      // Arrange
      const lastPlayer = aPlayer(PLAYER_2, 'Bo', [
        { round: 1, card: aCard(2), durationInMillis: 100 },
        { round: 2, card: aCard(3), durationInMillis: 200 },
        { round: 3 },
        { round: 4, card: aCard(4), durationInMillis: 300 },
        { round: 5, card: aCard(5), durationInMillis: 400 },
      ]);

      // Act
      const fixture = await render({
        turns: turnsOf(lastPlayer),
        lastPlayer,
        lastCard: aCard(5),
      });

      // Assert
      expect(stackedRanks(fixture)).toEqual(['5', '4', '3']);
      expect(fixture.nativeElement.querySelector('app-card.backside')).toBeNull();
      expect(text(fixture, '.drawn-by h2')).toBe('Bo');
      expect(text(fixture, '#sips p')).toBe('5');
    });
  });

  it('shows who is up next and the chance of drawing an ace', async () => {
    // Arrange
    const nextPlayer = aPlayer(PLAYER_2, 'Bo');

    // Act
    const fixture = await render({ nextPlayer, changeOfDrawingAce: 7.6923 });

    // Assert
    expect(text(fixture, '#next-up h2')).toBe('Bo');
    expect(text(fixture, '#ace-chance h2')).toBe('7.69%');
  });

  it.each([
    [1, 0],
    [2, 1],
  ])('opens the statistics drawer on page %i from its button', async (button, page) => {
    // Arrange
    const fixture = await render();
    const buttons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.buttons button'),
    );

    // Act
    buttons[button].click();

    // Assert
    expect(showCardChangeDrawer).toHaveBeenCalledExactlyOnceWith(page);
  });
});
