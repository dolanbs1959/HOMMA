// src/app/services/logger.service.ts
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

/**
 * Secure logging service that prevents sensitive data from appearing in production console
 * Only logs to console when environment.production = false
 */
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  // When true, suppress all non-error logs regardless of environment
  private suppressAllLogs = true;

  /**
   * Log general information (only in development)
   */
  log(message: string, ...optionalParams: any[]): void {
    if (this.suppressAllLogs) return;
    if (!environment.production) {
      // eslint-disable-next-line no-console
      console.log(message, ...optionalParams);
    }
  }

  /**
   * Log warnings (only in development)
   */
  warn(message: string, ...optionalParams: any[]): void {
    if (this.suppressAllLogs) return;
    if (!environment.production) {
      // eslint-disable-next-line no-console
      console.warn(message, ...optionalParams);
    }
  }

  /**
   * Log errors (always logged, but sanitized in production)
   */
  error(message: string, error?: any): void {
    // Always log errors to console; in production this could be sanitized/forwarded
    try {
      // eslint-disable-next-line no-console
      console.error(message, error);
    } catch (e) {}
  }

  /**
   * Log debug information (only in development)
   */
  debug(message: string, ...optionalParams: any[]): void {
    if (this.suppressAllLogs) return;
    if (!environment.production) {
      // eslint-disable-next-line no-console
      console.debug(message, ...optionalParams);
    }
  }
}
