import {Component, input, output} from '@angular/core';
import {MaterialIcon} from "../../common/components/material-icon/material-icon";

@Component({
    imports: [MaterialIcon],
  selector: 'app-drawer-header',
  styleUrl: './drawer-header.scss',
  templateUrl: './drawer-header.html',
})
export class DrawerHeader {

  readonly title = input.required<string>();
  readonly subtitle = input('');

  readonly closeClick = output<void>();

}
