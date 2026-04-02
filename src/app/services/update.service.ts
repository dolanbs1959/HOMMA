import { Injectable, Optional } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { ToastController, AlertController } from '@ionic/angular';
import { interval, fromEvent, Subscription } from 'rxjs';

interface UpdateInfo { version?: string; force?: boolean }

@Injectable({ providedIn: 'root' })
export class UpdateService {
  // Default production interval: 30 minutes. Can be overridden for testing.
  private checkIntervalMs = 1000 * 60 * 30;
  private pollSub?: Subscription;

  constructor(
    @Optional() private updates?: SwUpdate,
    private toastCtrl?: ToastController,
    private alertCtrl?: AlertController,
  ) {
    // If the service worker provider isn't enabled (e.g., dev mode), still
    // enable the remote update checks (they're harmless) but avoid calling
    // SwUpdate APIs when unavailable.
    const updatesAny = this.updates as any;

    if (updatesAny && updatesAny.versionUpdates && updatesAny.versionUpdates.subscribe) {
      updatesAny.versionUpdates.subscribe((evt: any) => {
        try {
          if (evt && evt.type === 'VERSION_READY') this.promptForReload();
        } catch (e) {}
      });
    } else if (updatesAny && updatesAny.available && updatesAny.available.subscribe) {
      updatesAny.available.subscribe(() => this.promptForReload());
    }

    // Visibility/focus triggers attempt to check for update via SwUpdate
    fromEvent(document, 'visibilitychange').subscribe(() => {
      if (document.visibilityState === 'visible') this.checkForUpdate();
    });
    fromEvent(window, 'focus').subscribe(() => this.checkForUpdate());

    // Start polling the server-driven update flag (if present)
    this.startPollingServerFlag();
  }

  private async promptForReload(force = false) {
    // Force = mandatory modal, otherwise show a toast.
    if (force) {
      if (!this.alertCtrl) return;
      const alert = await this.alertCtrl.create({
        header: 'Update available',
        message: 'A critical update is available and will be applied now.',
        backdropDismiss: false,
        buttons: [{ text: 'OK', handler: () => this.activateAndReload() }]
      });
      await alert.present();
      return;
    }

    if (!this.toastCtrl) return;
    const toast = await this.toastCtrl.create({
      message: 'A new version is available.',
      position: 'bottom',
      buttons: [
        { text: 'Reload', handler: () => this.activateAndReload() },
        { text: 'Later', role: 'cancel' }
      ]
    });
    if (toast && toast.present) await toast.present();
  }

  private async activateAndReload() {
    try { if (this.updates) await this.updates.activateUpdate(); } catch (e) {}

    // Attempt to clear caches to ensure fresh assets (aggressive but effective)
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
    } catch (e) {}

    // Unregister service workers for a clean reload
    try {
      if ('serviceWorker' in navigator && (navigator as any).serviceWorker.getRegistrations) {
        const regs = await (navigator as any).serviceWorker.getRegistrations();
        for (const r of regs) {
          try { await r.unregister(); } catch (e) {}
        }
      }
    } catch (e) {}

    // Finally reload the page
    try { location.reload(); } catch (e) {}
  }

  async checkForUpdate() {
    try { if (this.updates) await this.updates.checkForUpdate(); } catch (e) {}
  }

  // --- Server-driven polling for /assets/update.json ---
  private async startPollingServerFlag() {
    // Start polling only if running in a browser
    if (typeof window === 'undefined') return;
    // poll immediately, then every interval
    this.pollOnce();
    this.pollSub = interval(this.checkIntervalMs).subscribe(() => this.pollOnce());
  }

  private async pollOnce() {
    try {
      const res = await fetch('/assets/update.json', { cache: 'no-store' });
      if (!res || res.status !== 200) return;
      const info: UpdateInfo = await res.json();
      if (!info || !info.version) return;
      // Compare versions; simple string compare. You can use semantic versioning or timestamps.
      const current = (window && (window as any).__APP_UPDATE_VERSION) || '';
      if (current !== info.version) {
        // mark the version so we don't re-prompt repeatedly during the same session
        try { (window as any).__APP_UPDATE_VERSION = info.version; } catch (e) {}
        // If force flagged, show mandatory modal
        this.promptForReload(Boolean(info.force));
      }
    } catch (e) {
      // ignore network errors; polling is best-effort
    }
  }

  stopPolling() {
    if (this.pollSub) this.pollSub.unsubscribe();
  }
}
