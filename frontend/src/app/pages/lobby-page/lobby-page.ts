import {
  Component,
  effect,
  ElementRef,
  inject,
  linkedSignal,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ParticipantOverview } from './participant-overview/participant-overview';
import { Chat } from './chat/chat';
import { LobbyParticipantDTO } from '../../../api-models/model/lobbyParticipantDTO';
import { LobbyService } from '../../services/lobby/lobby.service';
import { DotLoader } from '../../common/components/dot-loader/dot-loader';
import { DrawerService } from '../../services/drawer/drawer.service';
import { SegmentedControl } from '../../common/segmented-control/segmented-control';

@Component({
  selector: 'app-lobby-page',
  templateUrl: './lobby-page.html',
  styleUrl: './lobby-page.scss',
  host: {
    tabindex: '-1',
  },
  imports: [ParticipantOverview, Chat, DotLoader, SegmentedControl],
})
export class LobbyPage {
  protected readonly lobbyService = inject(LobbyService);
  private readonly drawerService = inject(DrawerService);

  readonly participants = linkedSignal(() => this.lobbyService.participants());

  protected readonly isCompact = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 500px)')
      .pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  protected readonly pageNames = ['Deltagere', 'Chat'];
  protected readonly selectedPage = signal(0);

  private readonly scroller = viewChild('scroller', { read: ElementRef<HTMLElement> });
  private readonly pages = viewChildren('page', { read: ElementRef<HTMLElement> });

  private dragActive = false;
  private rafId = 0;

  constructor() {
    effect(() => {
      this.scrollToIndex(this.selectedPage());
    });
  }

  protected onPointerDown(): void {
    this.dragActive = true;
  }

  protected onPageSelected(): void {
    this.dragActive = false;
  }

  protected onScroll(): void {
    if (!this.dragActive || this.rafId) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = 0;
      this.selectedPage.set(this.nearestPageIndex());
    });
  }

  protected onScrollEnd(): void {
    this.selectedPage.set(this.nearestPageIndex());
  }

  private scrollToIndex(index: number): void {
    if (this.dragActive) return;
    const container = this.scroller()?.nativeElement;
    const page = this.pages()[index]?.nativeElement;
    if (!container || !page) return;

    const offset = page.getBoundingClientRect().left - container.getBoundingClientRect().left;
    container.scrollTo({ left: container.scrollLeft + offset, behavior: 'smooth' });
  }

  private nearestPageIndex(): number {
    const scroller = this.scroller()?.nativeElement;
    const [first, second] = this.pages().map((page) => page.nativeElement);
    if (!scroller || !first || !second) return 0;

    const pageDistance = second.offsetLeft - first.offsetLeft;
    return Math.round(scroller.scrollLeft / pageDistance);
  }

  addParticipant(name: string) {
    this.lobbyService.requestParticipantCreation(name);
  }

  onRemoveParticipant(participantId: string) {
    this.lobbyService.requestParticipantRemoval(participantId);
  }

  onParticipantsRearranged(reorderedParticipantList: LobbyParticipantDTO[]): void {
    this.lobbyService.requestParticipantsRearranged(reorderedParticipantList);
  }

  openParticipantSettingsOverlay(participant: LobbyParticipantDTO | undefined): void {
    const actualParticipant = participant ?? this.lobbyService.self();
    if (!actualParticipant) {
      console.error("Didn't find participant when attempting to open settings", participant);
      return;
    }

    void this.drawerService
      .showLobbyParticipantSettingsDrawer(actualParticipant)
      .closed.then((newSettings) => {
        if (!newSettings) return;
        this.lobbyService.requestParticipantSettingsUpdate(
          newSettings?.sipsInABeer,
          newSettings?.canDrawAce,
          actualParticipant.id,
        );
      });
  }

  openNewParticipantOverlay(): void {
    void this.drawerService.showNewParticipantDrawer().closed.then((participantName) => {
      if (!participantName) return;
      this.addParticipant(participantName);
    });
  }

  async addUsualSuspects() {
    const delay = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay));
    const delayBetweenAdd = 100;

    this.lobbyService.requestParticipantCreation('Mathias');
    await delay(delayBetweenAdd);

    this.lobbyService.requestParticipantCreation('Lasse');
    await delay(delayBetweenAdd);

    this.lobbyService.requestParticipantCreation('Frederik');
    await delay(delayBetweenAdd);

    this.lobbyService.requestParticipantCreation('Andreas');
    await delay(delayBetweenAdd);

    this.lobbyService.requestParticipantCreation('Jakob');
    await delay(delayBetweenAdd);
  }
}
