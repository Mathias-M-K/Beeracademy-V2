
import {ChatInfo} from './chat-info';
import {Emoji} from '../../../../api-models/model/emoji';

export interface EmojiInfo extends ChatInfo{
  emoji: Emoji;
  emojiAsString: string;
}
