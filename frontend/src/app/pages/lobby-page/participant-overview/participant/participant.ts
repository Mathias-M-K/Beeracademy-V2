import {Component, input, output} from '@angular/core';
import {LobbyParticipantDTO} from '../../../../../api-models/model/lobbyParticipantDTO';
import {ParticipantBadge} from './participant-badge/participant-badge';
import {EmojiInfo} from '../../../../services/chat/models/emoji-info';

@Component({
  selector: 'app-participant',
  templateUrl: './participant.html',
  styleUrl: './participant.scss',
  imports: [
    ParticipantBadge
  ],
  standalone: true
})
export class Participant {

  readonly participant = input.required<LobbyParticipantDTO>();
  readonly participantNameShort = input.required<string>()
  readonly emojiReaction = input.required<EmojiInfo>();
  readonly canBeRemoved = input<boolean>(false);

  readonly remove = output<string>()

  protected readonly console = console;
}
