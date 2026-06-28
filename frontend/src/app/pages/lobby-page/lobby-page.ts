import {Component, inject, OnInit} from '@angular/core';
import {ParticipantOverview} from './participant-overview/participant-overview';
import {Role} from '../../../api-models/model/role';
import {LobbyInfoQuick} from './lobby-info-quick/lobby-info-quick';
import {ConnectionStatus} from '../../services/models/connection-status';
import {Chat} from './chat/chat';
import {LobbyParticipantDTO} from '../../../api-models/model/lobbyParticipantDTO';
import {OverlayService} from '../../services/overlay/overlay.service';
import {ParticipantSettingsOverlay} from '../../overlay/participant-settings-overlay/participant-settings.overlay';
import {ParticipantSettingsResult} from '../../overlay/participant-settings-overlay/models/participant-settings-result';
import {LobbyService} from '../../services/lobby.service';

@Component({
  selector: 'app-lobby-page',
  templateUrl: './lobby-page.html',
  styleUrl: './lobby-page.scss',
  imports: [
    ParticipantOverview,
    LobbyInfoQuick,
    Chat
  ],
  standalone: true
})
export class LobbyPage implements OnInit {

  public readonly lobbyService = inject(LobbyService)
  private readonly overlayService = inject(OverlayService);

  ngOnInit(): void {
    this.lobbyService.connectToWebsocket();
  }

  onAddParticipant(name: string) {
    this.lobbyService.requestParticipantCreation(name);
  }

  onRemoveParticipant(participantId: string) {
    this.lobbyService.requestParticipantRemoval(participantId);
  }

  onEditParticipantSettings(participant: LobbyParticipantDTO | undefined): void {

    const actualParticipant = participant?? this.lobbyService.self();
    if(!actualParticipant) {
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


  protected readonly ConnectionStatus = ConnectionStatus;
}
