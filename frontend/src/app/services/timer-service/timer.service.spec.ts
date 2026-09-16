import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TimerService } from './timer.service';
import { GameService } from '../game/game.service';
import { TimerType } from './models/TimerType';
import { TimeReport } from '../../../api-models/model/timeReport';
import { TimerState } from '../../../api-models/model/timerState';
import { aTimeReport } from '../../../testing/game-builders';
import { Player } from '../game/models/player';

describe('TimerService', () => {
  let service: TimerService;
  let gameTimeReport: WritableSignal<TimeReport | undefined>;
  let playerTimeReport: WritableSignal<TimeReport | undefined>;
  let currentPlayer: WritableSignal<Player | undefined>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    vi.setSystemTime(new Date('2026-01-01T20:00:00.000Z'));

    gameTimeReport = signal(undefined);
    playerTimeReport = signal(undefined);
    currentPlayer = signal(undefined);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: GameService,
          useValue: {
            gameTimeReport: gameTimeReport.asReadonly(),
            playerTimeReport: playerTimeReport.asReadonly(),
            currentPlayer: currentPlayer.asReadonly(),
          },
        },
      ],
    });

    service = TestBed.inject(TimerService);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('getTimer', () => {
    it('returns the same timer for repeated lookups of a type', () => {
      // Arrange
      const first = service.getTimer(TimerType.GAME);

      // Act
      const second = service.getTimer(TimerType.GAME);

      // Assert
      expect(second).toBe(first);
    });

    it('keeps game and player timers apart', () => {
      // Arrange
      gameTimeReport.set(aTimeReport({ state: TimerState.Paused, activeTime: 90_000 }));
      playerTimeReport.set(aTimeReport({ state: TimerState.Paused, activeTime: 4_000 }));

      // Act
      const game = service.getTimer(TimerType.GAME);
      const player = service.getTimer(TimerType.PLAYER);

      // Assert
      expect(game).not.toBe(player);
      expect(game.currentDuration()).toBe(90_000);
      expect(player.currentDuration()).toBe(4_000);
    });
  });

  describe('server synced timer', () => {
    it('has no duration before the server has reported', () => {
      // Arrange
      const timer = service.createServerSyncedTimer(gameTimeReport);

      // Act
      const duration = timer.currentDuration();

      // Assert
      expect(timer.isRunning()).toBe(false);
      expect(timer.serverReportedActiveTime()).toBeUndefined();
      expect(duration).toBeUndefined();
    });

    it('shows the reported active time while the timer is not running', () => {
      // Arrange
      const timer = service.createServerSyncedTimer(gameTimeReport);
      gameTimeReport.set(aTimeReport({ state: TimerState.Paused, activeTime: 12_345 }));
      timer.currentDuration();

      // Act
      vi.advanceTimersByTime(3_100);

      // Assert
      expect(timer.isRunning()).toBe(false);
      expect(timer.currentDuration()).toBe(12_345);
    });

    it('starts a running timer at the reported active time', () => {
      // Arrange
      const timer = service.createServerSyncedTimer(gameTimeReport);

      // Act
      gameTimeReport.set(aTimeReport({ state: TimerState.Running, activeTime: 12_000 }));

      // Assert
      expect(timer.isRunning()).toBe(true);
      expect(timer.currentDuration()).toBe(12_000);
    });

    it('counts a running timer up locally between server reports', () => {
      // Arrange
      const timer = service.createServerSyncedTimer(gameTimeReport);
      gameTimeReport.set(aTimeReport({ state: TimerState.Running, activeTime: 12_000 }));
      timer.currentDuration();

      // Act
      vi.advanceTimersByTime(310);

      // Assert
      expect(timer.currentDuration()).toBe(12_310);
    });

    it('re-anchors to the server when a new report arrives', () => {
      // Arrange
      const timer = service.createServerSyncedTimer(gameTimeReport);
      gameTimeReport.set(aTimeReport({ state: TimerState.Running, activeTime: 12_000 }));
      timer.currentDuration();
      vi.advanceTimersByTime(3_100);

      // Act
      gameTimeReport.set(aTimeReport({ state: TimerState.Running, activeTime: 14_000 }));
      timer.currentDuration();
      vi.advanceTimersByTime(31);

      // Assert
      expect(timer.currentDuration()).toBe(14_031);
    });

    it('freezes at the reported time when the server pauses the timer', () => {
      // Arrange
      const timer = service.createServerSyncedTimer(gameTimeReport);
      gameTimeReport.set(aTimeReport({ state: TimerState.Running, activeTime: 12_000 }));
      timer.currentDuration();
      vi.advanceTimersByTime(3_100);

      // Act
      gameTimeReport.set(aTimeReport({ state: TimerState.Paused, activeTime: 15_050 }));
      vi.advanceTimersByTime(3_100);

      // Assert
      expect(timer.currentDuration()).toBe(15_050);
    });
  });
});
