import { GameTimeFormatPipe } from './game-time-format-pipe';

describe('GameTimeFormatPipe', () => {
  const pipe = new GameTimeFormatPipe();

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should format milliseconds correctly by default', () => {
    const time = 3661001; // 1 hour, 1 minute, 1 second, 1 ms
    expect(pipe.transform(time)).toBe('01:01:01.001');
  });

  it('should support custom format HH:mm:ss', () => {
    const time = 3661001;
    expect(pipe.transform(time, 'HH:mm:ss')).toBe('01:01:01');
  });

  it('should support custom format mm:ss', () => {
    const time = 61001;
    expect(pipe.transform(time, 'mm:ss')).toBe('01:01');
  });

  it('should support custom format ss.SSS', () => {
    const time = 1234;
    expect(pipe.transform(time, 'ss.SSS')).toBe('01.234');
  });

  it('should handle zero values', () => {
    expect(pipe.transform(0, 'HH:mm:ss.SSS')).toBe('00:00:00.000');
  });
});
