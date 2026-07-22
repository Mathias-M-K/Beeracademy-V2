import {Component, inject, linkedSignal, OnInit} from '@angular/core';
import {ParticipantOverview} from './participant-overview/participant-overview';
import {LobbyInfoQuick} from './lobby-info-quick/lobby-info-quick';
import {ConnectionStatus} from '../../services/models/connection-status';
import {Chat} from './chat/chat';
import {LobbyParticipantDTO} from '../../../api-models/model/lobbyParticipantDTO';
import {OverlayService} from '../../services/overlay/overlay.service';
import {ParticipantSettingsOverlay} from '../../overlay/participant-settings-overlay/participant-settings.overlay';
import {ParticipantSettingsResult} from '../../overlay/participant-settings-overlay/models/participant-settings-result';
import {LobbyService} from '../../services/lobby/lobby.service';
import {NewParticipantOverlay} from '../../overlay/new-participant-overlay/new-participant-overlay';
import {Router} from '@angular/router';
import {QrCodeOverlay} from '../../overlay/qr-code-overlay/qr-code-overlay';
import {LobbyJoinData} from '../../services/lobby/models/lobby-join-data';

@Component({
  selector: 'app-lobby-page',
  templateUrl: './lobby-page.html',
  styleUrl: './lobby-page.scss',
  imports: [
    ParticipantOverview,
    LobbyInfoQuick,
    Chat
  ]
})
export class LobbyPage implements OnInit {

  public readonly lobbyService = inject(LobbyService)
  private readonly overlayService = inject(OverlayService);
  private readonly router = inject(Router);

  readonly participants = linkedSignal(() => this.lobbyService.participants());

  ngOnInit(): void {
    this.lobbyService.connectToWebsocket();
  }

  addParticipant(name: string) {
    this.lobbyService.requestParticipantCreation(name);
  }

  onRemoveParticipant(participantId: string) {
    this.lobbyService.requestParticipantRemoval(participantId);
  }

  onParticipantsRearranged(reorderedParticipantList: LobbyParticipantDTO[]): void {
    this.lobbyService.requestParticipantsRearranged(reorderedParticipantList);
  }

  openEditParticipantSettingsOverlay(participant: LobbyParticipantDTO | undefined): void {

    const actualParticipant = participant ?? this.lobbyService.self();
    if (!actualParticipant) {
      console.error("Didn't find participant when attempting to open settings", participant);
      return;
    }

    const overlayHandle = this.overlayService
      .openOverlay<ParticipantSettingsOverlay, LobbyParticipantDTO, ParticipantSettingsResult>
      (ParticipantSettingsOverlay, actualParticipant);

    overlayHandle.closed.then(result => {
      if (!result) {
        return;
      }
      this.lobbyService.requestParticipantSettingsUpdate(result.sipsInABeer, result.canDrawAce, actualParticipant.id);
    })
  }
  createJoinLink(){
    return document.baseURI + '#/join/'+ this.lobbyService.lobbyId();
  }
  showQrCode(){
    const joinData: LobbyJoinData = {joinLink: this.createJoinLink(), lobbyId: this.lobbyService.lobbyId()??'Ukendt'}
    this.overlayService.openOverlay<QrCodeOverlay, LobbyJoinData, void>(QrCodeOverlay, joinData);
  }

  openNewParticipantOverlay(): void {
    const overlayHandle = this.overlayService.openOverlay<NewParticipantOverlay, void, string>(NewParticipantOverlay);
    overlayHandle.closed.then(participantName => {
      if (participantName) {
        this.addParticipant(participantName)
      }
    })
  }

  public goHome() {
    this.router.navigate(['/']);
  }

  addUsualSuspects() {
    this.lobbyService.requestParticipantCreation("Mathias");
    this.lobbyService.requestParticipantCreation("Lasse");
    this.lobbyService.requestParticipantCreation("Frederik");
    this.lobbyService.requestParticipantCreation("Andreas");
    this.lobbyService.requestParticipantCreation("Jakob");
  }

  protected readonly ConnectionStatus = ConnectionStatus;
}
