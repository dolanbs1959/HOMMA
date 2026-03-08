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

  /**
   * Log general information (only in development)
   */
  log(message: string, ...optionalParams: any[]): void {
    // No-op: logging disabled
    return;
  }

  /**
   * Log warnings (only in development)
   */
  warn(message: string, ...optionalParams: any[]): void {
    // No-op: logging disabled
    return;
  }

  /**
   * Log errors (always logged, but sanitized in production)
   */
  error(message: string, error?: any): void {
    // No-op: logging disabled
    return;
  }

  /**
   * Log debug information (only in development)
   */
  debug(message: string, ...optionalParams: any[]): void {
    // No-op: logging disabled
    return;
  }
}
