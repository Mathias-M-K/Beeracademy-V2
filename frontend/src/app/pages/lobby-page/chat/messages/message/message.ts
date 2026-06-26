import {Component, input} from '@angular/core';
import {MessageInfo} from '../../../../../services/models/message-info';

@Component({
  selector: 'app-message',
  templateUrl: './message.html',
  styleUrl: './message.scss',
  standalone: true
})
export class Message {
    readonly message = input.required<MessageInfo>();
}
