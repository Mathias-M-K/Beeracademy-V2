import {Component, inject} from '@angular/core';
import {QRCodeComponent} from 'angularx-qrcode';
import {MaterialIcon} from '../../common/components/material-icon/material-icon';
import {OVERLAY_DATA} from '../../services/overlay/models/overlay-handle';
import {NgxMaskPipe} from 'ngx-mask';
import {CdkCopyToClipboard} from '@angular/cdk/clipboard';
import {DrawerDefaultHeaderComponent} from '../common/drawer-default-header/drawer-default-header.component';

@Component({
  imports: [
    QRCodeComponent,
    MaterialIcon,
    NgxMaskPipe,
    CdkCopyToClipboard,
    DrawerDefaultHeaderComponent
  ],
  selector: 'app-party-share-drawer',
  styleUrl: './party-share-drawer.component.scss',
  templateUrl: './party-share-drawer.component.html',
})
export class PartyShareDrawerComponent {
  protected readonly partyId = inject(OVERLAY_DATA) as string;
  protected readonly url = `${document.baseURI}#/join/${encodeURIComponent(this.partyId)}`;
}
