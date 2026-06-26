import {inject, Injectable, signal} from '@angular/core';
import {MessageInfo} from './models/message-info';
import {MessageDirection} from './models/message-direction';
import {LobbyService} from '../lobby.service';
import {Role} from '../../../api-models/model/role';

@Injectable({
  providedIn: 'root',
})
export class ChatService {

  private readonly lobbyService: LobbyService = inject(LobbyService);

  private readonly _messages = signal<MessageInfo[]>([]);
  public readonly messages = this._messages.asReadonly();

  constructor() {
    this.lobbyService.chatMessages.subscribe({
      next: (message) => {this.addMessage(message);},
    })

    this.lobbyService.lobbyReset.subscribe({
      next: () => this._messages.set([])
    })
  }

  public sendMessage(text: string): void {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    const isHost = this.lobbyService.role() === Role.GameClient;
    this.addMessage({sender: 'Mig', message: trimmed, direction: MessageDirection.OUT, fromHost: isHost});
    this.lobbyService.sendMessage(text);
  }

  // Entry point for incoming messages (e.g. future websocket chat events).
  public addMessage(message: MessageInfo): void {
    this._messages.update(messages => [...messages, message]);
  }
}
