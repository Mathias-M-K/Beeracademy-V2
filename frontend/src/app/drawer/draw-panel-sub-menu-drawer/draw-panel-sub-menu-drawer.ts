import {
  Component,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { DrawerDefaultHeaderComponent } from '../common/drawer-default-header/drawer-default-header.component';
import { SegmentedControl } from '../../common/segmented-control/segmented-control';
import { RoundHistory } from './round-history/round-history';
import { OVERLAY_DATA } from '../../services/overlay/models/overlay-handle';
import { CardChanceOverview } from './card-chance-overview/card-chance-overview';

@Component({
  imports: [DrawerDefaultHeaderComponent, SegmentedControl, RoundHistory, CardChanceOverview],
  selector: 'app-draw-panel-sub-menu-drawer',
  styleUrl: './draw-panel-sub-menu-drawer.scss',
  templateUrl: './draw-panel-sub-menu-drawer.html',
})
export class DrawPanelSubMenuDrawer {
  private readonly startOption = inject(OVERLAY_DATA) as number;

  private readonly scroller = viewChild('scroller', { read: ElementRef<HTMLElement> });
  private readonly viewElements = viewChildren('viewElement', { read: ElementRef<HTMLElement> });

  protected segmentOptions: string[] = ['Historik', 'Chance pr. kort'];
  protected selectedOption = signal<number>(this.startOption);

  private dragActive = false;
  private rafId = 0;

  constructor() {
    effect(() => {
      this.scrollToIndex(this.selectedOption());
    });
  }

  protected onPointerDown(): void {
    this.dragActive = true;
  }

  protected onSegmentSelected(): void {
    this.dragActive = false;
  }

  protected onScroll(): void {
    if (!this.dragActive || this.rafId) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = 0;
      this.selectedOption.set(this.nearestPageIndex());
    });
  }

  protected onScrollEnd(): void {
    this.selectedOption.set(this.nearestPageIndex());
  }

  private scrollToIndex(index: number): void {
    if (this.dragActive) return;
    const container = this.scroller()?.nativeElement;
    const viewElement = this.viewElements()[index]?.nativeElement;
    if (!container || !viewElement) return;

    const offset =
      viewElement.getBoundingClientRect().left - container.getBoundingClientRect().left;
    container.scrollTo({ left: container.scrollLeft + offset, behavior: 'smooth' });
  }

  private nearestPageIndex(): number {
    const scroller = this.scroller()?.nativeElement;
    const [first, second] = this.viewElements().map((page) => page.nativeElement);
    if (!scroller || !first || !second) return 0;

    const pageDistance = second.offsetLeft - first.offsetLeft;
    return Math.round(scroller.scrollLeft / pageDistance);
  }
}
