import {Component, computed, DestroyRef, inject, signal} from '@angular/core';
import {Router} from '@angular/router';

import {LobbyApi} from '../../services/apis/lobby-api.service';
import {ToastService} from '../../services/toast/toast.service';
import {ToastState} from '../../overlay/toast/models/toast-data';
import {DotLoader} from '../../common/components/dot-loader/dot-loader';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {finalize, map} from 'rxjs';
import {SuitIcon} from '../../common/components/suit-icon/suit-icon';
import {MaterialIcon} from '../../common/components/material-icon/material-icon';
import {PartyApi} from '../../services/apis/party.api';
import {CurrentPartyDto} from '../../../api-models/model/currentPartyDto';
import {Role} from '../../../api-models/model/role';
import {PartyState} from '../../../api-models/model/partyState';
import {BreakpointObserver} from '@angular/cdk/layout';
import {DrawerService} from '../../services/drawer/drawer.service';

@Component({
  selector: 'app-welcome-page',
  templateUrl: './welcome-page.html',
  styleUrl: './welcome-page.scss',
  imports: [SuitIcon, MaterialIcon, DotLoader],
})
export class WelcomePage {

  private readonly router: Router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly breakpointObserver = inject(BreakpointObserver);

  private readonly lobbyApi: LobbyApi = inject(LobbyApi);
  private readonly partyApi: PartyApi = inject(PartyApi);

  private readonly toastService = inject(ToastService);
  private readonly drawerService = inject(DrawerService);

  protected readonly creatingLobby = signal<boolean>(false);
  protected readonly fetchingExistingGame = signal<boolean>(false);

  private readonly existingParty = signal<CurrentPartyDto | undefined>(undefined);
  protected readonly existingPartyText = computed(() => {
    const state = this.existingParty()?.partyState?.partyState;
    if (!state) return;
    return state === PartyState.Lobby ? 'Din lobby er stadigvæk aktiv' : 'Dit spil er stadigvæk igang';
  })
  protected readonly existingPartyName = computed(() => this.existingParty()?.partyState?.name);
  protected readonly existingPartyRole = computed(() => this.existingParty()?.role === Role.GameClient ? 'Vært' : 'Deltager');
  protected readonly existingPartyParticipantName = computed(() => {
    return this.existingParty()?.partyState?.participants.find(participant => participant.id === this.existingParty()?.playerId)?.name;
  });
  protected readonly existingPartyParticipantCount = computed(() => this.existingParty()?.partyState?.participants.length);
  protected readonly existingPartyJoinBtnText = computed(() => this.existingParty()?.partyState?.partyState === PartyState.Game ? 'Forsæt spillet' : 'Åbn Lobby')

  protected readonly isCompact = toSignal(
    this.breakpointObserver
      .observe('(max-width: 500px)')
      .pipe(map((result) => result.matches)),
    {initialValue: false},
  );

  constructor() {
    this.fetchingExistingGame.set(true);
    this.partyApi.getCurrentParty()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.fetchingExistingGame.set(false)),
      )
      .subscribe({
        next: existingGame => this.existingParty.set(existingGame)
      })
  }

  protected createLobby(lobbyName: string): void {

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

  protected joinExistingParty() {
    const partyState = this.existingParty()?.partyState?.partyState;
    if (!partyState) return;

    if (partyState === PartyState.Game) {
      this.navigateToGamePage();
    } else if (partyState === PartyState.Lobby) {
      this.navigateToLobbyPage();
    }
  }

  protected openCameraBtnClicked() {
    return this.openQrScanner();
  }

  protected qrScannerPanelClick() {
    if (this.isCompact()) {
      this.openQrScanner();
    }
  }

  private openQrScanner() {
    this.drawerService.showQrScanner();
  }


  private navigateToLobbyPage(): void {
    this.router.navigate(['/lobby']);
  }

  private navigateToGamePage(): void {
    this.router.navigate(['/game']);
  }
}
