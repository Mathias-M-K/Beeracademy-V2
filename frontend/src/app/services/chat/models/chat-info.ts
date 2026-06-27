import {MessageDirection} from './message-direction';

export interface ChatInfo {
  senderId: string;
  senderName: string;
  direction: MessageDirection
  fromHost: boolean;
}
