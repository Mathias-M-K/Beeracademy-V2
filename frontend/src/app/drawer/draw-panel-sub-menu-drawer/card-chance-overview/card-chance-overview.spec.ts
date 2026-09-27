import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CardChanceOverview } from './card-chance-overview';
import { GameService } from '../../../services/game/game.service';
import { Player } from '../../../services/game/models/player';
import { RankCountDto } from '../../../../api-models/model/rankCountDto';
import { threePlayers } from '../../../../testing/game-builders';

describe('CardChanceOverview', () => {
  async function render(remainingCardsByRank: RankCountDto[]) {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: GameService,
          useValue: {
            remainingCardsByRank: signal(remainingCardsByRank),
            players: signal(threePlayers().map((dto) => Player.fromPlayerDto(dto))),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(CardChanceOverview);
    await fixture.whenStable();
    return fixture;
  }

  it('shows how many of each rank are left and the chance of drawing it', async () => {
    // Arrange
    const remaining: RankCountDto[] = [
      { rank: 14, count: 2 },
      { rank: 13, count: 1 },
      { rank: 12, count: 0 },
      { rank: 11, count: 0 },
      { rank: 5, count: 1 },
    ];

    // Act
    const fixture = await render(remaining);

    // Assert
    const rows = Array.from(fixture.nativeElement.querySelectorAll('.card') as HTMLElement[]).map(
      (row) => Array.from(row.querySelectorAll('p')).map((cell) => (cell.textContent ?? '').trim()),
    );
    expect(rows).toEqual([
      ['A', '2/3', '50.00%'],
      ['K', '1/3', '25.00%'],
      ['D', '0/3', '0.00%'],
      ['J', '0/3', '0.00%'],
      ['5', '1/3', '25.00%'],
    ]);
  });
});
