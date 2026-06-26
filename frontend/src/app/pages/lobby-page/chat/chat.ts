import {afterNextRender, afterRenderEffect, Component, ElementRef, inject, Injector, viewChild} from '@angular/core';
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
  private readonly injector = inject(Injector);

  readonly messageContainer = viewChild.required<ElementRef<HTMLInputElement>>('message_container');

  constructor() {
    //Scrolling down on new messages
    afterRenderEffect(() => {
      this.chatService.messages();                 // track → re-runs on every change
      const el = this.messageContainer().nativeElement;
      el.scrollTop = el.scrollHeight;              // jump to bottom
    });
  }

  sendMessage(field: HTMLInputElement): void {

    this.chatService.sendMessage(field.value);
    field.value = '';

    this.messageContainer().nativeElement.scrollTop = this.messageContainer().nativeElement.scrollHeight;

    //Scrolling down on message sent
    afterNextRender(() => {
      const el = this.messageContainer().nativeElement;
      el.scrollTop = el.scrollHeight;
    }, {injector: this.injector});
  }
}
