import {Component, inject} from '@angular/core';
import {ToastService} from '../../../services/toast/toast.service';
import {Toast} from '../toast/toast';

@Component({
  selector: 'app-toast-container',
  imports: [
    Toast
  ],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.scss',
})
export class ToastContainer {

  private readonly toastService = inject(ToastService);

  public readonly toasts = this.toastService.toasts;

  onToastFinished(toastId: string){
    this.toastService.removeToast(toastId);
  }

}
