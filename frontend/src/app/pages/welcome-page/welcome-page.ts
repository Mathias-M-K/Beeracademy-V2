import {Component, DestroyRef, inject, signal} from '@angular/core';
import {Router} from '@angular/router';
import {NgxMaskDirective} from 'ngx-mask';
import {LobbyApi} from '../../services/apis/lobby-api.service';
import {ToastService} from '../../services/toast/toast.service';
import {ToastState} from '../../overlay/toast/models/toast-data';
import {DotLoader} from '../../common/components/dot-loader/dot-loader';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {finalize} from 'rxjs';

@Component({
  selector: 'app-welcome-page',
  templateUrl: './welcome-page.html',
  styleUrl: './welcome-page.scss',
  imports: [NgxMaskDirective, DotLoader],
})
export class WelcomePage {

  private readonly router: Router = inject(Router);
  private readonly lobbyApi: LobbyApi = inject(LobbyApi);
  private readonly destroyRef = inject(DestroyRef);

  private readonly toastService = inject(ToastService);

  readonly creatingLobby = signal<boolean>(false);
  readonly joiningLobby = signal<boolean>(false);

  public onTitleClick() {
    this.router.navigate(['welcome']);
  }

  public createLobby(lobbyName: string): void {

    if (lobbyName.trim().length === 0) {
      this.toastService.showToast("Du er dum", "Lobbyen skal have et navn", "sentiment_extremely_dissatisfied", ToastState.error)
      return;
    }

    this.creatingLobby.set(true);

    this.lobbyApi.createLobby(lobbyName)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.creatingLobby.set(false))
      )
      .subscribe({
        next: () => this.navigateToLobbyPage(),
        error: () => {
          this.toastService.showToast("Der skete en fejl", "Lobbyen kunne ikke oprettes", "error", ToastState.error);
        }
      })
  }


  public registerParticipant(participantName: string, partyId: string): void {

    if (participantName.trim().length === 0) {
      this.toastService.showToast("Fejl", "Angiv et deltager navn", "error", ToastState.error);
      return;
    }

    if (partyId.trim().length === 0) {
      this.toastService.showToast("Fejl", "Angiv lobby-id", "error", ToastState.error);
      return;
    }
    this.joiningLobby.set(true);

    const cleanPartyId = partyId.replaceAll('-', '');

    this.lobbyApi.fetchParticipantToken(cleanPartyId, participantName)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.joiningLobby.set(false))
      )
      .subscribe({
        next: () => this.navigateToLobbyPage(),
        error: () => {
          this.toastService.showToast("Der skete en fejl", "Kunne ikke forbinde til lobby", "error", ToastState.error);
        }
      })
  }

  public navigateToLobbyPage(): void {
    this.router.navigate(['/lobby']);
  }
}
