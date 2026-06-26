import {Component, inject, OnInit, signal} from '@angular/core';
import {LobbyWebsocketService} from '../../services/lobby-websocket.service';
import {LobbyApi} from '../../services/lobby-api.service';
import {LobbyService} from '../../services/lobby.service';
import {ParticipantOverview} from './participant-overview/participant-overview';
import {Role} from '../../../api-models/model/role';

@Component({
  selector: 'app-lobby-page',
  templateUrl: './lobby-page.html',
  styleUrl: './lobby-page.scss',
  imports: [
    ParticipantOverview
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
