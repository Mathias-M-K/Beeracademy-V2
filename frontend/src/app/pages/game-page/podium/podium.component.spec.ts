import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PodiumComponent } from './podium.component';
import { Player } from '../../../services/game/models/player';
import { PlayerChug } from '../../../services/game/models/playerChug';
import { Suit } from '../../../../api-models/model/suit';
import { aCard, aPlayerDto } from '../../../../testing/game-builders';

interface ChugSpec {
  suit: Suit;
  round: number;
  time?: number;
}

interface PodiumColumn {
  name: string;
  time: string;
  animating: boolean;
}

interface HistoryRow {
  name: string;
  time: string;
  placement: string | undefined;
}

describe('PodiumComponent', () => {
  function aPlayer(id: string, name: string, chugs: ChugSpec[] = []): Player {
    return Player.fromPlayerDto(
      aPlayerDto({
        id,
        name,
        stats: {
          turns: chugs.map((chug) => ({ round: chug.round, card: aCard(14, chug.suit) })),
          chugs: chugs.map((chug) => ({ suit: chug.suit, chugTimeMillis: chug.time })),
        },
      }),
    );
  }

  async function render(players: Player[]) {
    const fixture = TestBed.createComponent(PodiumComponent);
    fixture.componentRef.setInput('players', players);
    await fixture.whenStable();
    return fixture;
  }

  async function setPlayers(fixture: ComponentFixture<PodiumComponent>, players: Player[]) {
    fixture.componentRef.setInput('players', players);
    await fixture.whenStable();
  }

  async function finishAnimations(fixture: ComponentFixture<PodiumComponent>) {
    const animating = Array.from(
      fixture.nativeElement.querySelectorAll('.podium-shape.slup-animation') as HTMLElement[],
    );
    animating.forEach((shape) => shape.dispatchEvent(new Event('animationiteration')));
    animating.forEach((shape) => shape.dispatchEvent(new Event('animationend')));
    await fixture.whenStable();
  }

  function podium(fixture: ComponentFixture<PodiumComponent>): PodiumColumn[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.column') as HTMLElement[]).map(
      (column) => ({
        name: column.querySelector('.player-name')!.textContent.trim(),
        time: column.querySelector('.time')!.textContent.trim(),
        animating: column.querySelector('.podium-shape')!.classList.contains('slup-animation'),
      }),
    );
  }

  function history(fixture: ComponentFixture<PodiumComponent>): HistoryRow[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.chug-time') as HTMLElement[]).map(
      (row) => {
        const [name, time] = Array.from(row.querySelectorAll(':scope > p')).map((p) =>
          p.textContent!.trim(),
        );
        const placement = row.querySelector('.placement-indicator p')?.textContent.trim();
        return { name, time, placement };
      },
    );
  }

  describe('podium', () => {
    it('shows three free steps and no history before anyone has chugged', async () => {
      // Arrange
      const players = [aPlayer('p1', 'Anna'), aPlayer('p2', 'Bo')];

      // Act
      const fixture = await render(players);

      // Assert
      const free = { name: 'Ledig', time: '--', animating: false };
      expect(podium(fixture)).toEqual([free, free, free]);
      expect(fixture.nativeElement.querySelector('.chug-history')).toBeNull();
    });

    it('shows three free steps before the players are known', async () => {
      // Act
      const fixture = TestBed.createComponent(PodiumComponent);
      await fixture.whenStable();

      // Assert
      expect(podium(fixture).map((column) => column.name)).toEqual(['Ledig', 'Ledig', 'Ledig']);
      expect(fixture.nativeElement.querySelector('.chug-history')).toBeNull();
    });

    it('leaves out players without stats', async () => {
      // Arrange
      const anna = aPlayer('p1', 'Anna', [{ suit: Suit.Heart, round: 1, time: 1_000 }]);
      const bo = Player.fromPlayerDto(aPlayerDto({ id: 'p2', name: 'Bo', stats: undefined }));
      const fixture = await render([anna, bo]);

      // Act
      await finishAnimations(fixture);

      // Assert
      expect(podium(fixture).map((column) => column.name)).toEqual(['Ledig', 'Anna', 'Ledig']);
    });

    it('places the three fastest chuggers as second, first and third', async () => {
      // Arrange
      const fixture = await render([
        aPlayer('p1', 'Anna', [{ suit: Suit.Heart, round: 1, time: 3_000 }]),
        aPlayer('p2', 'Bo', [{ suit: Suit.Spade, round: 2, time: 1_500 }]),
        aPlayer('p3', 'Cara', [{ suit: Suit.Club, round: 3, time: 2_000 }]),
        aPlayer('p4', 'Dan', [{ suit: Suit.Diamond, round: 4, time: 4_000 }]),
      ]);

      // Act
      await finishAnimations(fixture);

      // Assert
      expect(podium(fixture)).toEqual([
        { name: 'Cara', time: '2.00 s', animating: false },
        { name: 'Bo', time: '1.50 s', animating: false },
        { name: 'Anna', time: '3.00 s', animating: false },
      ]);
    });

    it('keeps a step free until its animation swaps the player in', async () => {
      // Arrange
      const players = [aPlayer('p1', 'Anna', [{ suit: Suit.Heart, round: 1, time: 3_000 }])];

      // Act
      const fixture = await render(players);

      // Assert
      expect(podium(fixture)[1]).toEqual({ name: 'Ledig', time: '--', animating: true });
    });

    it("ranks a player by their best chug and leaves out chugs that weren't timed", async () => {
      // Arrange
      const fixture = await render([
        aPlayer('p1', 'Anna', [
          { suit: Suit.Heart, round: 1, time: 5_000 },
          { suit: Suit.Spade, round: 2, time: 1_000 },
        ]),
        aPlayer('p2', 'Bo', [{ suit: Suit.Club, round: 3 }]),
      ]);

      // Act
      await finishAnimations(fixture);

      // Assert
      expect(podium(fixture).map((column) => column.name)).toEqual(['Ledig', 'Anna', 'Ledig']);
      expect(podium(fixture)[1].time).toBe('1.00 s');
    });

    it('animates only the steps whose player or time changed', async () => {
      // Arrange
      const anna = aPlayer('p1', 'Anna', [{ suit: Suit.Heart, round: 1, time: 1_000 }]);
      const bo = aPlayer('p2', 'Bo', [{ suit: Suit.Spade, round: 2, time: 2_000 }]);
      const cara = aPlayer('p3', 'Cara', [{ suit: Suit.Club, round: 3, time: 4_000 }]);
      const fixture = await render([anna, bo, cara]);
      await finishAnimations(fixture);
      const dan = aPlayer('p4', 'Dan', [{ suit: Suit.Diamond, round: 4, time: 3_000 }]);

      // Act
      await setPlayers(fixture, [anna, bo, cara, dan]);

      // Assert
      expect(podium(fixture).map((column) => column.animating)).toEqual([false, false, true]);
      await finishAnimations(fixture);
      expect(podium(fixture)[2]).toEqual({ name: 'Dan', time: '3.00 s', animating: false });
    });

    it('does not animate when the players are replaced with an identical ranking', async () => {
      // Arrange
      const chug = { suit: Suit.Heart, round: 1, time: 1_000 };
      const fixture = await render([aPlayer('p1', 'Anna', [chug])]);
      await finishAnimations(fixture);

      // Act
      await setPlayers(fixture, [aPlayer('p1', 'Anna', [chug]), aPlayer('p2', 'Bo')]);

      // Assert
      expect(podium(fixture).some((column) => column.animating)).toBe(false);
    });
  });

  describe('chug history', () => {
    function aPlayerChug(
      name: string,
      chugNumber: number,
      placement: number | undefined,
      suit: Suit,
      time?: number,
    ): PlayerChug {
      return {
        player: aPlayer(`p${chugNumber}`, name),
        chug: { suit, chugTimeMillis: time },
        chugNumber,
        placement,
      };
    }

    async function renderHistory(chugs: PlayerChug[]) {
      const fixture = TestBed.createComponent(PodiumComponent);
      fixture.componentRef.setInput('chugs', chugs);
      await fixture.whenStable();
      return fixture;
    }

    it('lists chugs newest first, marking the top three placements', async () => {
      // Arrange
      const chronological = [
        aPlayerChug('Anna', 1, 3, Suit.Heart, 3_000),
        aPlayerChug('Bo', 2, 1, Suit.Spade, 1_000),
        aPlayerChug('Cara', 3, 2, Suit.Club, 2_000),
        aPlayerChug('Dan', 4, 4, Suit.Diamond, 4_000),
      ];

      // Act
      const fixture = await renderHistory(chronological);

      // Assert
      expect(history(fixture)).toEqual([
        { name: 'Dan', time: '4.00s', placement: undefined },
        { name: 'Cara', time: '2.00s', placement: '2' },
        { name: 'Bo', time: '1.00s', placement: '1' },
        { name: 'Anna', time: '3.00s', placement: '3' },
      ]);
    });

    it('shows an untimed chug without a time or placement', async () => {
      // Arrange
      const chronological = [
        aPlayerChug('Anna', 1, 1, Suit.Heart, 1_000),
        aPlayerChug('Bo', 2, undefined, Suit.Spade),
      ];

      // Act
      const fixture = await renderHistory(chronological);

      // Assert
      expect(history(fixture)).toEqual([
        { name: 'Bo', time: '--', placement: undefined },
        { name: 'Anna', time: '1.00s', placement: '1' },
      ]);
    });
  });
});
