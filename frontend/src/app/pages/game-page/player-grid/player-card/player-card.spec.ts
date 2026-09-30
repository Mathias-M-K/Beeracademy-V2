import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PlayerCard } from './player-card';
import { Player } from '../../../../services/game/models/player';
import { aCard, aPlayerDto } from '../../../../../testing/game-builders';

describe('PlayerCard', () => {
  async function render(
    player: Player,
    mode: 'compact' | 'default' = 'default',
  ): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(PlayerCard);
    fixture.componentRef.setInput('player', player);
    fixture.componentRef.setInput('mode', mode);
    await fixture.whenStable();
    return fixture.nativeElement;
  }

  function foldToggle(card: HTMLElement): HTMLButtonElement | null {
    return card.querySelector('.fold-toggle');
  }

  function foldables(card: HTMLElement): HTMLElement[] {
    return Array.from(card.querySelectorAll('.foldable'));
  }

  function inert(card: HTMLElement): boolean[] {
    return foldables(card).map((foldable) => foldable.hasAttribute('inert'));
  }

  async function toggleFold(card: HTMLElement): Promise<void> {
    foldToggle(card)!.click();
    await TestBed.inject(ApplicationRef).whenStable();
  }

  function beerProgression(card: HTMLElement): string {
    return card.style.getPropertyValue('--beer-progression');
  }

  describe('beer progression', () => {
    it('is empty before the player has drunk anything', async () => {
      // Arrange
      const player = Player.fromPlayerDto(aPlayerDto({ stats: { turns: [], chugs: [] } }));

      // Act
      const card = await render(player);

      // Assert
      expect(beerProgression(card)).toBe('0%');
    });

    it('shows how far into the open beers the player is', async () => {
      // Arrange
      const player = Player.fromPlayerDto(
        aPlayerDto({
          sipsInABeer: 14,
          stats: { turns: [{ card: aCard(7) }, { card: aCard(14) }], chugs: [] },
        }),
      );

      // Act
      const card = await render(player);

      // Assert
      expect(beerProgression(card)).toBe('75%');
    });
  });

  describe('folding', () => {
    it('has no fold toggle outside compact mode', async () => {
      // Arrange
      const player = Player.fromPlayerDto(aPlayerDto());

      // Act
      const card = await render(player, 'default');

      // Assert
      expect(foldToggle(card)).toBeNull();
      expect(card.classList.contains('is-folded')).toBe(false);
    });

    it('starts unfolded in compact mode', async () => {
      // Arrange
      const player = Player.fromPlayerDto(aPlayerDto());

      // Act
      const card = await render(player, 'compact');

      // Assert
      expect(card.classList.contains('is-folded')).toBe(false);
      expect(foldToggle(card)!.getAttribute('aria-expanded')).toBe('true');
      expect(inert(card)).toEqual([false, false]);
    });

    it('folds everything below the header away and makes it inert', async () => {
      // Arrange
      const card = await render(Player.fromPlayerDto(aPlayerDto()), 'compact');

      // Act
      await toggleFold(card);

      // Assert
      expect(card.classList.contains('is-folded')).toBe(true);
      expect(foldToggle(card)!.getAttribute('aria-expanded')).toBe('false');
      expect(foldToggle(card)!.getAttribute('aria-controls')).toBe(
        foldables(card)
          .map((foldable) => foldable.id)
          .join(' '),
      );
      expect(inert(card)).toEqual([true, true]);
    });

    it('unfolds again on a second toggle', async () => {
      // Arrange
      const card = await render(Player.fromPlayerDto(aPlayerDto()), 'compact');
      await toggleFold(card);

      // Act
      await toggleFold(card);

      // Assert
      expect(card.classList.contains('is-folded')).toBe(false);
      expect(inert(card)).toEqual([false, false]);
    });
  });
});
