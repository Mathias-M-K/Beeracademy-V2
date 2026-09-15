import { Component, computed, inject, signal } from '@angular/core';
import { DrawerDefaultHeaderComponent } from '../common/drawer-default-header/drawer-default-header.component';
import { OVERLAY_DATA, OverlayHandle } from '../../services/overlay/models/overlay-handle';
import { LobbyParticipantDTO } from '../../../api-models/model/lobbyParticipantDTO';
import { ParticipantSettingsResult } from '../../overlay/participant-settings-overlay/models/participant-settings-result';

@Component({
  imports: [DrawerDefaultHeaderComponent],
  selector: 'app-lobby-participant-settings-drawer',
  styleUrl: './lobby-participant-settings-drawer.scss',
  templateUrl: './lobby-participant-settings-drawer.html',
})
export class LobbyParticipantSettingsDrawer {
  private readonly data: LobbyParticipantDTO = inject(OVERLAY_DATA) as LobbyParticipantDTO;
  private readonly handle = inject(OverlayHandle);

  protected readonly participantName = this.data.name ?? '';

  private readonly initialSettings: ParticipantSettingsResult = {
    sipsInABeer: this.data.sipsInABeer ?? 14,
    canDrawAce: this.data.canDrawAce ?? true,
  };

  protected readonly settings = signal<ParticipantSettingsResult>({ ...this.initialSettings });

  protected isUnchanged = computed(() => {
    return (
      this.settings().sipsInABeer === this.initialSettings.sipsInABeer &&
      this.settings().canDrawAce === this.initialSettings.canDrawAce
    );
  });

  protected toggleCanDrawAce(): void {
    this.settings.update((settings) => ({ ...settings, canDrawAce: !settings.canDrawAce }));
  }

  protected increaseSipsInABeer(): void {
    if (this.settings().sipsInABeer >= 99) return;
    this.settings.update((settings) => ({ ...settings, sipsInABeer: settings.sipsInABeer + 1 }));
  }

  protected decreaseSipsInABeer(): void {
    if (this.settings().sipsInABeer <= 1) return;
    this.settings.update((settings) => ({ ...settings, sipsInABeer: settings.sipsInABeer - 1 }));
  }

  protected submitChanges() {
    if (this.isUnchanged()) return;
    this.handle.close(this.settings());
  }
}
