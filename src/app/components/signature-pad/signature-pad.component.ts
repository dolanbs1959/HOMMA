import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'app-signature-pad',
  templateUrl: './signature-pad.component.html',
  styleUrls: ['./signature-pad.component.scss']
})
export class SignaturePadComponent implements AfterViewInit {
  @ViewChild('signatureCanvas', { static: true }) signatureCanvasRef?: ElementRef<HTMLCanvasElement>;

  @Input() label = 'Signature';
  @Output() signatureChange = new EventEmitter<string>();

  private signatureStrokeActive = false;
  private signatureHasInk = false;
  signatureDataUrl = '';

  constructor() {}

  ngAfterViewInit(): void {
    const canvas = this.getSignatureCanvas();
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    context.lineWidth = 2.5;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#000000';

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  private getSignatureCanvas(): HTMLCanvasElement | null {
    return this.signatureCanvasRef?.nativeElement || null;
  }

  private getSignaturePoint(event: PointerEvent) {
    const canvas = this.getSignatureCanvas();
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  beginSignatureStroke(event: PointerEvent): void {
    const canvas = this.getSignatureCanvas();
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    const point = this.getSignaturePoint(event);
    if (!context || !point) {
      return;
    }

    this.signatureStrokeActive = true;
    this.signatureHasInk = true;
    canvas.setPointerCapture?.(event.pointerId);

    context.beginPath();
    context.moveTo(point.x, point.y);
    event.preventDefault();
  }

  continueSignatureStroke(event: PointerEvent): void {
    if (!this.signatureStrokeActive) {
      return;
    }

    const canvas = this.getSignatureCanvas();
    const context = canvas?.getContext('2d');
    const point = this.getSignaturePoint(event);
    if (!canvas || !context || !point) {
      return;
    }

    context.lineTo(point.x, point.y);
    context.stroke();
    event.preventDefault();
  }

  endSignatureStroke(): void {
    if (!this.signatureStrokeActive) {
      return;
    }

    this.signatureStrokeActive = false;
    this.captureSignatureDataUrl();
  }

  private captureSignatureDataUrl(): void {
    const canvas = this.getSignatureCanvas();
    if (!canvas) {
      this.signatureDataUrl = '';
      this.signatureChange.emit('');
      return;
    }

    this.signatureDataUrl = this.signatureHasInk ? canvas.toDataURL('image/png') : '';
    this.signatureChange.emit(this.signatureDataUrl);
  }

  clearSignaturePad(): void {
    const canvas = this.getSignatureCanvas();
    const context = canvas?.getContext('2d');
    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    this.signatureStrokeActive = false;
    this.signatureHasInk = false;
    this.signatureDataUrl = '';
    this.signatureChange.emit('');
  }
}
