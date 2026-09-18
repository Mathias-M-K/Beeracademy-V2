import { Component, computed, input, linkedSignal, output } from '@angular/core';
import { ToastData, ToastState } from '../models/toast-data';
import { Dot } from '../../../common/dot/dot';
import { MaterialIcon } from '../../../common/components/material-icon/material-icon';

@Component({
  selector: 'app-toast',
  imports: [Dot, MaterialIcon],
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
  host: {
    '[style.--toast-color]': 'toastColor()',
    '[style.--toast-duration]': 'duration()',
    '[class.is-paused]': 'isPaused()',
  },
})
export class Toast {
  readonly timerEnd = output<void>();
  readonly expand = output<MouseEvent>();

  readonly toastData = input.required<ToastData>();
  readonly toastCount = input<number>(0);
  readonly inOverviewMode = input<boolean>(false);

  /** Freezes the countdown where it stands, rather than restarting it. */
  readonly isPaused = input<boolean>(false);

  readonly toastColor = computed(() => {
    switch (this.toastData().toastState) {
      case ToastState.error:
        return 'var(--error)';
      case ToastState.success:
        return 'var(--success)';
      case ToastState.message:
        return 'var(--primary)';
    }
  });

  protected readonly duration = computed(() => `${this.toastData().durationMs}ms`);

  protected readonly showBadge = computed(() => this.toastCount() > 1 && !this.inOverviewMode());

  protected readonly badgeCount = computed(() => this.toastCount() - 1);

  private readonly badgeTrail = linkedSignal<number, { current: number; previous: number }>({
    source: this.badgeCount,
    computation: (current, trail) => ({ current, previous: trail?.value.current ?? current }),
  });

  /** The number rolls the way the stack moved: up when one arrives, down when one leaves. */
  protected readonly badgeRollsDown = computed(() => {
    const { current, previous } = this.badgeTrail();
    return current < previous;
  });

  protected onCountdownEnd(): void {
    this.timerEnd.emit();
  }

  protected onBadgeClick(event: MouseEvent): void {
    this.expand.emit(event);
  }
}
