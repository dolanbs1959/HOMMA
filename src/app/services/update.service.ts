import { Injectable, Optional } from '@angular/core';
import { environment } from 'src/environments/environment';
import { SwUpdate } from '@angular/service-worker';
import { ToastController, AlertController } from '@ionic/angular';
import { UserService } from './user.service';
import { interval, Subscription } from 'rxjs';
import { Router } from '@angular/router';

interface UpdateInfo { version?: string; force?: boolean }

@Injectable({ providedIn: 'root' })
export class UpdateService {
  private readonly PROMPTED_VERSION_KEY = 'HOMMA__APP_UPDATE_VERSION_PROMPTED';
  // Default production interval: 30 minutes. Can be overridden for testing.
  private checkIntervalMs = 1000 * 60 * 30;
  // Idle timeout to force update (1 hour)
  private idleTimeoutMs = 1000 * 60 * 60;
  private lastActivityAt = Date.now();
  private idleTimerHandle: any = null;
  private pollSub?: Subscription;
  // When true, allow showing non-forced prompts regardless of current route.
  private allowPromptsAnywhere = false;
  private readonly APP_LOAD_KEY = 'HOMMA__APP_UPDATE_CHECKED_SESSION';

  constructor(
    @Optional() private updates?: SwUpdate,
    private toastCtrl?: ToastController,
    private alertCtrl?: AlertController,
    private router?: Router,
    private userService?: UserService,
  ) {
    // Intentionally do not subscribe to automatic SW/version events or
    // visibility/focus triggers here. We only check for updates when the
    // app explicitly requests it (for example, immediately after user
    // login) to avoid repeatedly prompting users during a session.
    // The server-driven polling is available via startPollingServerFlag(),
    // but it will not run automatically unless explicitly started.
  }

  /**
   * Call this once after a user successfully logs in (or on first app
   * load) to perform a single update check. This avoids prompting users
   * repeatedly during a session.
   */
  async initOnLogin() {
    // Perform an immediate check, then start background polling so the
    // running app will detect updates during the session and prompt users
    // to reload without having to refresh manually.
    await this.pollOnce();
    try { this.startPollingServerFlag(); } catch (e) {}
  }

  /**
   * Run a one-time update check on app load. While running, allow prompts
   * even if the user isn't on the login route.
   */
  async initOnAppLoad() {
    try {
      // Only perform the app-load check once per browser session.
      if (typeof sessionStorage !== 'undefined') {
        const done = sessionStorage.getItem(this.APP_LOAD_KEY);
        if (done) return;
        try { sessionStorage.setItem(this.APP_LOAD_KEY, '1'); } catch (e) {}
      }
      this.allowPromptsAnywhere = true;
      await this.pollOnce();
      this.startIdleTracker();
    } finally {
      this.allowPromptsAnywhere = false;
    }
  }

  private async promptForReload(force = false, version?: string, fromPolling: boolean = false) {
    // Force = mandatory modal, otherwise show a toast.
    // If we've already prompted for this version and not forced, skip.
    try {
      if (!force && version) {
        const prev = window && (window as any).__APP_UPDATE_VERSION;
        const stored = localStorage.getItem(this.PROMPTED_VERSION_KEY) || prev || '';
        if (stored === version) return;
      }
    } catch (e) {}
    if (force) {
      if (!this.alertCtrl) return;
      try { if (version) this.setPromptedVersion(version); } catch (e) {}
      const alert = await this.alertCtrl.create({
        header: 'Update available',
        message: 'A critical update is available and will force you to sign in again.',
        backdropDismiss: false,
        cssClass: 'update-alert',
        buttons: [{ text: 'OK', handler: () => this.expireSessionAndRedirect(version) }]
      });
      await alert.present();
      return;
    }

    if (!this.toastCtrl) return;
    // If prompts aren't currently allowed anywhere, only show non-forced
    // toast prompts when on the login page. This prevents the black bottom
    // banner from appearing while navigating through the app.
    try {
      // If this prompt originated from the background poll, allow it regardless
      // of current route. Otherwise keep the previous guard to avoid noisy
      // prompts while users navigate the app.
      if (!fromPolling && !this.allowPromptsAnywhere && this.router && this.router.url && !this.router.url.includes('/login')) {
        return;
      }
    } catch (e) {}
    const toast = await this.toastCtrl.create({
      message: 'A new version is available. Proceeding will sign you out.',
      position: 'bottom',
      buttons: [
        { text: 'Reload', handler: () => this.expireSessionAndRedirect(version) },
        { text: 'Later', role: 'cancel' }
      ]
    });
    // store the prompted version so subsequent reloads won't immediately re-prompt
    try { if (version) this.setPromptedVersion(version); } catch (e) {}
    if (toast && toast.present) await toast.present();
  }

  private async activateAndReload() {
    // Allow disabling forced reloads during development to avoid interrupting
    // users and breaking in-memory state (photos, caches). Behavior:
    // - If `HOMMA__DISABLE_FORCED_RELOAD` is set in localStorage explicitly,
    //   its value '1'/'0' will override the default.
    // - By default, forced reloads are disabled in non-production builds.
    try {
      const override = (typeof localStorage !== 'undefined') ? localStorage.getItem('HOMMA__DISABLE_FORCED_RELOAD') : null;
      const disableByDefault = !environment.production;
      const disabled = override ? (override === '1') : disableByDefault;
      if (disabled) {
        // forced reload disabled (logging suppressed)
        return; // skip the reload flow entirely
      }
    } catch (e) {}

    // Before doing anything destructive, attempt to capture a minimal
    // snapshot of UI state so the app can restore it after the reload.
    try {
      const exporter = (window as any).HOMMA_exportState;
      if (exporter && typeof exporter === 'function') {
        try {
          const snapshot = exporter();
          if (snapshot) {
            try { sessionStorage.setItem('HOMMA__PRESERVED_STATE', JSON.stringify(snapshot)); } catch (e) {}
            // DEBUG: also write a copy to localStorage so the preserved snapshot
            // survives even if sessionStorage is removed during restore. Remove
            // this in production once debugging is complete.
            try {
              localStorage.setItem('HOMMA__PRESERVED_STATE_DEBUG', JSON.stringify(snapshot));
              // DEBUG preserved snapshot written (logging suppressed)
            } catch (e) {}
          }
        } catch (e) {}
      }
    } catch (e) {}

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

  private async expireSessionAndRedirect(version?: string) {
    try {
      // clear caches to ensure fresh assets on next full load
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
    } catch (e) {}

    try {
      // unregister service workers for a clean next load
      if ('serviceWorker' in navigator && (navigator as any).serviceWorker.getRegistrations) {
        const regs = await (navigator as any).serviceWorker.getRegistrations();
        for (const r of regs) {
          try { await r.unregister(); } catch (e) {}
        }
      }
    } catch (e) {}

    try {
      // call the app's logout/cleanup routine if available
      if (this.userService && typeof (this.userService as any).manualLogout === 'function') {
        try { (this.userService as any).manualLogout(); } catch (e) {}
      } else {
        // fallback: navigate to login
        try { this.router?.navigate(['/login']); } catch (e) {}
      }
    } catch (e) {}

    try { if (version) this.setPromptedVersion(version); } catch (e) {}
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
    // When the document becomes visible (user returns to the tab), trigger an immediate
    // poll to ensure backgrounded tabs pick up new versions as soon as they are foregrounded.
    try {
      document.addEventListener('visibilitychange', () => {
        try { if (document.visibilityState === 'visible') this.pollOnce(); } catch (e) {}
      });
      // also trigger on window focus for platforms where visibilitychange is unreliable
      window.addEventListener('focus', () => { try { this.pollOnce(); } catch (e) {} }, { passive: true });
    } catch (e) {}

    this.pollSub = interval(this.checkIntervalMs).subscribe(() => this.pollOnce());
  }

  private async pollOnce() {
    try {
      const res = await fetch('/assets/update.json', { cache: 'no-store' });
      if (!res || res.status !== 200) return;
      const info: UpdateInfo = await res.json();
      if (!info || !info.version) return;
      // Compare versions; simple string compare. Use localStorage so the prompt
      // does not reappear after a full reload for the same version.
      const current = localStorage.getItem(this.PROMPTED_VERSION_KEY) || '';
      if (current !== info.version) {
        // Do NOT automatically activate and reload here to avoid wiping
        // in-memory state (photos, form data). Instead, prompt the user
        // so they can choose when to reload. Forced updates will still
        // display a modal that informs the user, but we won't silently
        // reload the page.
        this.promptForReload(Boolean(info.force), info.version, true);
      }
    } catch (e) {
      // ignore network errors; polling is best-effort
    }
  }

  // --- Idle tracker: if no user activity for idleTimeoutMs, force update/reload ---
  private startIdleTracker() {
    try {
      const reset = () => { this.lastActivityAt = Date.now(); if (this.idleTimerHandle) { clearTimeout(this.idleTimerHandle); this.scheduleIdleCheck(); } };
      ['mousemove','keydown','touchstart','click'].forEach(evt => window.addEventListener(evt, reset, { passive: true }));
      this.scheduleIdleCheck();
    } catch (e) {}
  }

  private scheduleIdleCheck() {
    try {
      if (this.idleTimerHandle) clearTimeout(this.idleTimerHandle);
      const since = Date.now() - this.lastActivityAt;
      const wait = Math.max(1000, this.idleTimeoutMs - since);
      this.idleTimerHandle = setTimeout(() => this.onIdleTimeout(), wait);
    } catch (e) {}
  }

  private async onIdleTimeout() {
    try {
      // When idle threshold reached, perform a poll and force-reload to ensure
      // the client runs the latest code. To avoid destructive reloads that
      // can clear user state (photos, unsaved forms), we no longer force a
      // reload on idle. Instead, poll once and rely on prompt logic to let
      // the user choose when to update.
      await this.pollOnce();
      // Do not call `activateAndReload()` here. Reschedule the idle check
      // so the app continues monitoring activity.
      this.lastActivityAt = Date.now();
      this.scheduleIdleCheck();
    } catch (e) {
      // ignore and reschedule
      this.lastActivityAt = Date.now();
      this.scheduleIdleCheck();
    }
  }

  private setPromptedVersion(v: string) {
    try { localStorage.setItem(this.PROMPTED_VERSION_KEY, v); } catch (e) {}
    try { (window as any).__APP_UPDATE_VERSION = v; } catch (e) {}
  }

  stopPolling() {
    if (this.pollSub) this.pollSub.unsubscribe();
  }
}
