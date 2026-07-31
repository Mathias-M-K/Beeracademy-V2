import {Component, effect, input, signal, OnDestroy} from '@angular/core';
import {EmojiInfo} from '../../../../../services/chat/models/emoji-info';

/** How long the emoji stays fully visible before it animates back out (ms). */
const EMOJI_HOLD_MS = 2500;

@Component({
  selector: 'app-participant-badge',
  imports: [],
  templateUrl: './participant-badge.html',
  styleUrl: './participant-badge.scss',
  host: {
    '[class.active]': 'style() === "active" || "default"',
    '[class.local]': 'style() === "local"',
    '[class.small]': 'size() === "s"',
    '[class.x-small]': 'size() === "xs"',
    '[style.background-color]':'backgroundColor()'
  },
})
export class ParticipantBadge implements OnDestroy {
  readonly initials = input<string>('');
  readonly style = input<'default'|'active'|'local'>('default');

  readonly size = input<'xs' | 's' | 'm'>('m');  //small, medium
  readonly backgroundColor = input<string>('');

  /** A new reaction object pushed from the parent triggers the animation. */
  readonly reaction = input<EmojiInfo>();

  /** The emoji currently being shown. */
  protected readonly emoji = signal('');
  /** Drives the `.emoji-active` class — true while the reaction is on screen. */
  protected readonly showEmoji = signal(false);

  private hideTimer?: ReturnType<typeof setTimeout>;

  constructor() {

    effect(() => {
      const reaction = this.reaction();
      if (!reaction) {
        return;
      }
      this.play(reaction.emojiAsString);
    });
  }

  private play(emoji: string): void {
    clearTimeout(this.hideTimer);
    this.emoji.set(emoji);
    this.showEmoji.set(true);
    this.hideTimer = setTimeout(() => this.showEmoji.set(false), EMOJI_HOLD_MS);
  }

  ngOnDestroy(): void {
    clearTimeout(this.hideTimer);
  }
}
