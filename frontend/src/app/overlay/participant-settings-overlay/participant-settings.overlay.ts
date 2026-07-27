import {Component, computed, inject, signal} from '@angular/core';
import {LobbyParticipantDTO} from '../../../api-models/model/lobbyParticipantDTO';
import {OVERLAY_DATA, OverlayHandle} from '../../services/overlay/models/overlay-handle';
import {ParticipantSettingsResult} from './models/participant-settings-result';

@Component({
  selector: 'app-participant-settings-overlay',
  imports: [],
  templateUrl: './participant-settings.overlay.html',
  styleUrl: './participant-settings.overlay.scss',
})
export class ParticipantSettingsOverlay {

  private readonly participant: LobbyParticipantDTO = inject(OVERLAY_DATA) as LobbyParticipantDTO;
  readonly overlayHandle: OverlayHandle<ParticipantSettingsResult> = inject(OverlayHandle) as OverlayHandle<ParticipantSettingsResult>;

  readonly name = this.participant.name ?? '';
  readonly sipsInABeer = signal<number>(this.participant.sipsInABeer ?? 14);
  readonly canDrawAce = signal<boolean>(this.participant.canDrawAce ?? true);

  readonly isChanged = computed(() => {
    if (this.sipsInABeer() !== this.participant.sipsInABeer) {
      return true;
    }
    if (this.canDrawAce() !== this.participant.canDrawAce) {
      return true
    }
    return false;
  })

  increaseSips() {
    this.sipsInABeer.update((value) => value + 1)
  }

  decreaseSips() {
    this.sipsInABeer.update((value) => {
      if (this.sipsInABeer() <= 0) {
        return 0;
      }
      return value - 1
    })
  }

  toggleAce() {
    this.canDrawAce.set(!this.canDrawAce());
  }

  save() {
    this.overlayHandle.close({sipsInABeer: this.sipsInABeer(), canDrawAce: this.canDrawAce()});
  }

  close() {
    this.overlayHandle.close();
  }

}
