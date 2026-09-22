import { TestBed } from '@angular/core/testing';
import { PlayerCard } from './player-card';
import { Player } from '../../../../services/game/models/player';
import { aCard, aPlayerDto } from '../../../../../testing/game-builders';

describe('PlayerCard', () => {
  async function render(player: Player): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(PlayerCard);
    fixture.componentRef.setInput('player', player);
    await fixture.whenStable();
    return fixture.nativeElement;
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
});
