import {Component, input, output} from '@angular/core';
import {LobbyParticipantDTO} from '../../../../../api-models/model/lobbyParticipantDTO';
import {ParticipantBadge} from './participant-badge/participant-badge';
import {EmojiInfo} from '../../../../services/chat/models/emoji-info';
import {MaterialIcon} from '../../../../common/components/material-icon/material-icon';
import {CdkDragHandle} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-participant',
  templateUrl: './participant.html',
  styleUrl: './participant.scss',
  imports: [
    ParticipantBadge,
    MaterialIcon,
    CdkDragHandle
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
