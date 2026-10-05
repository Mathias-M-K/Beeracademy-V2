import { Component, computed, inject } from '@angular/core';
import { ToastService } from '../../../services/toast/toast.service';
import { Toast } from '../toast/toast';
import { ToastData } from '../models/toast-data';

@Component({
  selector: 'app-toast-container',
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.scss',
  host: {
    role: 'status',
    'aria-live': 'polite',
  },
  imports: [Toast],
})
export class ToastContainer {
  private readonly toastService = inject(ToastService);

  // A keyed @for over at most one toast, so a replaced toast plays animate.leave
  // while its successor plays animate.enter; @if would reuse the same view.
  protected readonly shownToast = computed<ToastData[]>(() => {
    const toast = this.toastService.toast();
    return toast ? [toast] : [];
  });

  protected dismiss(toastId: string): void {
    this.toastService.dismissToast(toastId);
  }
}
