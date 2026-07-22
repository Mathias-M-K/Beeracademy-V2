import {Component, DestroyRef, inject, signal} from '@angular/core';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {LobbyApi} from '../../services/lobby-api.service';
import {LobbyDTO} from '../../../api-models/model/lobbyDTO';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {form, FormField, minLength, required} from '@angular/forms/signals';
import {OverlayService} from '../../services/overlay/overlay.service';
import {BeerLoaderOverlay} from '../../overlay/beer-loader-overlay/beer-loader-overlay';
import {OverlayHandle} from '../../services/overlay/models/overlay-handle';

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

  readonly loading = signal(true);
  readonly lobbyName = signal<string>('');
  private readonly lobbyId = signal<string>('');
  readonly alreadyJoined = signal<number>(0);
  // private lobbyId: string = '';

  readonly nameModel = signal({'participantName': ''});
  readonly nameForm = form(this.nameModel, (model) => {
    required(model.participantName);
    minLength(model.participantName, 2)
  })

  constructor() {
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params: Params) => this.onNewPathParam(params));
    const overlayHandle = this.overlayService.openOverlay<BeerLoaderOverlay, void, void>(BeerLoaderOverlay);

    setTimeout(()=>{
      this.initiate(overlayHandle);
    },3000)

  }

  private onNewPathParam(params: Params){
    this.lobbyId.set(params['lobby-id'])
    this.lobbyName.set('');
    this.alreadyJoined.set(0);

    this.getLobbyInfo(this.lobbyId());
  }

  private initiate(handle: OverlayHandle<void>){
    this.loading.set(false)
    handle.close();
  }

  private getLobbyInfo(lobbyId: string) {
    this.lobbyApi.getLobby(lobbyId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: LobbyDTO) => {
        this.lobbyName.set(data.name ?? '');
        this.alreadyJoined.set(data.participants?.length ?? 0);
      },
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
