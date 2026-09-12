import {afterNextRender, Component, computed, ElementRef, inject, OnDestroy, signal, viewChild} from '@angular/core';
import type {BarcodeDetector} from 'barcode-detector/ponyfill';
import {ToastService} from '../../services/toast/toast.service';
import {OverlayHandle} from '../../services/overlay/models/overlay-handle';
import {ToastState} from '../../overlay/toast/models/toast-data';
import {MaterialIcon} from '../../common/components/material-icon/material-icon';

type QrDetector = Pick<BarcodeDetector, 'detect'>;
type ZxingOverrides = { locateFile: (path: string, prefix: string) => string };
type ScanState = 'waiting' | 'scanning' | 'found';

const SCAN_INTERVAL_MS = 250;
const SCAN_SIZE_PX = 480;
const FOUND_BLINK_MS = 900;
const JOIN_HASH_PATTERN = /^#\/join\/([^/?#]+)$/;

let zxingOverrides: ZxingOverrides | undefined;

@Component({
  imports: [
    MaterialIcon
  ],
  selector: 'app-qr-scanner-drawer',
  styleUrl: './qr-scanner-drawer.scss',
  templateUrl: './qr-scanner-drawer.html',
})
export class QrScannerDrawer implements OnDestroy {

  private readonly toastService = inject(ToastService);
  private readonly overlayHandle: OverlayHandle<string> = inject(OverlayHandle);

  private readonly videoRef = viewChild.required<ElementRef<HTMLVideoElement>>('video');

  protected readonly scanState = signal<ScanState>('waiting');
  protected readonly statusText = computed(() => {
    switch (this.scanState()) {
      case 'waiting':
        return 'Starter kameraet';
      case 'scanning':
        return 'Ret kameraet mod QR-koden på værtens skærm';
      case 'found':
        return 'QR-kode fundet';
    }
  });

  private stream: MediaStream | null = null;
  private destroyed = false;
  private lastInvalidValue: string | null = null;

  constructor() {
    afterNextRender(() => this.start());
  }

  private async start() {
    const stream = await this.openCamera();
    if (!stream) return;
    if (this.destroyed) {
      stream.getTracks().forEach(track => track.stop());
      return;
    }
    this.stream = stream;

    const video = this.videoRef().nativeElement;
    video.srcObject = stream;
    try {
      await video.play();
    } catch {
      return;
    }
    this.scanState.set('scanning');

    const detector = await this.loadDetector();
    if (!detector || this.destroyed) return;

    await this.scanLoop(detector, video);
  }

  private async openCamera(): Promise<MediaStream | null> {
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: {ideal: 1280},
          height: {ideal: 720},
        },
        audio: false,
      });
    } catch (error) {
      this.fail('Intet kamera', this.cameraErrorText(error), 'video_camera_front_off');
      return null;
    }
  }

  private cameraErrorText(error: unknown): string {
    switch (error instanceof DOMException ? error.name : undefined) {
      case 'NotAllowedError':
        return 'Adgang til kameraet blev afvist';
      case 'NotFoundError':
      case 'OverconstrainedError':
        return 'Der blev ikke fundet noget kamera';
      case 'NotReadableError':
        return 'Kameraet bruges allerede af et andet program';
      default:
        return 'Kameraet kunne ikke startes';
    }
  }

  private async loadDetector(): Promise<QrDetector | null> {
    try {
      const nativeDetector = await this.createNativeDetector();
      return nativeDetector ?? await this.createZxingDetector();
    } catch {
      this.fail('Scanneren kunne ikke starte', 'QR-scanneren kunne ikke indlæses', 'qr_code_scanner');
      return null;
    }
  }

  private async createNativeDetector(): Promise<QrDetector | null> {
    const NativeBarcodeDetector = (globalThis as { BarcodeDetector?: typeof BarcodeDetector }).BarcodeDetector;
    if (!NativeBarcodeDetector) return null;

    try {
      const formats = await NativeBarcodeDetector.getSupportedFormats();
      return formats.includes('qr_code') ? new NativeBarcodeDetector({formats: ['qr_code']}) : null;
    } catch {
      return null;
    }
  }

  private async createZxingDetector(): Promise<QrDetector> {
    const zxing = await import('barcode-detector/ponyfill');
    zxingOverrides ??= {
      locateFile: (path, prefix) => path.endsWith('.wasm')
        ? new URL(`zxing/${path}?v=${zxing.ZXING_WASM_VERSION}`, document.baseURI).href
        : prefix + path,
    };
    await zxing.prepareZXingModule({overrides: zxingOverrides, fireImmediately: true});
    return new zxing.BarcodeDetector({formats: ['qr_code']});
  }

  private async scanLoop(detector: QrDetector, video: HTMLVideoElement) {
    const context = new OffscreenCanvas(SCAN_SIZE_PX, SCAN_SIZE_PX).getContext('2d', {willReadFrequently: true});
    if (!context) return;

    while (!this.destroyed) {
      let partyId: string | null = null;
      try {
        const frame = this.grabFrame(video, context);
        const hits = frame ? await detector.detect(frame) : [];
        partyId = this.findPartyId(hits.map(hit => hit.rawValue));
      } catch {
        // Frame not ready yet; try again on the next tick.
      }

      if (partyId) {
        await this.confirmScan(partyId, video);
        return;
      }
      await new Promise(resolve => setTimeout(resolve, SCAN_INTERVAL_MS));
    }
  }

  private grabFrame(video: HTMLVideoElement, context: OffscreenCanvasRenderingContext2D): ImageData | null {
    const {videoWidth: width, videoHeight: height} = video;
    if (width === 0 || height === 0) return null;

    const side = Math.min(width, height);
    context.drawImage(video, (width - side) / 2, (height - side) / 2, side, side, 0, 0, SCAN_SIZE_PX, SCAN_SIZE_PX);
    return context.getImageData(0, 0, SCAN_SIZE_PX, SCAN_SIZE_PX);
  }

  private findPartyId(rawValues: string[]): string | null {
    for (const rawValue of rawValues) {
      const partyId = this.parsePartyId(rawValue);
      if (partyId) return partyId;

      if (rawValue !== this.lastInvalidValue) {
        this.lastInvalidValue = rawValue;
        this.toastService.showToast('Ukendt QR-kode', 'Koden er ikke et link til et spil', 'qr_code', ToastState.error);
      }
    }
    return null;
  }

  private async confirmScan(partyId: string, video: HTMLVideoElement) {
    video.pause();
    this.scanState.set('found');
    await new Promise(resolve => setTimeout(resolve, FOUND_BLINK_MS));
    if (this.destroyed) return;

    this.stopCamera();
    this.overlayHandle.close(partyId);
  }

  private parsePartyId(rawValue: string): string | null {
    try {
      const match = JOIN_HASH_PATTERN.exec(new URL(rawValue).hash);
      return match ? decodeURIComponent(match[1]) : null;
    } catch {
      return null;
    }
  }

  private fail(title: string, text: string, icon: string) {
    if (this.destroyed) return;
    this.toastService.showToast(title, text, icon, ToastState.error);
    this.overlayHandle.close();
  }

  private stopCamera() {
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = null;
  }

  protected closeDrawer() {
    this.overlayHandle.close();
  }

  public ngOnDestroy() {
    this.destroyed = true;
    this.stopCamera();
  }
}
