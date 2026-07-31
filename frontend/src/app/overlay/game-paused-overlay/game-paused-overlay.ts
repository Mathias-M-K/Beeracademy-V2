import {Component, inject} from '@angular/core';
import {MaterialIcon} from '../../common/components/material-icon/material-icon';
import {OVERLAY_DATA, OverlayHandle} from '../../services/overlay/models/overlay-handle';
import {GamePausedOverlayData} from './models/game-paused-overlay-data';
import {GameTimeFormatPipe} from '../../pipes/game-time-format-pipe';
import {Role} from '../../../api-models/model/role';

@Component({
  selector: 'app-game-paused-overlay',
  imports: [
    MaterialIcon,
    GameTimeFormatPipe
  ],
  templateUrl: './game-paused-overlay.html',
  styleUrl: './game-paused-overlay.scss',
})
export class GamePausedOverlay {

  protected readonly handle = inject(OverlayHandle);

  protected data = inject(OVERLAY_DATA) as GamePausedOverlayData;

  protected readonly Role = Role;
}
