import {Component, computed, DestroyRef, inject, signal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {LobbyApi} from '../../services/apis/lobby-api.service';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {form, FormField, minLength, required} from '@angular/forms/signals';
import {ToastService} from '../../services/toast/toast.service';
import {DotLoader} from '../../common/components/dot-loader/dot-loader';
import {finalize, timeout} from 'rxjs';
import {PartyDto} from '../../../api-models/model/partyDto';
import {PartyState} from '../../../api-models/model/partyState';
import {ExistingParticipant} from './existing-participant/existing-participant';
import {PartyParticipantDto} from '../../../api-models/model/partyParticipantDto';
import {GameApi} from '../../services/apis/game-api.service';

@Component({
  selector: 'app-join-page',
  imports: [
    FormField,
    DotLoader,
    ExistingParticipant
  ],
  templateUrl: './join-page.html',
  styleUrl: './join-page.scss',
})
export class JoinPage {

  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly lobbyApi = inject(LobbyApi);
  readonly gameApi = inject(GameApi);
  readonly destroyRef = inject(DestroyRef);
  readonly toastService = inject(ToastService);

  readonly joining = signal(false);

  readonly partyName = computed(() => this.partyInfo().name);
  private readonly partyId = computed(() => this.partyInfo().id);
  readonly participants = computed(() => this.partyInfo().participants);
  readonly alreadyJoined = computed(() => this.participants().length);


  readonly nameModel = signal({'participantName': ''});
  readonly nameForm = form(this.nameModel, (model) => {
    required(model.participantName);
    minLength(model.participantName, 2)
  });

  readonly selectedParticipant = signal<PartyParticipantDto | undefined>(undefined);

  private readonly routeData = toSignal(this.route.data, {requireSync: true});
  readonly partyInfo = computed(() => this.routeData()['partyInfo'] as PartyDto);

  protected getLobbyParticipantToken(participantName: string) {

    if (this.nameForm().invalid()) {
      this.toastService.showToast("Wtf", "Du skal angive deltagernavn", "error");
      return;
    }

    this.joining.set(true);
    this.lobbyApi.fetchParticipantToken(this.partyId(), participantName)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.joining.set(false))
      )
      .subscribe({
        next: () => this.router.navigate(['/lobby'],),
        error: () => this.toastService.showToast("Der skete en fejl", "Kunne ikke deltage i lobbyen", "error")
      })
  }

  protected getGamePlayerToken() {

    const selectedParticipant = this.selectedParticipant();
    if(!selectedParticipant) return;

    this.joining.set(true);

    this.gameApi.getGamePlayerToken(this.partyInfo().id, selectedParticipant.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(()=>this.joining.set(false)),
      timeout({each: 8000})
    ).subscribe({
      next: () => this.router.navigate(['/game']),
      error: () => this.toastService.showToast("Der skete en fejl", "Kunne ikke tilgå igangværende spil", "error")
    })
  }


  protected onParticipantSelected(participant: PartyParticipantDto) {
    if (this.selectedParticipant() === participant) {
      this.selectedParticipant.set(undefined);
    } else {
      this.selectedParticipant.set(participant);
    }
  }

  protected readonly PartyState = PartyState;
}
