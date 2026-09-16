import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BreakpointObserver } from '@angular/cdk/layout';
import { of } from 'rxjs';
import { MockInstance } from 'vitest';
import { PlayerGrid } from './player-grid';
import { Player } from '../../../services/game/models/player';
import { PLAYER_1, PLAYER_2, PLAYER_3, threePlayers } from '../../../../testing/game-builders';

describe('PlayerGrid', () => {
  let compact: boolean;
  let scrollIntoView: MockInstance<Element['scrollIntoView']>;

  beforeEach(() => {
    compact = false;
    scrollIntoView = vi
      .spyOn(Element.prototype, 'scrollIntoView')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function players(): Player[] {
    return threePlayers().map((dto) => Player.fromPlayerDto(dto));
  }

  async function render(activePlayerId = PLAYER_1) {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: BreakpointObserver,
          useValue: { observe: () => of({ matches: compact, breakpoints: {} }) },
        },
      ],
    });
    const fixture = TestBed.createComponent(PlayerGrid);
    fixture.componentRef.setInput('players', players());
    fixture.componentRef.setInput('activePlayerId', activePlayerId);
    await fixture.whenStable();
    return fixture;
  }

  function cards(fixture: ComponentFixture<PlayerGrid>): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('app-player-card'));
  }

  function dots(fixture: ComponentFixture<PlayerGrid>): HTMLElement[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('app-dot-indicator .dot:not(.indicator)'),
    );
  }

  function activeDot(fixture: ComponentFixture<PlayerGrid>): string {
    return fixture.nativeElement
      .querySelector('app-dot-indicator')
      .style.getPropertyValue('--active-index');
  }

  function scroller(fixture: ComponentFixture<PlayerGrid>): HTMLElement {
    return fixture.nativeElement.querySelector('.players');
  }

  /** Lays the cards out 100px apart and scrolls the 100px wide carousel to centre on `centredIndex`. */
  function layOut(fixture: ComponentFixture<PlayerGrid>, centredIndex: number) {
    cards(fixture).forEach((card, index) => {
      Object.defineProperty(card, 'offsetLeft', { configurable: true, value: index * 100 });
      Object.defineProperty(card, 'offsetWidth', { configurable: true, value: 100 });
    });
    Object.defineProperty(scroller(fixture), 'clientWidth', { configurable: true, value: 100 });
    scroller(fixture).scrollLeft = centredIndex * 100;
  }

  /** Holds animation frames back so a test decides when the next frame runs. */
  function captureAnimationFrames(): { flush(): void } {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      frames.push(callback),
    );
    return { flush: () => frames.splice(0).forEach((frame) => frame(0)) };
  }

  async function dispatch(fixture: ComponentFixture<PlayerGrid>, type: string) {
    scroller(fixture).dispatchEvent(new Event(type));
    await fixture.whenStable();
  }

  it('shows a card and a dot per player and marks who is drawing', async () => {
    // Arrange
    const activePlayerId = PLAYER_2;

    // Act
    const fixture = await render(activePlayerId);

    // Assert
    expect(cards(fixture).map((card) => card.classList.contains('is-drawing'))).toEqual([
      false,
      true,
      false,
    ]);
    expect(dots(fixture)).toHaveLength(3);
  });

  describe('dot navigation', () => {
    it("scrolls to a player's card when its dot is clicked", async () => {
      // Arrange
      const fixture = await render();

      // Act
      dots(fixture)[2].click();
      await fixture.whenStable();

      // Assert
      expect(scrollIntoView.mock.contexts).toEqual([cards(fixture)[2]]);
      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
      expect(activeDot(fixture)).toBe('2');
    });
  });

  describe('following the drawing player', () => {
    it('scrolls to the new drawing player on a compact screen', async () => {
      // Arrange
      compact = true;
      const fixture = await render(PLAYER_1);
      scrollIntoView.mockClear();

      // Act
      fixture.componentRef.setInput('activePlayerId', PLAYER_3);
      await fixture.whenStable();

      // Assert
      expect(scrollIntoView.mock.contexts).toEqual([cards(fixture)[2]]);
      expect(activeDot(fixture)).toBe('2');
    });

    it('does not scroll on a wide screen', async () => {
      // Arrange
      compact = false;
      const fixture = await render(PLAYER_1);

      // Act
      fixture.componentRef.setInput('activePlayerId', PLAYER_3);
      await fixture.whenStable();

      // Assert
      expect(scrollIntoView).not.toHaveBeenCalled();
      expect(activeDot(fixture)).toBe('0');
    });
  });

  describe('tracking the visible card', () => {
    it('highlights the centred card once scrolling ends', async () => {
      // Arrange
      const fixture = await render();
      layOut(fixture, 1);

      // Act
      await dispatch(fixture, 'scrollend');

      // Assert
      expect(activeDot(fixture)).toBe('1');
    });

    it('updates the highlight on the next frame while the user drags', async () => {
      // Arrange
      const frames = captureAnimationFrames();
      const fixture = await render();
      layOut(fixture, 2);
      await dispatch(fixture, 'pointerdown');

      // Act
      await dispatch(fixture, 'scroll');
      await dispatch(fixture, 'scroll');
      frames.flush();
      await fixture.whenStable();

      // Assert
      expect(activeDot(fixture)).toBe('2');
    });

    it('ignores the end of scrolling while the user drags', async () => {
      // Arrange
      const fixture = await render();
      layOut(fixture, 2);
      await dispatch(fixture, 'pointerdown');

      // Act
      await dispatch(fixture, 'scrollend');

      // Assert
      expect(activeDot(fixture)).toBe('0');
    });

    it('ignores plain scroll events when the user is not dragging', async () => {
      // Arrange
      const frames = captureAnimationFrames();
      const fixture = await render();
      layOut(fixture, 2);

      // Act
      await dispatch(fixture, 'scroll');
      frames.flush();
      await fixture.whenStable();

      // Assert
      expect(activeDot(fixture)).toBe('0');
    });

    it('stops treating scrolling as a drag once the turn passes', async () => {
      // Arrange
      const fixture = await render(PLAYER_1);
      await dispatch(fixture, 'pointerdown');
      fixture.componentRef.setInput('activePlayerId', PLAYER_2);
      await fixture.whenStable();
      layOut(fixture, 2);

      // Act
      await dispatch(fixture, 'scrollend');

      // Assert
      expect(activeDot(fixture)).toBe('2');
    });
  });
});
