import {LobbyEvent} from '../lobby-event';
import {Emoji} from '../../../../../../../api-models/model/emoji';

export interface NewEmojiEvent extends LobbyEvent {
  emoji: Emoji;
  senderId: string;
}
