import {Component, computed, inject, input, output, signal} from '@angular/core';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {LobbyParticipantDTO} from '../../../../api-models/model/lobbyParticipantDTO';
import {Participant} from './participant/participant';
import {EmojiInfo} from '../../../services/chat/models/emoji-info';
import {ChatService} from '../../../services/chat/chat.service';
import {BreakpointObserver} from '@angular/cdk/layout';
import {map} from 'rxjs';

@Component({
  selector: 'app-participant-overview',
  templateUrl: './participant-overview.html',
  styleUrl: './participant-overview.scss',
  imports: [
    Participant
  ],
  standalone: true
})
export class ParticipantOverview {

  private readonly breakpointObserver: BreakpointObserver = inject(BreakpointObserver);
  private readonly chatService = inject(ChatService);

  readonly participants = input<LobbyParticipantDTO[]>([]);
  readonly isLobbyOwner = input<boolean>(false);

  readonly addParticipant = output<void>();
  readonly removeParticipant = output<string>();
  readonly openParticipantSettings = output<LobbyParticipantDTO | undefined>()
  readonly disconnect = output<void>();

  protected readonly isCompact = toSignal(
    this.breakpointObserver
      .observe('(max-width: 500px)')
      .pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  /** Latest reaction keyed by participant id. The targeted entry gets a fresh
   *  object on each event, so only that participant's input changes. */
  protected readonly emojiReactions = signal<Record<string, EmojiInfo>>({});

  constructor() {
    this.chatService.emojis.pipe(takeUntilDestroyed()).subscribe(emojiInfo => {
      this.emojiReactions.update(map => ({...map, [emojiInfo.senderId]: emojiInfo}));
    });
  }

  readonly participantsWithShortName = computed(() => {
    const counts = new Map<string, number>();
    return this.participants().map(participant => {
      const base = (participant.name ?? '').substring(0, 3).toUpperCase();
      const count = counts.get(base) ?? 0;
      counts.set(base, count + 1);
      const shortName = count === 0 ? base : `${base}${count + 1}`;
      return {participant, shortName};
    });
  });

}
