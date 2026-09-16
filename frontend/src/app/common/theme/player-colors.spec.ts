import { PLAYER_COLORS, playerColor } from './player-colors';

describe('player colours', () => {
  describe('PLAYER_COLORS', () => {
    it('has a colour for each of the 12 seats', () => {
      // Arrange
      const colors = PLAYER_COLORS;

      // Act
      const count = colors.length;

      // Assert
      expect(count).toBe(12);
    });

    it('gives every seat a distinct colour', () => {
      // Arrange
      const colors = PLAYER_COLORS.map((color) => color.toLowerCase());

      // Act
      const distinct = new Set(colors);

      // Assert
      expect(distinct.size).toBe(PLAYER_COLORS.length);
    });

    it('only contains six digit hex colours', () => {
      // Arrange
      const hex = /^#[0-9a-f]{6}$/i;

      // Act
      const invalid = PLAYER_COLORS.filter((color) => !hex.test(color));

      // Assert
      expect(invalid).toEqual([]);
    });
  });

  describe('playerColor', () => {
    it.each(PLAYER_COLORS.map((color, index) => [index, color]))(
      'maps seat %i to %s',
      (index, color) => {
        // Arrange
        const seat = index as number;

        // Act
        const result = playerColor(seat);

        // Assert
        expect(result).toBe(color);
      },
    );
  });
});
