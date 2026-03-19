import { Injectable } from '@angular/core';

/**
 * Lightweight SecureStorage wrapper.
 *
 * Attempts to use a Capacitor / native secure storage plugin if present at runtime
 * (e.g. Capacitor Community Secure Storage or other platform plugin). If no
 * secure plugin is available this falls back to `localStorage` so the API
 * remains usable in the browser during development.
 *
 * NOTE: For real production security, install and configure a native secure
 * storage plugin (Keychain / Android keystore). This wrapper will use it if
 * available; otherwise it falls back to localStorage.
 */
@Injectable({ providedIn: 'root' })
export class SecureStorageService {
  private pluginAvailable = false;

  async init(): Promise<void> {
    try {
      const cap = (window as any).Capacitor;
      if (cap && cap.Plugins && cap.Plugins.SecureStoragePlugin) {
        this.pluginAvailable = true;
        return;
      }
      // Some plugins expose themselves on window globals
      if ((window as any).SecureStorage || (window as any).secureStoragePlugin) {
        this.pluginAvailable = true;
        return;
      }
    } catch (e) {
      // ignore
    }
    this.pluginAvailable = false;
  }

  async set(key: string, value: string): Promise<void> {
    if (this.pluginAvailable) {
      try {
        const plugin = (window as any).Capacitor?.Plugins?.SecureStoragePlugin || (window as any).SecureStorage || (window as any).secureStoragePlugin;
        if (plugin && plugin.set) {
          await plugin.set({ key, value });
          return;
        }
      } catch (e) {
        // fallback
      }
    }

    try { localStorage.setItem(key, value); } catch (e) {}
  }

  async get(key: string): Promise<string | null> {
    if (this.pluginAvailable) {
      try {
        const plugin = (window as any).Capacitor?.Plugins?.SecureStoragePlugin || (window as any).SecureStorage || (window as any).secureStoragePlugin;
        if (plugin && plugin.get) {
          const res = await plugin.get({ key });
          return res?.value ?? null;
        }
      } catch (e) {
        // fallback
      }
    }

    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  async remove(key: string): Promise<void> {
    if (this.pluginAvailable) {
      try {
        const plugin = (window as any).Capacitor?.Plugins?.SecureStoragePlugin || (window as any).SecureStorage || (window as any).secureStoragePlugin;
        if (plugin && plugin.remove) {
          await plugin.remove({ key });
          return;
        }
      } catch (e) {
        // fallback
      }
    }

    try { localStorage.removeItem(key); } catch (e) {}
  }
}
