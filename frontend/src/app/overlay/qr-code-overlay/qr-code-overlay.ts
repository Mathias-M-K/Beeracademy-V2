import {Component, inject} from '@angular/core';
import {QRCodeComponent} from 'angularx-qrcode';
import {OVERLAY_DATA, OverlayHandle} from '../../services/overlay/models/overlay-handle';
import {LobbyJoinData} from '../../services/lobby/models/lobby-join-data';
import {NgxMaskPipe} from 'ngx-mask';

@Component({
  selector: 'app-qr-code-overlay',
  imports: [
    QRCodeComponent,
    NgxMaskPipe
  ],
  templateUrl: './qr-code-overlay.html',
  styleUrl: './qr-code-overlay.scss',
})
export class QrCodeOverlay {

  readonly lobbyJoinData = inject(OVERLAY_DATA) as LobbyJoinData;
  readonly overlayHandle: OverlayHandle = inject(OverlayHandle);

}
