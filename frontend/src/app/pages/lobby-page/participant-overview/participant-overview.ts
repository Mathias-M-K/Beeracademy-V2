import {Component, computed, input, output} from '@angular/core';
import {LobbyParticipantDTO} from '../../../../api-models/model/lobbyParticipantDTO';
import {Participant} from './participant/participant';

@Component({
  selector: 'app-participant-overview',
  templateUrl: './participant-overview.html',
  styleUrl: './participant-overview.scss',
  imports: [
    Participant
  ],
  standalone: true
})
export class ParticipantOverview {

  readonly participants = input<LobbyParticipantDTO[]>([]);
  readonly isLobbyOwner = input<boolean>(false)
  readonly addParticipant = output<string>()
  readonly removeParticipant = output<string>()
  readonly disconnect = output<void>()

  readonly participantsWithShortName = computed(() => {
    const counts = new Map<string, number>();
    return this.participants().map(participant => {
      const base = (participant.name ?? '').substring(0, 3).toUpperCase();
      const count = counts.get(base) ?? 0;
      counts.set(base, count + 1);
      const shortName = count === 0 ? base : `${base}${count + 1}`;
      return {participant, shortName};
    });
  });

}
