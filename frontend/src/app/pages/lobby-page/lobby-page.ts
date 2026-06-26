import {Component, inject, OnInit} from '@angular/core';
import {LobbyService} from '../../services/lobby.service';
import {ParticipantOverview} from './participant-overview/participant-overview';
import {Role} from '../../../api-models/model/role';
import {LobbyInfoQuick} from './lobby-info-quick/lobby-info-quick';

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

  public readonly lobbyService = inject(LobbyService)

  ngOnInit(): void {
    this.lobbyService.connectToWebsocket();
  }

  onAddPlayer(name: string) {
    this.lobbyService.createLocalParticipant(name);
  }

  protected readonly Role = Role;
}
