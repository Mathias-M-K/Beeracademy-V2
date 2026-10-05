import { Component, inject, linkedSignal, signal } from '@angular/core';
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
import { SwipePager } from '../../common/swipe-pager/swipe-pager';
import { SwipePage } from '../../common/swipe-pager/swipe-page';

@Component({
  selector: 'app-lobby-page',
  templateUrl: './lobby-page.html',
  styleUrl: './lobby-page.scss',
  host: {
    tabindex: '-1',
  },
  imports: [ParticipantOverview, Chat, DotLoader, SegmentedControl, SwipePager, SwipePage],
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
}
