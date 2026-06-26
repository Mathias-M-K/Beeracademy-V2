import {Component, inject, OnInit} from '@angular/core';
import {LobbyService} from '../../services/lobby.service';
import {ParticipantOverview} from './participant-overview/participant-overview';
import {Role} from '../../../api-models/model/role';
import {LobbyInfoQuick} from './lobby-info-quick/lobby-info-quick';
import {ConnectionStatus} from '../../services/models/connection-status';

@Component({
  selector: 'app-lobby-page',
  templateUrl: './lobby-page.html',
  styleUrl: './lobby-page.scss',
  imports: [
    ParticipantOverview,
    LobbyInfoQuick
  ],
  standalone: true
})
export class LobbyPage implements OnInit {
  protected readonly Role = Role;

  public readonly lobbyService = inject(LobbyService)

  ngOnInit(): void {
    this.lobbyService.connectToWebsocket();
  }

  onAddParticipant(name: string) {
    this.lobbyService.requestParticipantCreation(name);
  }

  onRemoveParticipant(participantId: string) {
    this.lobbyService.requestParticipantRemoval(participantId);
  }


  protected readonly ConnectionStatus = ConnectionStatus;
}
