import {inject, Injectable, signal} from '@angular/core';
import {MessageInfo} from './models/message-info';
import {MessageDirection} from './models/message-direction';
import {LobbyService} from '../lobby.service';
import {Role} from '../../../api-models/model/role';
import {Subject} from 'rxjs';
import {EmojiInfo} from './models/emoji-info';
import {Emoji} from '../../../api-models/model/emoji';

@Injectable({
  providedIn: 'root',
})
export class ChatService {

  private readonly lobbyService: LobbyService = inject(LobbyService);

  private readonly _messages = signal<MessageInfo[]>([]);
  public readonly messages = this._messages.asReadonly();

  private readonly _emojis = new Subject<EmojiInfo>();
  public readonly emojis = this._emojis.asObservable();

  constructor() {
    this.lobbyService.chatMessages.subscribe({
      next: (message) => this.addMessage(message),
    })

    this.lobbyService.emojiReactions.subscribe({
      next: (emoji) => this.addEmoji(emoji),
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

    //TODO return here and set senderId
    this.addMessage({senderName: 'Mig', senderId:'', message: trimmed, direction: MessageDirection.OUT, fromHost: isHost});
    this.lobbyService.sendMessage(text);
  }

  public sendEmoji(emoji: Emoji){
    // const isHost = this.lobbyService.role() === Role.GameClient;
    this.lobbyService.sendEmoji(emoji)

  }

  // Entry point for incoming messages (e.g. future websocket chat events).
  public addMessage(message: MessageInfo): void {
    this._messages.update(messages => [...messages, message]);
  }

  // Entry point for incoming emoji reactions (e.g. websocket emoji events).
  public addEmoji(emoji: EmojiInfo): void {
    this._emojis.next(emoji);
  }
}
