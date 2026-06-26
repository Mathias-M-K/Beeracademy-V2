import {LobbyEvent} from '../lobby-event';

export interface NewMessageEvent extends LobbyEvent {
  message: string;
  senderId: string
}
