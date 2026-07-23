export enum ToastState {
  message = 'message',
  success = 'success',
  error = 'error',
}

export class ToastData {
  readonly title!: string;
  readonly message!: string;
  readonly icon!: string;
  readonly toastState: ToastState = ToastState.message;
  readonly id!: string;

  constructor(title: string, message: string, icon: string, toastState?: ToastState) {
    this.title = title;
    this.message = message;
    this.icon = icon;

    this.toastState = toastState ?? this.toastState;
    this.id = crypto.randomUUID();
  }
}
