import { Component, computed, OnDestroy, signal } from '@angular/core';
import { MaterialIcon } from '../../common/material-icon/material-icon';

@Component({
  selector: 'app-beer-loader-overlay',
  imports: [MaterialIcon],
  templateUrl: './beer-loader-overlay.html',
  styleUrl: './beer-loader-overlay.scss',
})
export class BeerLoaderOverlay implements OnDestroy {
  private readonly messages = ['Henter lobby…', 'Tapper øl…', 'Pakker kortene…'];
  private readonly index = signal(0);

  protected readonly statusText = computed(() => this.messages[this.index()]);

  // Rotate the status text. Writing the signal schedules change detection
  // (the app is zoneless), so no manual tick is needed here.
  private readonly rotation = setInterval(() => {
    this.index.update((i) => (i + 1) % this.messages.length);
  }, 2000);

  ngOnDestroy(): void {
    clearInterval(this.rotation);
  }
}
