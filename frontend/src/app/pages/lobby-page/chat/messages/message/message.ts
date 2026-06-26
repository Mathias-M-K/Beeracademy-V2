import {Component, computed, input} from '@angular/core';
import {MessageInfo} from '../../../../../services/chat/models/message-info';
import {MessageDirection} from '../../../../../services/chat/models/message-direction';

@Component({
  selector: 'app-message',
  templateUrl: './message.html',
  styleUrl: './message.scss',
  standalone: true,
  host: {
    '[class.outbound]': 'message().direction === MessageDirection.OUT',
    '[class.isFromToHost]': 'isHost()',
  }
})
export class Message {
  readonly message = input.required<MessageInfo>();
  readonly isHost = computed(() => this.message().fromHost);
  protected readonly MessageDirection = MessageDirection;
}
