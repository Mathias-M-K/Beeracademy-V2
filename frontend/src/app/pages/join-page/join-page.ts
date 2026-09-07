import {Component, computed, DestroyRef, inject, linkedSignal, signal} from '@angular/core';
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
import {DrawerService} from '../../services/drawer/drawer.service';
import {ToastState} from '../../overlay/toast/models/toast-data';
import {EventApi} from '../../services/apis/event.api';
import {ConnectionEvent} from '../../../api-models/model/connectionEvent';
import {PlayerConnectionEvent} from '../../../api-models/model/playerConnectionEvent';

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
  readonly eventApi = inject(EventApi)
  readonly destroyRef = inject(DestroyRef);
  readonly toastService = inject(ToastService);
  readonly drawerService = inject(DrawerService);

  readonly joining = signal(false);

  readonly partyName = computed(() => this.partyInfo().name);
  private readonly partyId = computed(() => this.partyInfo().id);
  readonly participants = linkedSignal(() => this.partyInfo().participants);
  readonly alreadyJoined = computed(() => this.participants().length);

  private readonly autoJoinAsIfAvailable = signal<string>('')


  readonly nameModel = signal({'participantName': ''});
  readonly nameForm = form(this.nameModel, (model) => {
    required(model.participantName);
    minLength(model.participantName, 2)
  });


  private readonly routeData = toSignal(this.route.data, {requireSync: true});
  readonly partyInfo = computed(() => this.routeData()['partyInfo'] as PartyDto);

  constructor() {
    this.eventApi.getPlayerConnectionEventStream(this.partyId()).subscribe({
      next: event => this.onNewConnectionEvent(event),
      error: error => console.error('event error', error),
    })
  }

  private onNewConnectionEvent(event: PlayerConnectionEvent) {
    switch (event.connectionEvent) {
      case ConnectionEvent.Connected:
        return this.updateParticipantConnectionStatus(event.playerId, true, true);
      case ConnectionEvent.Released:
        return this.updateParticipantConnectionStatus(event.playerId, false, false);
      case ConnectionEvent.Disconnected:
        return this.updateParticipantConnectionStatus(event.playerId, false, true);
    }
  }

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

  protected connectAsParticipant(participant: PartyParticipantDto) {

    if (!participant) return;

    this.joining.set(true);

    this.gameApi.getGamePlayerToken(this.partyInfo().id, participant.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.joining.set(false)),
      timeout({each: 8000})
    ).subscribe({
      next: () => this.router.navigate(['/game']),
      error: () => this.toastService.showToast("Der skete en fejl", "Kunne ikke tilgå igangværende spil", "error")
    })
  }

  protected requestRelease(participant: PartyParticipantDto) {

    console.debug("Requesting release for participant", participant);
    this.gameApi.requestPlayerRelease(this.partyId(), participant.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      timeout({each: 8000})
    ).subscribe({
      next: () => this.drawerService.showConfirmationDrawer(),
      error: () => this.toastService.showToast("Der skete en fejl", "Kunne ikke sende anmodning", "error", ToastState.error)
    });
  }

  private updateParticipantConnectionStatus(participantId: string, connected: boolean, claimed: boolean) {
    this.participants.update(participants => participants.map(participant =>
      participant.id === participantId
        ? {...participant, session: {isConnected: connected, isClaimed: claimed}}
        : participant));
  }


  protected readonly PartyState = PartyState;
}
