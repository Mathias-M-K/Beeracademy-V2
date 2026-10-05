import { Component, inject, signal } from '@angular/core';
import { DrawerDefaultHeaderComponent } from '../common/drawer-default-header/drawer-default-header.component';
import { SegmentedControl } from '../../common/segmented-control/segmented-control';
import { RoundHistory } from './round-history/round-history';
import { OVERLAY_DATA } from '../../services/overlay/models/overlay-handle';
import { CardChanceOverview } from './card-chance-overview/card-chance-overview';
import { SwipePager } from '../../common/swipe-pager/swipe-pager';
import { SwipePage } from '../../common/swipe-pager/swipe-page';

@Component({
  imports: [
    DrawerDefaultHeaderComponent,
    SegmentedControl,
    RoundHistory,
    CardChanceOverview,
    SwipePager,
    SwipePage,
  ],
  selector: 'app-draw-panel-sub-menu-drawer',
  styleUrl: './draw-panel-sub-menu-drawer.scss',
  templateUrl: './draw-panel-sub-menu-drawer.html',
})
export class DrawPanelSubMenuDrawer {
  private readonly startOption = inject(OVERLAY_DATA) as number;

  protected segmentOptions: string[] = ['Historik', 'Chance pr. kort'];
  protected selectedOption = signal<number>(this.startOption);
}
