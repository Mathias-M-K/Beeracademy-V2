import { TestBed } from '@angular/core/testing';
import { BreakpointObserver } from '@angular/cdk/layout';
import { of } from 'rxjs';
import { PlayerGrid } from './player-grid';
import { Player } from '../../../services/game/models/player';
import { PLAYER_1, PLAYER_2, threePlayers } from '../../../../testing/game-builders';

describe('PlayerGrid', () => {
  let compact: boolean;

  beforeEach(() => {
    compact = false;
  });

  function players(): Player[] {
    return threePlayers().map((dto) => Player.fromPlayerDto(dto));
  }

  async function render(activePlayerId = PLAYER_1): Promise<HTMLElement> {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: BreakpointObserver,
          useValue: { observe: () => of({ matches: compact, breakpoints: {} }) },
        },
      ],
    });
    const fixture = TestBed.createComponent(PlayerGrid);
    fixture.componentRef.setInput('players', players());
    fixture.componentRef.setInput('activePlayerId', activePlayerId);
    await fixture.whenStable();
    return fixture.nativeElement;
  }

  function cards(grid: HTMLElement): HTMLElement[] {
    return Array.from(grid.querySelectorAll('app-player-card'));
  }

  function withClass(grid: HTMLElement, className: string): boolean[] {
    return cards(grid).map((card) => card.classList.contains(className));
  }

  it('shows a card per player and marks who is drawing', async () => {
    // Arrange
    const activePlayerId = PLAYER_2;

    // Act
    const grid = await render(activePlayerId);

    // Assert
    expect(cards(grid).map((card) => card.querySelector('h2')?.textContent)).toEqual([
      'Player 1',
      'Player 2',
      'Player 3',
    ]);
    expect(withClass(grid, 'is-drawing')).toEqual([false, true, false]);
  });

  describe('on a compact screen', () => {
    it('shows the cards in compact mode', async () => {
      // Arrange
      compact = true;

      // Act
      const grid = await render();

      // Assert
      expect(withClass(grid, 'is-compact')).toEqual([true, true, true]);
    });

    it('folds every card but the first', async () => {
      // Arrange
      compact = true;

      // Act
      const grid = await render();

      // Assert
      expect(withClass(grid, 'is-folded')).toEqual([false, true, true]);
    });
  });

  describe('on a wide screen', () => {
    it('shows the cards in full and unfolded', async () => {
      // Arrange
      compact = false;

      // Act
      const grid = await render();

      // Assert
      expect(withClass(grid, 'is-compact')).toEqual([false, false, false]);
      expect(withClass(grid, 'is-folded')).toEqual([false, false, false]);
    });
  });
});
