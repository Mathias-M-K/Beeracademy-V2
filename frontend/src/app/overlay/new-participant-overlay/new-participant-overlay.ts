import {Component, inject, signal} from '@angular/core';
import {OverlayHandle} from '../../services/overlay/models/overlay-handle';
import {CdkTrapFocus} from '@angular/cdk/a11y';

@Component({
  selector: 'app-new-participant-overlay',
  imports: [
    CdkTrapFocus
  ],
  templateUrl: './new-participant-overlay.html',
  styleUrl: './new-participant-overlay.scss',
})
export class NewParticipantOverlay {

  readonly name = signal('');

  readonly overlayHandle = inject(OverlayHandle) as OverlayHandle<string>;

  exit() {

    if (this.name()) {
      this.overlayHandle.close(this.name().trim());
    } else {
      this.overlayHandle.close();
    }
  }

}
