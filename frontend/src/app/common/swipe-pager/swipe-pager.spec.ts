import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockInstance } from 'vitest';
import { SwipePager } from './swipe-pager';
import { SwipePage } from './swipe-page';

@Component({
  imports: [SwipePager, SwipePage],
  template: `
    <div class="scroller" swipePager [(selectedPage)]="selectedPage">
      <div swipePage></div>
      <div swipePage></div>
    </div>
  `,
})
class PagerHost {
  readonly selectedPage = signal(0);
}

describe('SwipePager', () => {
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

  async function render() {
    const fixture = TestBed.createComponent(PagerHost);
    await fixture.whenStable();
    return fixture;
  }

  function scroller(fixture: ComponentFixture<PagerHost>): HTMLElement {
    return fixture.nativeElement.querySelector('.scroller');
  }

  /** Lays the pages out 300px apart and scrolls the 300px wide scroller to `scrollLeft`. */
  function layOut(fixture: ComponentFixture<PagerHost>, scrollLeft: number) {
    const pages = Array.from(scroller(fixture).children) as HTMLElement[];
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

  async function dispatch(fixture: ComponentFixture<PagerHost>, type: string) {
    scroller(fixture).dispatchEvent(new Event(type));
    await fixture.whenStable();
  }

  it('scrolls to a page when it is selected', async () => {
    // Arrange
    const fixture = await render();
    layOut(fixture, 0);
    scrollTo.mockClear();

    // Act
    fixture.componentInstance.selectedPage.set(1);
    await fixture.whenStable();

    // Assert
    expect(scrollTo.mock.contexts).toEqual([scroller(fixture)]);
    expect(scrollTo).toHaveBeenCalledWith({ left: 300, behavior: 'smooth' });
  });

  it('follows a swipe once per animation frame without scrolling back', async () => {
    // Arrange
    const frames = captureAnimationFrames();
    const fixture = await render();
    layOut(fixture, 280);
    scrollTo.mockClear();

    // Act
    await dispatch(fixture, 'scroll');
    await dispatch(fixture, 'scroll');
    const beforeFrame = fixture.componentInstance.selectedPage();
    frames.flush();
    await fixture.whenStable();

    // Assert
    expect(beforeFrame).toBe(0);
    expect(fixture.componentInstance.selectedPage()).toBe(1);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('ignores scroll events while it scrolls to a selected page itself', async () => {
    // Arrange
    const frames = captureAnimationFrames();
    const fixture = await render();
    layOut(fixture, 0);
    fixture.componentInstance.selectedPage.set(1);
    await fixture.whenStable();
    layOut(fixture, 20);

    // Act
    await dispatch(fixture, 'scroll');
    frames.flush();
    await fixture.whenStable();

    // Assert
    expect(fixture.componentInstance.selectedPage()).toBe(1);
  });

  it('settles on the nearest page when scrolling ends', async () => {
    // Arrange
    const fixture = await render();
    layOut(fixture, 280);

    // Act
    await dispatch(fixture, 'scrollend');

    // Assert
    expect(fixture.componentInstance.selectedPage()).toBe(1);
  });

  it('follows swipes again once its own scroll has ended', async () => {
    // Arrange
    const frames = captureAnimationFrames();
    const fixture = await render();
    layOut(fixture, 0);
    fixture.componentInstance.selectedPage.set(1);
    await fixture.whenStable();
    layOut(fixture, 300);
    await dispatch(fixture, 'scrollend');
    layOut(fixture, 20);

    // Act
    await dispatch(fixture, 'scroll');
    frames.flush();
    await fixture.whenStable();

    // Assert
    expect(fixture.componentInstance.selectedPage()).toBe(0);
  });

  it('follows a swipe that starts during its own scroll, even without a scrollend', async () => {
    // Arrange
    const frames = captureAnimationFrames();
    const fixture = await render();
    layOut(fixture, 0);
    fixture.componentInstance.selectedPage.set(1);
    await fixture.whenStable();
    layOut(fixture, 20);

    // Act
    await dispatch(fixture, 'pointerdown');
    await dispatch(fixture, 'scroll');
    frames.flush();
    await fixture.whenStable();

    // Assert
    expect(fixture.componentInstance.selectedPage()).toBe(0);
  });

  it('does not scroll, nor stop following swipes, when the pages are not laid out side by side', async () => {
    // Arrange
    const frames = captureAnimationFrames();
    const fixture = await render();
    scrollTo.mockClear();
    fixture.componentInstance.selectedPage.set(1);
    await fixture.whenStable();
    layOut(fixture, 20);

    // Act
    await dispatch(fixture, 'scroll');
    frames.flush();
    await fixture.whenStable();

    // Assert
    expect(scrollTo).not.toHaveBeenCalled();
    expect(fixture.componentInstance.selectedPage()).toBe(0);
  });
});
