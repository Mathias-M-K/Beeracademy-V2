import {Component, inject} from '@angular/core';
import {Messages} from './messages/messages';
import {ChatService} from '../../../services/chat/chat.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
  standalone: true,
  imports: [
    Messages
  ]
})
export class Chat {

  readonly chatService = inject(ChatService);


  sendMessage(field: HTMLInputElement): void {
    this.chatService.sendMessage(field.value);
    field.value = '';
  }
}
