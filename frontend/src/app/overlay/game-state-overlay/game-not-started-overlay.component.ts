import {Component, inject} from '@angular/core';
import {OVERLAY_DATA, OverlayHandle} from '../../services/overlay/models/overlay-handle';
import {MaterialIcon} from '../../common/components/material-icon/material-icon';
import {Role} from '../../../api-models/model/role';

@Component({
  selector: 'app-game-state-overlay',
  imports: [
    MaterialIcon
  ],
  templateUrl: './game-not-started-overlay.component.html',
  styleUrl: './game-not-started-overlay.component.scss'
})
export class GameNotStartedOverlay {

  protected readonly handle = inject(OverlayHandle);
  protected readonly isGameClient = inject(OVERLAY_DATA) as boolean;

  protected readonly Role = Role;
}
