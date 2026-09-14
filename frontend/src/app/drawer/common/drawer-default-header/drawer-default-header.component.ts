import {Component, input} from '@angular/core';

@Component({
  imports: [],
  selector: 'drawer-default-header',
  styleUrl: './drawer-default-header.component.scss',
  templateUrl: './drawer-default-header.component.html',
})
export class DrawerDefaultHeaderComponent {
  readonly title = input<string>('');
  readonly subtitle = input<string>('');


}
