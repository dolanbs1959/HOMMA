import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface UpdateInfo { version?: string; force?: boolean }

@Injectable({ providedIn: 'root' })
export class VersionService {
  private cached?: UpdateInfo;

  constructor(private http: HttpClient) {}

  async getUpdateInfo(): Promise<UpdateInfo> {
    if (this.cached) return this.cached;
    try {
      const info = await this.http.get<UpdateInfo>('/assets/update.json', { headers: { 'Cache-Control': 'no-store' } }).toPromise();
      this.cached = info || {};
      return this.cached;
    } catch (e) {
      return { version: (window as any).__APP_UPDATE_VERSION || 'unknown' };
    }
  }

  async getVersion(): Promise<string> {
    try {
      const info = await this.getUpdateInfo();
      return info.version || (window as any).__APP_UPDATE_VERSION || 'unknown';
    } catch (e) {
      return (window as any).__APP_UPDATE_VERSION || 'unknown';
    }
  }
}
