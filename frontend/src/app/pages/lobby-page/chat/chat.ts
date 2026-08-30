import {
  afterNextRender,
  afterRenderEffect,
  Component,
  ElementRef,
  inject,
  Injector,
  viewChild
} from '@angular/core';
import {Messages} from './messages/messages';
import {ChatService} from '../../../services/chat/chat.service';
import {Emoji} from '../../../../api-models/model/emoji';
import {sendEmojiAction} from '../../../services/models/categories/actions/lobby/common/send-emoji-action';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
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

  sendEmoji(emoji: Emoji): void {
    this.chatService.sendEmoji(emoji);
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

  protected readonly Emoji = Emoji;
  protected readonly sendEmojiAction = sendEmojiAction;
}
