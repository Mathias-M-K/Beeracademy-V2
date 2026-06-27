import {LobbyAction} from '../lobby-action';

interface SendMessageAction extends LobbyAction {
  message: string;
}

export function sendMessageAction(message: string): SendMessageAction {
  return {message: message, type: "SEND_MESSAGE"}
}
