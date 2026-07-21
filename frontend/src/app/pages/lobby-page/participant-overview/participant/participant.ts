import {Component, input, output} from '@angular/core';
import {LobbyParticipantDTO} from '../../../../../api-models/model/lobbyParticipantDTO';
import {ParticipantBadge} from './participant-badge/participant-badge';
import {EmojiInfo} from '../../../../services/chat/models/emoji-info';
import {MaterialIcon} from '../../../../common/material-icon/material-icon';

@Component({
  selector: 'app-participant',
  templateUrl: './participant.html',
  styleUrl: './participant.scss',
  imports: [
    ParticipantBadge,
    MaterialIcon
  ]
})
export class Participant {

  readonly participant = input.required<LobbyParticipantDTO>();
  readonly participantNameShort = input.required<string>()
  readonly emojiReaction = input.required<EmojiInfo>();
  readonly inLineEditing = input<boolean>(false);
  readonly compact = input<boolean>(false);

  readonly remove = output<string>();
  readonly editSettings = output<LobbyParticipantDTO>()



}
