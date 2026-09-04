import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { MaterialIcon } from '../../common/components/material-icon/material-icon';
import {OVERLAY_DATA} from '../../services/overlay/models/overlay-handle';
import {DotLoader} from '../../common/components/dot-loader/dot-loader';

@Component({
  selector: 'app-beer-loader-overlay',
  imports: [MaterialIcon, DotLoader],
  templateUrl: './beer-loader-overlay.html',
  styleUrl: './beer-loader-overlay.scss',
  host: {
    '[class.leaving]': 'leaving()',
  },
})
export class BeerLoaderOverlay implements OnDestroy {
  private readonly loaderMessages = inject(OVERLAY_DATA) as string[];

  private readonly messages = this.loaderMessages ?? ['Henter lobby…', 'Tapper øl…', 'Pakker kortene…'];
  private readonly index = signal(0);

  protected readonly statusText = computed(() => this.messages[this.index()]);

  protected readonly leaving = signal(false);

  private readonly rotation = setInterval(() => {
    this.index.update((i) => (i + 1) % this.messages.length);
  }, 2000);

  ngOnDestroy(): void {
    clearInterval(this.rotation);
  }
}
