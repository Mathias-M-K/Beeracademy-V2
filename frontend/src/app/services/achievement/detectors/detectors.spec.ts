import { Player } from '../../game/models/player';
import { PlayerTurn } from '../../game/models/playerTurn';
import { PlayerChug } from '../../game/models/playerChug';
import { aCard, aPlayerDto, PLAYER_1, PLAYER_2, PLAYER_3 } from '../../../../testing/game-builders';
import { fastestAverageTurn } from './fastest-average-turn';
import { slowestChug } from './slowest-chug';
import { noChugs } from './no-chugs';
import { fastestChug } from './fastest-chug';
import { mostBeers } from './most-beers';

const anna = Player.fromPlayerDto(aPlayerDto({ id: PLAYER_1, name: 'Anna' }));
const bo = Player.fromPlayerDto(aPlayerDto({ id: PLAYER_2, name: 'Bo' }));
const carl = Player.fromPlayerDto(aPlayerDto({ id: PLAYER_3, name: 'Carl' }));

const turn = (player: Player, durationInMillis: number, rank = 5): PlayerTurn => ({
  player,
  info: { round: 1, card: aCard(rank), durationInMillis },
});

const chug = (player: Player, chugTimeMillis: number): PlayerChug => ({
  player,
  chug: { chugTimeMillis },
  placement: 1,
  chugNumber: 1,
});

describe('fastestAverageTurn', () => {
  it('ranks players by their average turn time, quickest first', () => {
    // Arrange
    const turns = [
      turn(anna, 1000),
      turn(anna, 5000),
      turn(bo, 2000),
      turn(bo, 2000),
      turn(carl, 4000),
    ];

    // Act
    const achievement = fastestAverageTurn({ turns, chugs: [] });

    // Assert
    expect(achievement?.player).toBe(bo);
    expect(achievement?.value).toBe(2);
    expect(achievement?.runnerUps).toEqual([
      { player: anna, value: 3 },
      { player: carl, value: 4 },
    ]);
    expect(achievement?.additionalInfo).toBe('1.00 s hurtigere end Anna');
  });

  it('leaves the untimed turns of the first round out of the average', () => {
    // Arrange
    const turns = [turn(anna, 0), turn(anna, 3000), turn(bo, 2000)];

    // Act
    const achievement = fastestAverageTurn({ turns, chugs: [] });

    // Assert
    expect(achievement?.player).toBe(bo);
    expect(achievement?.runnerUps).toEqual([{ player: anna, value: 3 }]);
  });

  it('is not awarded before any turn has been timed', () => {
    // Arrange
    const turns = [turn(anna, 0)];

    // Act
    const achievement = fastestAverageTurn({ turns, chugs: [] });

    // Assert
    expect(achievement).toBeUndefined();
  });
});

describe('slowestChug', () => {
  it("ranks each player's slowest chug, slowest first", () => {
    // Arrange
    const chugs = [chug(anna, 3000), chug(anna, 9000), chug(bo, 6000), chug(carl, 4000)];

    // Act
    const achievement = slowestChug({ turns: [], chugs });

    // Assert
    expect(achievement?.player).toBe(anna);
    expect(achievement?.value).toBe(9);
    expect(achievement?.runnerUps).toEqual([
      { player: bo, value: 6 },
      { player: carl, value: 4 },
    ]);
    expect(achievement?.additionalInfo).toBe('3.00 s langsommere end Bo');
  });

  it('is not awarded without any chugs', () => {
    // Act
    const achievement = slowestChug({ turns: [], chugs: [] });

    // Assert
    expect(achievement).toBeUndefined();
  });
});

describe('noChugs', () => {
  it('goes to the player who drew the most cards without chugging', () => {
    // Arrange
    const turns = [turn(anna, 1000, 14), turn(bo, 1000), turn(carl, 1000), turn(carl, 1000)];
    const chugs = [chug(anna, 5000)];

    // Act
    const achievement = noChugs({ turns, chugs });

    // Assert
    expect(achievement?.player).toBe(carl);
    expect(achievement?.additionalInfo).toBe('2 kort - men intet es');
    expect(achievement?.runnerUps).toEqual([{ player: bo, value: 0 }]);
  });

  it('is not awarded when everyone has chugged', () => {
    // Arrange
    const turns = [turn(anna, 1000, 14)];
    const chugs = [chug(anna, 5000)];

    // Act
    const achievement = noChugs({ turns, chugs });

    // Assert
    expect(achievement).toBeUndefined();
  });
});

describe('fastestChug', () => {
  it("ranks each player's fastest chug, fastest first", () => {
    // Arrange
    const chugs = [chug(anna, 3000), chug(anna, 1000), chug(bo, 2000), chug(carl, 4000)];

    // Act
    const achievement = fastestChug({ turns: [], chugs });

    // Assert
    expect(achievement?.player).toBe(anna);
    expect(achievement?.value).toBe(1);
    expect(achievement?.runnerUps).toEqual([
      { player: bo, value: 2 },
      { player: carl, value: 4 },
    ]);
    expect(achievement?.additionalInfo).toBe('1.00 s hurtigere end Bo');
  });

  it('leaves out chugs without a recorded time', () => {
    // Arrange
    const untimed: PlayerChug = { player: bo, chug: {}, placement: 2, chugNumber: 2 };
    const chugs = [chug(anna, 3000), untimed];

    // Act
    const achievement = fastestChug({ turns: [], chugs });

    // Assert
    expect(achievement?.player).toBe(anna);
    expect(achievement?.runnerUps).toEqual([]);
    expect(achievement?.additionalInfo).toBe('');
  });

  it('is not awarded without any timed chugs', () => {
    // Act
    const achievement = fastestChug({ turns: [], chugs: [] });

    // Assert
    expect(achievement).toBeUndefined();
  });
});

describe('mostBeers', () => {
  it('ranks players by beers drunk, most first', () => {
    // Arrange
    const turns = [turn(anna, 0, 14), turn(anna, 0, 7), turn(bo, 0, 14), turn(carl, 0, 7)];

    // Act
    const achievement = mostBeers({ turns, chugs: [] });

    // Assert
    expect(achievement?.player).toBe(anna);
    expect(achievement?.value).toBe(1.5);
    expect(achievement?.runnerUps).toEqual([
      { player: bo, value: 1 },
      { player: carl, value: 0.5 },
    ]);
    expect(achievement?.additionalInfo).toBe('0.50 flere end Bo');
  });

  it('has no comparison when only one player has drawn', () => {
    // Arrange
    const turns = [turn(anna, 0, 14)];

    // Act
    const achievement = mostBeers({ turns, chugs: [] });

    // Assert
    expect(achievement?.player).toBe(anna);
    expect(achievement?.additionalInfo).toBe('');
  });

  it('is not awarded before any card has been drawn', () => {
    // Act
    const achievement = mostBeers({ turns: [], chugs: [] });

    // Assert
    expect(achievement).toBeUndefined();
  });
});
