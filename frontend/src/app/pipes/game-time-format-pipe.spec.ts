import { GameTimeFormatPipe } from './game-time-format-pipe';

describe('GameTimeFormatPipe', () => {
  let pipe: GameTimeFormatPipe;

  beforeEach(() => {
    pipe = new GameTimeFormatPipe();
  });

  describe('default format', () => {
    it('formats milliseconds as HH:mm:ss.SSS', () => {
      // Arrange
      const time = 3_661_001;

      // Act
      const formatted = pipe.transform(time);

      // Assert
      expect(formatted).toBe('01:01:01.001');
    });

    it.each([
      [0, '00:00:00.000'],
      [999, '00:00:00.999'],
      [1_000, '00:00:01.000'],
      [59_999, '00:00:59.999'],
      [60_000, '00:01:00.000'],
      [3_599_999, '00:59:59.999'],
      [3_600_000, '01:00:00.000'],
    ])('formats %i ms as %s', (time, expected) => {
      // Arrange
      const input = time;

      // Act
      const formatted = pipe.transform(input);

      // Assert
      expect(formatted).toBe(expected);
    });

    it('keeps counting hours past 99 instead of wrapping', () => {
      // Arrange
      const time = 100 * 60 * 60 * 1000;

      // Act
      const formatted = pipe.transform(time);

      // Assert
      expect(formatted).toBe('100:00:00.000');
    });
  });

  describe('custom formats', () => {
    it.each([
      ['HH:mm:ss', 3_661_001, '01:01:01'],
      ['mm:ss', 61_001, '01:01'],
      ['ss.SSS', 1_234, '01.234'],
      ['mm:ss.SSS', 125_050, '02:05.050'],
    ])('supports %s', (format, time, expected) => {
      // Arrange
      const input = time;

      // Act
      const formatted = pipe.transform(input, format);

      // Assert
      expect(formatted).toBe(expected);
    });

    it('does not carry hours into the minutes when hours are omitted', () => {
      // Arrange
      const time = 3_661_001;

      // Act
      const formatted = pipe.transform(time, 'mm:ss');

      // Assert
      expect(formatted).toBe('01:01');
    });

    it('keeps literal text around the tokens', () => {
      // Arrange
      const format = 'Tid: mm min ss sek';

      // Act
      const formatted = pipe.transform(125_000, format);

      // Assert
      expect(formatted).toBe('Tid: 02 min 05 sek');
    });

    it('returns a format without tokens unchanged', () => {
      // Arrange
      const format = 'pause';

      // Act
      const formatted = pipe.transform(125_000, format);

      // Assert
      expect(formatted).toBe('pause');
    });
  });
});
