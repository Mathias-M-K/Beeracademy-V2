import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RoundHistory } from './round-history';
import { GameService } from '../../../services/game/game.service';
import { Player } from '../../../services/game/models/player';
import { PlayerTurn } from '../../../services/game/models/playerTurn';
import { aCard, threePlayers } from '../../../../testing/game-builders';

describe('RoundHistory', () => {
  let turns: ReturnType<typeof signal<PlayerTurn[]>>;
  let players: Player[];

  beforeEach(() => {
    players = threePlayers().map((dto) => Player.fromPlayerDto(dto));
    turns = signal<PlayerTurn[]>([]);

    TestBed.configureTestingModule({
      providers: [{ provide: GameService, useValue: { turns } }],
    });
  });

  async function render() {
    const fixture = TestBed.createComponent(RoundHistory);
    await fixture.whenStable();
    return fixture;
  }

  function rounds(fixture: ComponentFixture<RoundHistory>): { title: string; names: string[] }[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.round') as HTMLElement[]).map(
      (round) => ({
        title: round.querySelector(':scope > .subtitle')?.textContent.trim() ?? '',
        names: Array.from(round.querySelectorAll('.player-name')).map((name) =>
          (name.textContent ?? '').trim(),
        ),
      }),
    );
  }

  it('shows nothing before the first card is drawn', async () => {
    // Arrange
    turns.set([]);

    // Act
    const fixture = await render();

    // Assert
    expect(rounds(fixture)).toEqual([]);
  });

  it('groups the turns by round in the order they were drawn', async () => {
    // Arrange
    turns.set([
      { info: { round: 1, card: aCard(4), durationInMillis: 1_000 }, player: players[0] },
      { info: { round: 1, card: aCard(9), durationInMillis: 2_000 }, player: players[1] },
      { info: { round: 1, card: aCard(12), durationInMillis: 3_000 }, player: players[2] },
      { info: { round: 2, card: aCard(2), durationInMillis: 4_000 }, player: players[0] },
    ]);

    // Act
    const fixture = await render();

    // Assert
    expect(rounds(fixture)).toEqual([
      { title: 'Runde 1', names: ['Player 1', 'Player 2', 'Player 3'] },
      { title: 'Runde 2', names: ['Player 1'] },
    ]);
  });
});
