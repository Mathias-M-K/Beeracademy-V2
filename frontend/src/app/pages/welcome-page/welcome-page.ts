import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {Router} from '@angular/router';
import {NgxMaskDirective} from 'ngx-mask';
import {LobbyApi} from '../../services/lobby-api.service';
import {ToastService} from '../../services/toast/toast.service';
import {ToastState} from '../../overlay/toast/models/toast-data';

@Component({
  selector: 'app-welcome-page',
  templateUrl: './welcome-page.html',
  styleUrl: './welcome-page.scss',
  imports: [NgxMaskDirective],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WelcomePage {

  private readonly router: Router = inject(Router);
  private readonly lobbyService: LobbyApi = inject(LobbyApi);

  private readonly toastService = inject(ToastService);

  public onTitleClick(){
    this.router.navigate(['welcome']);
  }

  public onCreateLobby(lobbyName: string): void {
    this.lobbyService.createLobby(lobbyName).subscribe({
      next: () => this.navigateToLobbyPage()
    })
  }

  public onRegisterParticipant(participantName: string, lobbyId: string): void {
    const cleanLobbyId = lobbyId.replaceAll('-', '');
    this.lobbyService.fetchParticipantToken(cleanLobbyId,participantName).subscribe({
      next: () => this.navigateToLobbyPage()
    })
  }

  public navigateToLobbyPage(): void {
    this.router.navigate(['/lobby'], { state: { joinAuto: true } });
  }

  //TODO remove me
  public showToasts(){
    this.toastService.showToast("Spiller forbundet","Sig hej til Frederik", "person_add", ToastState.success);

    setTimeout(()=>{
      this.toastService.showToast("ES!","Frederik trak et ES", "playing_cards");
    },100);

    setTimeout(()=>{
      this.toastService.showToast("Spiller forlod lobbyen","Farvel Frederik", "person_remove", ToastState.error);
    },200);
  }
}
