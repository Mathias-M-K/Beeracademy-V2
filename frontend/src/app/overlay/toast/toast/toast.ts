import {Component, computed, ElementRef, inject, input, output} from '@angular/core';
import {ToastData, ToastState} from '../models/toast-data';
import {MaterialIcon} from '../../../common/components/material-icon/material-icon';

@Component({
  selector: 'app-toast',
  imports: [
    MaterialIcon
  ],
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
  host: {
    '[style.--toast-color]': 'toastColor()'
  },
})
export class Toast {

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly timerEnd = output<void>()

  readonly toastData = input.required<ToastData>();

  readonly toastColor = computed(() => {
    switch (this.toastData().toastState) {
      case ToastState.error:
        return "var(--error)";
      case ToastState.success:
        return 'var(--success)';
      case ToastState.message:
        return 'var(--primary)';
    }
  });

  constructor() {
    this.host.nativeElement.addEventListener('animationend', (a)=>{
      const classList = (a.target as HTMLElement).classList;

      if(classList.contains('timer-bar')){
        this.timerEnd.emit();
      }
    })
  }



}
