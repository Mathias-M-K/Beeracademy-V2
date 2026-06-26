import {Component, input} from '@angular/core';
import {MessageInfo} from '../../../../services/models/message-info';
import {Message} from './message/message';


@Component({
  selector: 'app-messages',
  templateUrl: './messages.html',
  styleUrl: './messages.scss',
  imports: [
    Message
  ],
  standalone: true
})
export class Messages {

  readonly messages = input.required<MessageInfo[]>();

}
