import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChugOverlay } from './chug-overlay';
import { OVERLAY_DATA, OverlayHandle } from '../../services/overlay/models/overlay-handle';
import { ChugOverlayData } from './models/chug-overlay-data';
import { Player } from '../../services/game/models/player';
import { createOverlayHandle } from '../../../testing/overlay';
import { aPlayerDto, PLAYER_1, PLAYER_2, PLAYER_3 } from '../../../testing/game-builders';
import { Suit } from '../../../api-models/model/suit';

describe('ChugOverlay', () => {
  let handle: OverlayHandle<number>;

  beforeEach(() => {
    // DumbTimer ticks on an rxjs interval (setInterval) and reads Date.now(); setTimeout stays real
    // so the zoneless scheduler behind whenStable() keeps running.
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    vi.setSystemTime(new Date('2026-01-01T20:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function aPlayer(id: string, name: string, chugTimes: (number | undefined)[] = []): Player {
    return Player.fromPlayerDto(
      aPlayerDto({
        id,
        name,
        stats: {
          turns: [],
          chugs: chugTimes.map((chugTimeMillis) => ({ suit: Suit.Spade, chugTimeMillis })),
        },
      }),
    );
  }

  async function render(data: Partial<ChugOverlayData> = {}) {
    handle = createOverlayHandle<number>();
    const playerToChug = data.playerToChug ?? aPlayer(PLAYER_1, 'mathias');
    TestBed.configureTestingModule({
      providers: [
        {
          provide: OVERLAY_DATA,
          useValue: { players: [playerToChug], isGameClient: true, playerToChug, ...data },
        },
        { provide: OverlayHandle, useValue: handle },
      ],
    });
    const fixture = TestBed.createComponent(ChugOverlay);
    await fixture.whenStable();
    return fixture;
  }

  function timerButton(fixture: ComponentFixture<ChugOverlay>): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button.timer-btn');
  }

  function finishButton(fixture: ComponentFixture<ChugOverlay>): HTMLButtonElement {
    return Array.from(fixture.nativeElement.querySelectorAll('button') as HTMLButtonElement[]).find(
      (button) => button.textContent?.trim() === 'AFSLUT',
    )!;
  }

  function displayedSeconds(fixture: ComponentFixture<ChugOverlay>): string | undefined {
    return fixture.nativeElement.querySelector('.seconds')?.textContent?.trim();
  }

  async function clickTimer(fixture: ComponentFixture<ChugOverlay>, thenWaitMs = 0) {
    timerButton(fixture).click();
    await vi.advanceTimersByTimeAsync(thenWaitMs);
    await fixture.whenStable();
  }

  it('announces who has to chug with their initial', async () => {
    // Arrange
    const playerToChug = aPlayer(PLAYER_2, 'lasse');

    // Act
    const fixture = await render({ playerToChug });

    // Assert
    const player: HTMLElement = fixture.nativeElement.querySelector('.player');
    expect(player.textContent).toContain('lasse bunder');
    expect(player.querySelector('app-participant-badge h3')?.textContent).toBe('L');
  });

  describe('as the game client', () => {
    it('starts with a start button, a zeroed clock and a hidden finish button', async () => {
      // Arrange
      const data = { isGameClient: true };

      // Act
      const fixture = await render(data);

      // Assert
      expect(timerButton(fixture).getAttribute('aria-label')).toBe('Start tid');
      expect(displayedSeconds(fixture)).toBe('00.000');
      expect(finishButton(fixture).hasAttribute('inert')).toBe(true);
    });

    it('runs the clock after starting', async () => {
      // Arrange
      const fixture = await render();

      // Act
      await clickTimer(fixture, 1550);

      // Assert
      expect(timerButton(fixture).getAttribute('aria-label')).toBe('Stop tid');
      expect(displayedSeconds(fixture)).toBe('01.550');
    });

    it('freezes the clock and offers to finish or try again after stopping', async () => {
      // Arrange
      const fixture = await render();
      await clickTimer(fixture, 1550);

      // Act
      await clickTimer(fixture, 1000);

      // Assert
      expect(timerButton(fixture).getAttribute('aria-label')).toBe('Prøv igen');
      expect(displayedSeconds(fixture)).toBe('01.550');
      expect(finishButton(fixture).hasAttribute('inert')).toBe(false);
    });

    it('resets the clock when trying again', async () => {
      // Arrange
      const fixture = await render();
      await clickTimer(fixture, 1550);
      await clickTimer(fixture);

      // Act
      await clickTimer(fixture, 500);

      // Assert
      expect(timerButton(fixture).getAttribute('aria-label')).toBe('Start tid');
      expect(displayedSeconds(fixture)).toBe('00.000');
      expect(finishButton(fixture).hasAttribute('inert')).toBe(true);
    });

    it('closes with the stopped chug time when finishing', async () => {
      // Arrange
      const fixture = await render();
      await clickTimer(fixture, 1550);
      await clickTimer(fixture);

      // Act
      finishButton(fixture).click();

      // Assert
      await expect(handle.closed).resolves.toBe(1550);
    });

    it('does not list previous chug times', async () => {
      // Arrange
      const players = [aPlayer(PLAYER_1, 'mathias', [3000])];

      // Act
      const fixture = await render({ players, isGameClient: true });

      // Assert
      expect(fixture.nativeElement.querySelector('.chug-times')).toBeNull();
      expect(fixture.nativeElement.classList).not.toContain('guest');
    });
  });

  describe('as a guest', () => {
    it('shows neither the clock nor the timer buttons', async () => {
      // Arrange
      const data = { isGameClient: false };

      // Act
      const fixture = await render(data);

      // Assert
      const element: HTMLElement = fixture.nativeElement;
      expect(element.classList).toContain('guest');
      expect(element.querySelector('circle-loader')).toBeNull();
      expect(element.querySelector('button')).toBeNull();
    });

    it('ranks every previous chug from fastest to slowest', async () => {
      // Arrange
      const players = [
        aPlayer(PLAYER_1, 'mathias', [4200, 2510]),
        aPlayer(PLAYER_2, 'lasse', [3000]),
        aPlayer(PLAYER_3, 'frederik', [undefined]),
      ];

      // Act
      const fixture = await render({ players, isGameClient: false });

      // Assert
      const rows = Array.from(
        fixture.nativeElement.querySelectorAll('.chug-time') as HTMLElement[],
      ).map((row) => Array.from(row.querySelectorAll('p')).map((p) => p.textContent?.trim()));
      expect(rows).toEqual([
        ['1', 'mathias', '2.51s'],
        ['2', 'lasse', '3.00s'],
        ['3', 'mathias', '4.20s'],
      ]);
    });

    it('hides the ranking when nobody has a recorded chug time', async () => {
      // Arrange
      const players = [aPlayer(PLAYER_1, 'mathias'), aPlayer(PLAYER_2, 'lasse', [undefined])];

      // Act
      const fixture = await render({ players, isGameClient: false });

      // Assert
      expect(fixture.nativeElement.querySelector('.chug-time-container')).toBeNull();
    });
  });
});
