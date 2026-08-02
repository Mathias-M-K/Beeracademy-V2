import { Component } from '@angular/core';
import {MaterialIcon} from '../../common/components/material-icon/material-icon';

@Component({
  selector: 'app-reconnecting-overlay',
  imports: [
    MaterialIcon
  ],
  templateUrl: './reconnecting-overlay.html',
  styleUrl: './reconnecting-overlay.scss',
})
export class ReconnectingOverlay {

}
