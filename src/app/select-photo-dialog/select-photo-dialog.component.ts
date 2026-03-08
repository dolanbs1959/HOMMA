import { Component, EventEmitter, Output, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';

declare global {
  interface Window { plugins: any; }
}

@Component({
  selector: 'app-select-photo-dialog',
  templateUrl: './select-photo-dialog.component.html',
  styleUrls: ['./select-photo-dialog.component.scss']
})
export class SelectPhotoDialogComponent implements OnInit {
  @ViewChild('videoElement', { static: false}) videoElement!: ElementRef;
  @ViewChild('canvasElement') canvasElement!: ElementRef;
  @ViewChild('imageElement') imageElement!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @Output() photoCaptured = new EventEmitter<string>();
  private stream: MediaStream | undefined;
  showFilePicker = false;


  constructor(
    public dialogRef: MatDialogRef<SelectPhotoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    ) { }

  ngOnInit(): void {
    // Automatically start the camera when dialog opens
    this.onTakePhoto();
  }

  onTakePhoto(): void {
    // Implement the functionality to take a photo here
    // Guard: mediaDevices may be unavailable in some desktop environments or browsers
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !navigator.mediaDevices.enumerateDevices) {
      console.warn('getUserMedia/enumerateDevices not supported; enabling file picker fallback');
      this.showFilePicker = true;
      return;
    }

    // Try to enumerate devices and pick a suitable video input first
    navigator.mediaDevices.enumerateDevices()
      .then(async (devices) => {
        try {
          const videoInputs = devices.filter(d => d.kind === 'videoinput');
          let constraints: any = null;
          if (videoInputs && videoInputs.length) {
            // Prefer a device whose label suggests a rear/back camera when available
            const preferred = videoInputs.find(d => /back|rear|environment|usb|camera/i.test(d.label));
            const chosen = preferred || videoInputs[videoInputs.length - 1];
            if (chosen && chosen.deviceId) {
                // use 'ideal' so we don't throw if the deviceId becomes unavailable
                constraints = { video: { deviceId: { ideal: chosen.deviceId } } };
              }
          }

          if (!constraints) {
            // fallback to facingMode ideal which is lenient
            constraints = { video: { facingMode: { ideal: 'environment' } } };
          }

          console.debug('Camera constraints chosen:', constraints);
          const stream = await navigator.mediaDevices.getUserMedia(constraints).catch(async (err) => {
            console.warn('getUserMedia with chosen constraints failed, falling back to default. Error:', err);
            // final fallback to any available camera
            return navigator.mediaDevices.getUserMedia({ video: true });
          });

          this.stream = stream;
          if (this.videoElement && this.videoElement.nativeElement) {
            this.videoElement.nativeElement.srcObject = stream;
            this.showFilePicker = false;
          } else {
            console.error('Video element not found!');
            this.showFilePicker = true;
          }
        } catch (err) {
          console.error('Error accessing camera after enumerateDevices: ', err);
          this.showFilePicker = true;
        }
      })
      .catch(err => {
        console.error('enumerateDevices failed:', err);
        // Try a simpler getUserMedia call as a last attempt
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(stream => {
            this.stream = stream;
            if (this.videoElement && this.videoElement.nativeElement) {
              this.videoElement.nativeElement.srcObject = stream;
              this.showFilePicker = false;
            }
          })
          .catch(err2 => {
            console.error('Error accessing camera: ', err2);
            this.showFilePicker = true;
          });
      });
  }
// Add the following method to capture the photo:
  capturePhoto(): void {
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

      // Set the desired dimensions
  const desiredWidth = 640;
  const desiredHeight = 480;

  // Set the canvas dimensions to the desired dimensions
  canvas.width = desiredWidth;
  canvas.height = desiredHeight;

    // // Set the canvas dimensions to match the video element
    // canvas.width = this.videoElement.nativeElement.videoWidth;
    // canvas.height = this.videoElement.nativeElement.videoHeight;

    // Draw the current frame of the video onto the canvas
    context.drawImage(this.videoElement.nativeElement, 0, 0, canvas.width, canvas.height);
    // Get a data URL representing the image
    const imageUrl = canvas.toDataURL('image/png');

    // Share the image
//    window.plugins.socialsharing.share(null, null, imageUrl, null);

    this.imageElement.nativeElement.src = imageUrl;
      // Emit the photo data
    this.photoCaptured.emit(imageUrl);

  // Stop the video stream
  if (this.stream) {
    this.stream.getTracks().forEach(track => track.stop());

  }
  }
  // Open a native file picker as fallback
  openFilePicker(): void {
    try {
      if (this.fileInput && this.fileInput.nativeElement) {
        this.fileInput.nativeElement.click();
      }
    } catch (e) {
      console.error('File input not available', e);
    }
  }

  onFileSelected(event: any): void {
    const file: File = event?.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      this.imageElement.nativeElement.src = dataUrl;
      this.photoCaptured.emit(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  retryCamera(): void {
    // stop any existing stream then try again
    try {
      if (this.stream) {
        this.stream.getTracks().forEach(t => t.stop());
        this.stream = undefined;
      }
    } catch (e) {}
    this.showFilePicker = false;
    // attempt to access camera again
    setTimeout(() => this.onTakePhoto(), 50);
  }
  onSelectPhoto(): void {
    // Implement the functionality to select a photo here
    this.dialogRef.close();
  }

}