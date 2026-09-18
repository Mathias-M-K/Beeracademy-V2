export enum ToastState {
  message = 'message',
  success = 'success',
  error = 'error',
}

const DEFAULT_DURATION_MS: Record<ToastState, number> = {
  [ToastState.message]: 4500,
  [ToastState.success]: 4000,
  [ToastState.error]: 6500,
};

export class ToastData {
  private static nextId = 0;

  readonly title: string;
  readonly message: string;
  readonly icon: string;
  readonly toastState: ToastState;

  /** How long the countdown runs before the toast dismisses itself. */
  readonly durationMs: number;
  readonly id: string;

  constructor(
    title: string,
    message: string,
    icon: string,
    toastState: ToastState = ToastState.message,
    durationMs?: number,
  ) {
    this.title = title;
    this.message = message;
    this.icon = icon;
    this.toastState = toastState;
    this.durationMs = durationMs ?? DEFAULT_DURATION_MS[toastState];
    this.id = `toast-${ToastData.nextId++}`;
  }
}
