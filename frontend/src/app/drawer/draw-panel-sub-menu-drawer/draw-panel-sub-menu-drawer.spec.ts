import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockInstance } from 'vitest';
import { DrawPanelSubMenuDrawer } from './draw-panel-sub-menu-drawer';
import { OVERLAY_DATA } from '../../services/overlay/models/overlay-handle';
import { GameService } from '../../services/game/game.service';

describe('DrawPanelSubMenuDrawer', () => {
  let scrollTo: MockInstance<Element['scrollTo']>;

  beforeEach(() => {
    Element.prototype.scrollTo = () => undefined;
    scrollTo = vi.spyOn(Element.prototype, 'scrollTo');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete (Element.prototype as Partial<Element>).scrollTo;
  });

  async function render(startOption = 0) {
    TestBed.configureTestingModule({
      providers: [
        { provide: OVERLAY_DATA, useValue: startOption },
        {
          provide: GameService,
          useValue: { turns: signal([]), remainingCardsByRank: signal([]), players: signal([]) },
        },
      ],
    });
    const fixture = TestBed.createComponent(DrawPanelSubMenuDrawer);
    await fixture.whenStable();
    return fixture;
  }

  function scroller(fixture: ComponentFixture<DrawPanelSubMenuDrawer>): HTMLElement {
    return fixture.nativeElement.querySelector('#view');
  }

  function title(fixture: ComponentFixture<DrawPanelSubMenuDrawer>): string {
    return fixture.nativeElement.querySelector('drawer-default-header h2').textContent.trim();
  }

  function segments(fixture: ComponentFixture<DrawPanelSubMenuDrawer>): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('segmented-control .segment p'));
  }

  /** Lays the pages out 300px apart and scrolls the 300px wide view to `scrollLeft`. */
  function layOut(fixture: ComponentFixture<DrawPanelSubMenuDrawer>, scrollLeft: number) {
    const pages: HTMLElement[] = Array.from(scroller(fixture).children) as HTMLElement[];
    pages.forEach((page, index) => {
      Object.defineProperty(page, 'offsetLeft', { configurable: true, value: index * 300 });
      page.getBoundingClientRect = () => ({ left: index * 300 - scrollLeft }) as DOMRect;
    });
    scroller(fixture).getBoundingClientRect = () => ({ left: 0 }) as DOMRect;
    scroller(fixture).scrollLeft = scrollLeft;
  }

  /** Holds animation frames back so a test decides when the next frame runs. */
  function captureAnimationFrames(): { flush(): void } {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      frames.push(callback),
    );
    return { flush: () => frames.splice(0).forEach((frame) => frame(0)) };
  }

  async function dispatch(fixture: ComponentFixture<DrawPanelSubMenuDrawer>, type: string) {
    scroller(fixture).dispatchEvent(new Event(type));
    await fixture.whenStable();
  }

  it('opens on the page it was asked for', async () => {
    // Arrange
    const startOption = 1;

    // Act
    const fixture = await render(startOption);

    // Assert
    expect(title(fixture)).toBe('Chance pr. kort');
  });

  it('scrolls to a page when its segment is selected', async () => {
    // Arrange
    const fixture = await render(0);
    layOut(fixture, 0);
    scrollTo.mockClear();

    // Act
    segments(fixture)[1].click();
    await fixture.whenStable();

    // Assert
    expect(title(fixture)).toBe('Chance pr. kort');
    expect(scrollTo.mock.contexts).toEqual([scroller(fixture)]);
    expect(scrollTo).toHaveBeenCalledWith({ left: 300, behavior: 'smooth' });
  });

  it('follows a swipe once per animation frame without scrolling back', async () => {
    // Arrange
    const frames = captureAnimationFrames();
    const fixture = await render(0);
    layOut(fixture, 280);
    scrollTo.mockClear();

    // Act
    await dispatch(fixture, 'scroll');
    await dispatch(fixture, 'scroll');
    const beforeFrame = title(fixture);
    frames.flush();
    await fixture.whenStable();

    // Assert
    expect(beforeFrame).toBe('Historik');
    expect(title(fixture)).toBe('Chance pr. kort');
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('settles on the nearest page when scrolling ends', async () => {
    // Arrange
    const fixture = await render(1);
    layOut(fixture, 20);

    // Act
    await dispatch(fixture, 'scrollend');

    // Assert
    expect(title(fixture)).toBe('Historik');
  });
});
