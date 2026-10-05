import { Component, computed, input, output } from '@angular/core';
import { Dot } from '../../../common/dot/dot';
import { ToastState } from '../models/toast-data';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
  host: {},
  imports: [Dot],
})
export class Toast {
  readonly state = input<ToastState>(ToastState.message);
  readonly title = input<string>('Toast title');
  public readonly dismissed = output<void>();

  protected dotColor = computed(() => {
    switch (this.state()) {
      case ToastState.error:
        return 'var(--error)';
      case ToastState.success:
        return 'var(--success)';
      case ToastState.message:
        return 'var(--primary)';
    }
  });
}
