import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root',
})
export class PhotoStorageService {
  private photos: { [key: string]: string } = {};

  setPhoto(recordId: string, base64Image: string): void {
    this.photos[recordId] = base64Image;
  }

  getPhoto(recordId: string): string | undefined {
    // Prefer in-memory cache
    if (this.photos[recordId]) return this.photos[recordId];

    // Fallback to sessionStorage for WebViews where in-memory cache may be lost
    try {
      const key = `residentPhoto_${recordId}`;
      const stored = sessionStorage.getItem(key);
      if (stored) {
        // populate in-memory cache for future quick access
        this.photos[recordId] = stored;
        return stored;
      }
    } catch (e) {
      // ignore storage errors
    }

    return undefined;
  }

  getAllPhotos(): { [key: string]: string } {
    return this.photos;
  }

  /**
   * Return a normalized image src suitable for an <img> element.
   * - If an in-memory photo exists for `recordId`, prefer it.
   * - If the value is a data URI, return as-is.
   * - If the value is a native file URI (file:// or absolute path), convert using Capacitor.convertFileSrc when available.
   */
  getSafeSrc(valueOrId?: string, recordId?: string): string | undefined {
    try {
      let src: string | undefined = undefined;
      // Prefer any stored photo (in-memory or sessionStorage) for the given recordId
      if (recordId) {
        const stored = this.getPhoto(String(recordId));
        if (stored) {
          src = stored;
        }
      }
      // If no stored photo, fall back to the provided value (which may be a data URI or URL)
      if (!src && valueOrId) {
        src = valueOrId;
      }

      if (!src) return undefined;

      // already a data URL
      if (src.startsWith('data:')) return src;

      // native file URI or absolute filesystem path
      if (src.startsWith('file://') || src.startsWith('/')) {
        // convertFileSrc exists on Capacitor runtime in native apps
        try {
          // @ts-ignore: convertFileSrc exists on Capacitor runtime
          if (Capacitor && typeof (Capacitor as any).convertFileSrc === 'function') {
            return (Capacitor as any).convertFileSrc(src);
          }
        } catch (_) {
          // fall through and return original src
        }
      }

      return src;
    } catch (e) {
      return undefined;
    }
  }
}