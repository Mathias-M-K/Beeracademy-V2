import {Component, inject, input, output} from '@angular/core';
import {NgxMaskPipe} from 'ngx-mask';
import {CdkCopyToClipboard} from '@angular/cdk/clipboard';
import {MaterialIcon} from '../../../common/components/material-icon/material-icon';
import {ToastService} from '../../../services/toast/toast.service';

@Component({
  selector: 'app-lobby-info-quick',
  templateUrl: './lobby-info-quick.html',
  styleUrl: './lobby-info-quick.scss',
  imports: [
    NgxMaskPipe,
    CdkCopyToClipboard,
    MaterialIcon
  ],
})
export class LobbyInfoQuick {

  private readonly toastService = inject(ToastService);

  readonly qrBtnClick = output<void>();

  readonly partyId = input<string>('-');
  readonly lobbyJoinLink = input<string>('-');

  onJoinLinkCopied(success: boolean){

    if(!success){
      return;
    }
    this.toastService.showToast("Kopieret til udklipsholder","Link til lobby er blevet kopieret til udklipsholderen","content_copy");
  }

}
