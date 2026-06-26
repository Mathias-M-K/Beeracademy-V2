import {Injectable, signal} from '@angular/core';
import {MessageInfo} from './models/message-info';

@Injectable({
  providedIn: 'root',
})
export class ChatService {

  private readonly _messages = signal<MessageInfo[]>([]);
  public readonly messages = this._messages.asReadonly();

  public sendMessage(text: string): void {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    // Local echo for now. Seam: later also forward to the websocket layer.
    this.addMessage({sender: 'Me', message: trimmed});
  }

  // Entry point for incoming messages (e.g. future websocket chat events).
  public addMessage(message: MessageInfo): void {
    this._messages.update(messages => [...messages, message]);
  }
}
