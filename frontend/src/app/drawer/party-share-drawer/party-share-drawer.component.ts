import {Component, inject} from '@angular/core';
import {QRCodeComponent} from 'angularx-qrcode';
import {MaterialIcon} from '../../common/components/material-icon/material-icon';
import {OVERLAY_DATA} from '../../services/overlay/models/overlay-handle';
import {ConfigService} from '../../../config.service';
import {NgxMaskPipe} from 'ngx-mask';
import {CdkCopyToClipboard} from '@angular/cdk/clipboard';

@Component({
  imports: [
    QRCodeComponent,
    MaterialIcon,
    NgxMaskPipe,
    CdkCopyToClipboard
  ],
  selector: 'app-party-share-drawer',
  styleUrl: './party-share-drawer.component.scss',
  templateUrl: './party-share-drawer.component.html',
})
export class PartyShareDrawerComponent {
  protected readonly partyId = inject(OVERLAY_DATA) as string;
  private readonly configService = inject(ConfigService);
  // protected readonly url = this.configService.apiUrl + `/#/join/${this.partyId}`
  protected readonly url = `${document.baseURI}#/join/${encodeURIComponent(this.partyId)}`;
}
