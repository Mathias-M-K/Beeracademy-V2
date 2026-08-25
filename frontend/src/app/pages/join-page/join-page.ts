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
import {DotLoader} from '../../common/components/dot-loader/dot-loader';
import {finalize} from 'rxjs';

@Component({
  selector: 'app-join-page',
  imports: [
    FormField,
    DotLoader
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

  readonly loading = signal(true);
  readonly joining = signal(false);

  readonly error = signal<string | undefined>(undefined);
  readonly lobbyName = signal<string>('');
  private readonly partyId = signal<string>('');
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
    this.partyId.set(params['party-id'])
    this.lobbyName.set('');
    this.alreadyJoined.set(0);
    this.error.set(undefined);

    this.getLobbyInfo(this.partyId());
  }

  private onLoadingComplete() {
    this.handle.close().then(() => {
      if (this.error()) {
        this.toastService.showToast("Miv :(", this.error() ?? 'Ukendt fejl', "error", ToastState.error);
        this.router.navigate(['/']);
      }
      this.loading.set(false)
    });
  }

  private getLobbyInfo(partyId: string) {
    this.lobbyApi.getLobby(partyId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
      this.toastService.showToast("Wtf", "Du skal angive deltagernavn", "error");
      return;
    }

    this.joining.set(true);
    this.lobbyApi.fetchParticipantToken(this.partyId(), participantName)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(()=>this.joining.set(false))
      )
      .subscribe({
        next: () => this.router.navigate(['/lobby'],),
        error: () => this.toastService.showToast("Der skete en fejl","Kunne ikke deltage i lobbyen","error")
      })
  }

}
