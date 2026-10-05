import { contentChildren, Directive, effect, ElementRef, inject, model } from '@angular/core';
import { SwipePage } from './swipe-page';

/**
 * Turns a horizontal scroll-snap container into a pager whose `swipePage` children stay in sync
 * with `selectedPage`: setting it scrolls to that page, and swiping updates it.
 */
@Directive({
  selector: '[swipePager]',
  host: {
    '(scroll)': 'onScroll()',
    '(scrollend)': 'onScrollEnd()',
    '(pointerdown)': 'onPointerDown()',
  },
})
export class SwipePager {
  readonly selectedPage = model.required<number>();

  private readonly container = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly pages = contentChildren(SwipePage);

  private programmaticScroll = false;
  private rafId = 0;

  constructor() {
    effect(() => {
      const index = this.selectedPage();
      if (index !== this.nearestPageIndex()) {
        this.scrollToIndex(index);
      }
    });
  }

  protected onScroll(): void {
    if (this.programmaticScroll || this.rafId) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = 0;
      this.selectedPage.set(this.nearestPageIndex());
    });
  }

  protected onScrollEnd(): void {
    this.programmaticScroll = false;
    this.selectedPage.set(this.nearestPageIndex());
  }

  protected onPointerDown(): void {
    this.programmaticScroll = false;
  }

  private scrollToIndex(index: number): void {
    const page = this.pages()[index]?.element;
    if (!page) return;

    const offset = page.getBoundingClientRect().left - this.container.getBoundingClientRect().left;
    // No distance means no scroll and no `scrollend` to clear the flag again.
    if (!offset) return;

    this.programmaticScroll = true;
    this.container.scrollTo({ left: this.container.scrollLeft + offset, behavior: 'smooth' });
  }

  private nearestPageIndex(): number {
    const [first, second] = this.pages().map((page) => page.element);
    if (!first || !second) return 0;

    // Zero when the pages aren't laid out side by side, e.g. `display: contents` on desktop.
    const pageDistance = second.offsetLeft - first.offsetLeft;
    if (!pageDistance) return 0;

    return Math.round(this.container.scrollLeft / pageDistance);
  }
}
