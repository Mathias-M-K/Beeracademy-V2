import {Component, input, output} from '@angular/core';
import {NgxMaskPipe} from 'ngx-mask';
import {MaterialIcon} from '../../../common/components/material-icon/material-icon';

@Component({
  selector: 'app-lobby-info-quick',
  templateUrl: './lobby-info-quick.html',
  styleUrl: './lobby-info-quick.scss',
  imports: [
    NgxMaskPipe,
    MaterialIcon
  ],
})
export class LobbyInfoQuick {

  readonly shareBtnClick = output<void>();

  readonly partyId = input<string>('-');
}
