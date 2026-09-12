import {afterNextRender, Component, ElementRef, inject, OnDestroy, viewChild} from '@angular/core';
import {ToastService} from '../../services/toast/toast.service';
import {OverlayHandle} from '../../services/overlay/models/overlay-handle';

@Component({
  imports: [],
  selector: 'app-qr-scanner-drawer',
  styleUrl: './qr-scanner-drawer.scss',
  templateUrl: './qr-scanner-drawer.html',
})
export class QrScannerDrawer implements OnDestroy {

  private readonly toastService = inject(ToastService);
  private readonly overlayHandle = inject(OverlayHandle);

  private readonly videoRef = viewChild.required<ElementRef<HTMLVideoElement>>('video');

  private stream: MediaStream | null = null;

  constructor() {
    afterNextRender(() => this.getCamera());
  }

  private async getCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {facingMode: 'environment'},
        audio: false,
      });
    } catch {
      return this.onCameraRejected();
    }

    const camView = this.videoRef().nativeElement;
    camView.srcObject = this.stream;
    await camView.play();

  }

  private onCameraRejected() {
    this.toastService.showToast("Intet kamera", "Brugeren afviste anmodning om at bruge kameraet", 'video_camera_front_off');
    this.overlayHandle.close();
  }

  private stopCamera() {
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = null;
    this.videoRef().nativeElement.srcObject = null;
  }

  protected closeDrawer() {
    this.overlayHandle.close();
  }

  public ngOnDestroy() {
    this.stopCamera();
  }
}
