import {Component, input} from '@angular/core';
import {MessageInfo} from '../../../../../services/chat/models/message-info';
import {MessageDirection} from '../../../../../services/chat/models/message-direction';

@Component({
  selector: 'app-message',
  templateUrl: './message.html',
  styleUrl: './message.scss',
  standalone: true,
  host: {
    '[class.outbound]': 'message().direction === MessageDirection.OUT',
  }
})
export class Message {
    readonly message = input.required<MessageInfo>();
  protected readonly MessageDirection = MessageDirection;
}
