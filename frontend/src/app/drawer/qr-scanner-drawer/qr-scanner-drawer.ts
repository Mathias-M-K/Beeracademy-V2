import {afterNextRender, Component, computed, ElementRef, inject, OnDestroy, signal, viewChild} from '@angular/core';
import type {BarcodeDetector} from 'barcode-detector/ponyfill';
import {ToastService} from '../../services/toast/toast.service';
import {OverlayHandle} from '../../services/overlay/models/overlay-handle';
import {ToastState} from '../../overlay/toast/models/toast-data';
import {MaterialIcon} from '../../common/components/material-icon/material-icon';

type QrDetector = Pick<BarcodeDetector, 'detect'>;
type DetectedCode = Awaited<ReturnType<QrDetector['detect']>>[number];
type ZxingOverrides = { locateFile: (path: string, prefix: string) => string };
type ScanState = 'waiting' | 'scanning' | 'found';

interface FrameBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface JoinCode {
  partyId: string;
  code: DetectedCode;
}

const SCAN_INTERVAL_MS = 250;
const SCAN_SIZE_PX = 480;
const FOUND_ANIMATION_MS = 1500;
const REJECT_ANIMATION_MS = 500;
const LOCK_PADDING_PCT = 4;
const PARTICLE_COUNT = 12;
const DEFAULT_FRAME: FrameBox = {left: 18, top: 18, width: 64, height: 64};
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
  protected readonly rejecting = signal(false);
  protected readonly frameBox = signal<FrameBox>(DEFAULT_FRAME);
  protected readonly particleAngles = Array.from({length: PARTICLE_COUNT}, (_, index) => index * 360 / PARTICLE_COUNT);
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
  private rejectTimer: ReturnType<typeof setTimeout> | undefined;

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
      let match: JoinCode | null = null;
      try {
        const frame = this.grabFrame(video, context);
        const codes = frame ? await detector.detect(frame) : [];
        match = this.findJoinCode(codes);
      } catch {
        // Frame not ready yet; try again on the next tick.
      }

      if (match) {
        await this.confirmScan(match, video);
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

  private findJoinCode(codes: DetectedCode[]): JoinCode | null {
    for (const code of codes) {
      const partyId = this.parsePartyId(code.rawValue);
      if (partyId) return {partyId, code};

      if (code.rawValue !== this.lastInvalidValue) {
        this.lastInvalidValue = code.rawValue;
        this.flashRejected();
        this.toastService.showToast('Ukendt QR-kode', 'Koden er ikke et link til et spil', 'qr_code', ToastState.error);
      }
    }
    return null;
  }

  private flashRejected() {
    clearTimeout(this.rejectTimer);
    this.rejecting.set(true);
    this.rejectTimer = setTimeout(() => this.rejecting.set(false), REJECT_ANIMATION_MS);
  }

  private async confirmScan(match: JoinCode, video: HTMLVideoElement) {
    this.frameBox.set(this.toFrameBox(match.code.boundingBox, video));
    video.pause();
    this.scanState.set('found');
    navigator.vibrate?.([40, 60, 80]);

    await new Promise(resolve => setTimeout(resolve, FOUND_ANIMATION_MS));
    if (this.destroyed) return;

    this.stopCamera();
    this.overlayHandle.close(match.partyId);
  }

  private toFrameBox(box: DOMRectReadOnly, video: HTMLVideoElement): FrameBox {
    const {videoWidth, videoHeight, clientWidth, clientHeight} = video;
    if (!videoWidth || !videoHeight || !clientWidth || !clientHeight) return this.frameBox();

    const side = Math.min(videoWidth, videoHeight);
    const cropScale = side / SCAN_SIZE_PX;
    const coverScale = Math.max(clientWidth / videoWidth, clientHeight / videoHeight);
    const scale = cropScale * coverScale;
    const toPct = (value: number, client: number) => ((value * cropScale - side / 2) * coverScale + client / 2) / client * 100;

    return {
      left: toPct(box.x, clientWidth) - LOCK_PADDING_PCT,
      top: toPct(box.y, clientHeight) - LOCK_PADDING_PCT,
      width: box.width * scale / clientWidth * 100 + 2 * LOCK_PADDING_PCT,
      height: box.height * scale / clientHeight * 100 + 2 * LOCK_PADDING_PCT,
    };
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
    clearTimeout(this.rejectTimer);
    this.stopCamera();
  }
}
