import { CardRankPipe } from './card-rank-pipe';

describe('CardRankPipe', () => {
  let pipe: CardRankPipe;

  beforeEach(() => {
    pipe = new CardRankPipe();
  });

  it.each([
    [11, 'J'],
    [12, 'D'],
    [13, 'K'],
    [14, 'A'],
  ])('shows face rank %i as %s', (rank, expected) => {
    // Arrange
    const input = rank;

    // Act
    const shown = pipe.transform(input);

    // Assert
    expect(shown).toBe(expected);
  });

  it.each([2, 3, 4, 5, 6, 7, 8, 9, 10])('shows number rank %i unchanged', (rank) => {
    // Arrange
    const input = rank;

    // Act
    const shown = pipe.transform(input);

    // Assert
    expect(shown).toBe(rank);
  });

  it.each([0, 1, 15])('passes unknown rank %i through unchanged', (rank) => {
    // Arrange
    const input = rank;

    // Act
    const shown = pipe.transform(input);

    // Assert
    expect(shown).toBe(rank);
  });
});
