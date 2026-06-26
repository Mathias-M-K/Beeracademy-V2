import {Component, input, output} from '@angular/core';
import {LobbyParticipantDTO} from '../../../../api-models/model/lobbyParticipantDTO';

@Component({
  selector: 'app-participant-overview',
  templateUrl: './participant-overview.html',
  styleUrl: './participant-overview.scss',
})
export class ParticipantOverview {

  readonly participants = input<LobbyParticipantDTO[]>([]);
  readonly isLobbyOwner = input<boolean>(false)
  readonly addParticipant = output<string>()

}
