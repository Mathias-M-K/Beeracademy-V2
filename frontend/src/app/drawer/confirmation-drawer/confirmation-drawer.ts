import {Component, inject} from '@angular/core';
import {MaterialIcon} from '../../common/components/material-icon/material-icon';
import {OVERLAY_DATA, OverlayHandle} from '../../services/overlay/models/overlay-handle';

export interface ConfirmationDrawerData{

}

@Component({
  imports: [
    MaterialIcon
  ],
  selector: 'app-confirmation-drawer',
  styleUrl: './confirmation-drawer.scss',
  templateUrl: './confirmation-drawer.html',
})
export class ConfirmationDrawer {
  protected readonly overlayHandle = inject(OverlayHandle);
  protected readonly participantName = inject(OVERLAY_DATA) as string;


}
