import {LobbyAction} from '../lobby-action';
import {Emoji} from '../../../../../../../api-models/model/emoji';

interface SendEmojiAction extends LobbyAction {
  emoji: string;
}

export function sendEmojiAction(emoji: Emoji): SendEmojiAction {
  return {emoji: emoji, type: "SEND_EMOJI"}
}
