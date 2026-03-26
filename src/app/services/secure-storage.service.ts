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

  // no-op init kept for compatibility; detection is dynamic per-call
  async init(): Promise<void> {
    this.pluginAvailable = true;
  }

  private getCapacitorPlugin(): any {
    const win = window as any;
    return win.Capacitor?.Plugins?.SecureStorage || win.Capacitor?.Plugins?.SecureStoragePlugin || win.Capacitor?.Plugins?.SecureStorageEcho || null;
  }

  private getCordovaPlugin(): any {
    const win = window as any;
    return win.cordova?.plugins?.SecureStorage || win.plugins?.SecureStorage || win.SecureStorage || win.cordova?.SecureStorage || null;
  }

  private async tryCordovaInstanceSet(instance: any, key: string, value: string): Promise<void> {
    // callback-style: instance.set(success, error, key, value)
    if (typeof instance.set === 'function') {
      if (instance.set.length >= 4) {
        await new Promise<void>((resolve, reject) => {
          try {
            instance.set(() => resolve(), (err: any) => reject(err), key, value);
          } catch (e) { reject(e); }
        });
        return;
      }

      // promise-style: instance.set(key, value)
      const res = instance.set(key, value);
      if (res && typeof res.then === 'function') await res;
      return;
    }
  }

  private async tryCordovaInstanceGet(instance: any, key: string): Promise<string | null> {
    if (typeof instance.get === 'function') {
      if (instance.get.length >= 3) {
        return await new Promise<string | null>((resolve, reject) => {
          try {
            instance.get((val: any) => resolve(val), (err: any) => reject(err), key);
          } catch (e) { reject(e); }
        });
      }
      const res = instance.get(key);
      if (res && typeof res.then === 'function') return await res;
    }
    return null;
  }

  private async tryCordovaInstanceRemove(instance: any, key: string): Promise<void> {
    if (typeof instance.remove === 'function') {
      if (instance.remove.length >= 3) {
        await new Promise<void>((resolve, reject) => {
          try {
            instance.remove(() => resolve(), (err: any) => reject(err), key);
          } catch (e) { reject(e); }
        });
        return;
      }
      const res = instance.remove(key);
      if (res && typeof res.then === 'function') await res;
      return;
    }
  }

  async set(key: string, value: string): Promise<void> {
    const win = window as any;

    // Try Capacitor plugin first
    try {
      const cap = this.getCapacitorPlugin();
      if (cap) {
        console.log('SecureStorageService: using Capacitor secure storage plugin (set)');
        // support plugins that accept an object {key, value} or direct args
        if (typeof cap.set === 'function') {
          // some implementations: set({ key, value })
          try {
            await cap.set({ key, value });
            return;
          } catch (_) {}

          // or set(key, value)
          try {
            const r = cap.set(key, value);
            if (r && typeof r.then === 'function') await r;
            return;
          } catch (_) {}
        }
      }
    } catch (e) { console.log('SecureStorageService: capacitor set failed', e); }

    // Try Cordova secure storage plugin
    try {
      const cordovaPlugin = this.getCordovaPlugin();
      if (cordovaPlugin) {
        console.log('SecureStorageService: using Cordova secure storage plugin (set)');
        let instance: any = cordovaPlugin;
        try {
          // If plugin is a constructor, create a namespaced instance
          if (typeof cordovaPlugin === 'function') {
            instance = new cordovaPlugin(() => {}, () => {}, 'HOMMA');
          } else if (win.cordova && win.cordova.plugins && win.cordova.plugins.SecureStorage) {
            instance = new win.cordova.plugins.SecureStorage(() => {}, () => {}, 'HOMMA');
          }
        } catch (_) {
          // ignore - fallback to using plugin object directly
          instance = cordovaPlugin;
        }

        await this.tryCordovaInstanceSet(instance, key, value);
        return;
      }
    } catch (e) { console.log('SecureStorageService: cordova set failed', e); }

    // Fallback: localStorage
    console.log('SecureStorageService: falling back to localStorage (set)');
    try { localStorage.setItem(key, value); } catch (e) {}
  }

  async get(key: string): Promise<string | null> {
    const win = window as any;

    try {
      const cap = this.getCapacitorPlugin();
      if (cap && typeof cap.get === 'function') {
        console.log('SecureStorageService: using Capacitor secure storage plugin (get)');
        try {
          const res = await cap.get({ key });
          return res?.value ?? null;
        } catch (_) {}

        try {
          const r = cap.get(key);
          if (r && typeof r.then === 'function') {
            const out = await r;
            return out?.value ?? out ?? null;
          }
        } catch (_) {}
      }
    } catch (e) {}

    try {
      const cordovaPlugin = this.getCordovaPlugin();
      if (cordovaPlugin) {
        let instance: any = cordovaPlugin;
        try {
          if (typeof cordovaPlugin === 'function') {
            instance = new cordovaPlugin(() => {}, () => {}, 'HOMMA');
          } else if (win.cordova && win.cordova.plugins && win.cordova.plugins.SecureStorage) {
            instance = new win.cordova.plugins.SecureStorage(() => {}, () => {}, 'HOMMA');
          }
        } catch (_) { instance = cordovaPlugin; }

        console.log('SecureStorageService: using Cordova secure storage plugin (get)');
        const val = await this.tryCordovaInstanceGet(instance, key);
        if (val !== null) return val;
      }
    } catch (e) {}

    console.log('SecureStorageService: falling back to localStorage (get)');
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  async remove(key: string): Promise<void> {
    const win = window as any;

    try {
      const cap = this.getCapacitorPlugin();
      if (cap && typeof cap.remove === 'function') {
        console.log('SecureStorageService: using Capacitor secure storage plugin (remove)');
        try {
          await cap.remove({ key });
          return;
        } catch (_) {}

        try {
          const r = cap.remove(key);
          if (r && typeof r.then === 'function') await r;
          return;
        } catch (_) {}
      }
    } catch (e) {}

    try {
      const cordovaPlugin = this.getCordovaPlugin();
      if (cordovaPlugin) {
        console.log('SecureStorageService: using Cordova secure storage plugin (remove)');
        let instance: any = cordovaPlugin;
        try {
          if (typeof cordovaPlugin === 'function') {
            instance = new cordovaPlugin(() => {}, () => {}, 'HOMMA');
          } else if (win.cordova && win.cordova.plugins && win.cordova.plugins.SecureStorage) {
            instance = new win.cordova.plugins.SecureStorage(() => {}, () => {}, 'HOMMA');
          }
        } catch (_) { instance = cordovaPlugin; }

        await this.tryCordovaInstanceRemove(instance, key);
        return;
      }
    } catch (e) {}

    console.log('SecureStorageService: falling back to localStorage (remove)');
    try { localStorage.removeItem(key); } catch (e) {}
  }
}
