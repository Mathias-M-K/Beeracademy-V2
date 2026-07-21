import {Component, input} from '@angular/core';
import {NgxMaskPipe} from 'ngx-mask';
import {CdkCopyToClipboard} from '@angular/cdk/clipboard';
import {MaterialIcon} from '../../../common/material-icon/material-icon';

@Component({
  selector: 'app-lobby-info-quick',
  templateUrl: './lobby-info-quick.html',
  styleUrl: './lobby-info-quick.scss',
  imports: [
    NgxMaskPipe,
    CdkCopyToClipboard,
    MaterialIcon
  ],
  standalone: true
})
export class LobbyInfoQuick {
  readonly lobbyId = input<string>('-');

}
