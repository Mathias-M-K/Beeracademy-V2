import {Component, DestroyRef, inject, signal} from '@angular/core';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {LobbyApi} from '../../services/lobby-api.service';
import {LobbyDTO} from '../../../api-models/model/lobbyDTO';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {form, FormField, minLength, required} from '@angular/forms/signals';
import {OverlayService} from '../../services/overlay/overlay.service';
import {BeerLoaderOverlay} from '../../overlay/beer-loader-overlay/beer-loader-overlay';
import {OverlayHandle} from '../../services/overlay/models/overlay-handle';
import {ToastService} from '../../services/toast/toast.service';
import {ToastState} from '../../overlay/toast/models/toast-data';

@Component({
  selector: 'app-join-page',
  imports: [
    FormField
  ],
  templateUrl: './join-page.html',
  styleUrl: './join-page.scss',
})
export class JoinPage {

  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly lobbyApi = inject(LobbyApi);
  readonly destroyRef = inject(DestroyRef);
  readonly overlayService = inject(OverlayService);
  readonly toastService = inject(ToastService);

  readonly error = signal<string | undefined>(undefined);
  readonly loading = signal(true);
  readonly lobbyName = signal<string>('');
  private readonly lobbyId = signal<string>('');
  readonly alreadyJoined = signal<number>(0);

  private handle!: OverlayHandle<void>;

  readonly nameModel = signal({'participantName': ''});
  readonly nameForm = form(this.nameModel, (model) => {
    required(model.participantName);
    minLength(model.participantName, 2)
  })

  constructor() {
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params: Params) => this.onNewPathParam(params));
  }

  private onNewPathParam(params: Params) {
    this.handle = this.overlayService.openOverlay<void>({component: BeerLoaderOverlay});
    this.loading.set(true);
    this.lobbyId.set(params['lobby-id'])
    this.lobbyName.set('');
    this.alreadyJoined.set(0);
    this.error.set(undefined);

    this.getLobbyInfo(this.lobbyId());
  }

  private onLoadingComplete() {

    this.handle.close().then(() => {
      if (this.error()) {
        this.toastService.showToast("Miv :(", "Kunne ikke finde lobbyen", "close", ToastState.error);
        this.router.navigate(['/']);
      }
      this.loading.set(false)
    });
  }

  private getLobbyInfo(lobbyId: string) {
    this.lobbyApi.getLobby(lobbyId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: LobbyDTO) => {
        this.lobbyName.set(data.name ?? '');
        this.alreadyJoined.set(data.participants?.length ?? 0);
        this.onLoadingComplete();
      }, error: err => {
        const exception = err.error.exception;
        if (exception === 'LobbyNotFoundException') {
          this.error.set('Den søgte lobby kunnet ikke findes');
        } else {
          console.warn('Unknown exception →', err);
          this.error.set('Der er sket en ukendt fejl');
        }
        this.onLoadingComplete();
      }
    })
  }

  getParticipantToken(participantName: string) {

    if (this.nameForm().invalid()) {
      console.warn("Can't join a lobby when no participant-name is provided");
      return;
    }

    this.lobbyApi.fetchParticipantToken(this.lobbyId(), participantName).subscribe({
      next: () => this.router.navigate(['/lobby']),
    })
  }
}
