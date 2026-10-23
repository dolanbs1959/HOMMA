import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { QuickbaseService } from './quickbase.service';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userInfo: { houseName: string, staffId: string } = { houseName: '', staffId: '' };
  private participantInfo: {
    email: string,
    recordId: number,
    fullName: string,
    isStaff: boolean,
    staffRecordId: number,
    timeClockEnabled: boolean
  } = { email: '', recordId: 0, fullName: '', isStaff: false, staffRecordId: 0, timeClockEnabled: false };
  private displayName = '';

  constructor(
    private router: Router,
    private quickbaseService: QuickbaseService,
    private logger: LoggerService
  ) {}

  setUserInfo(houseName: string, staffId: string) {
    this.userInfo = { houseName, staffId };
  }

  getUserInfo() {
    return this.userInfo;
  }

  setDisplayName(name: string) {
    this.displayName = name || '';
  }

  getDisplayName(): string {
    return this.displayName;
  }

  // Participant login info methods
  setParticipantInfo(email: string, recordId: number, fullName: string, isStaff: boolean = false, staffRecordId: number = 0, timeClockEnabled: boolean = false) {
    this.participantInfo = { email, recordId, fullName, isStaff, staffRecordId, timeClockEnabled };
  }

  getParticipantInfo() {
    return this.participantInfo;
  }

  isStaffUser(): boolean {
    return this.participantInfo.isStaff;
  }

  /**
   * Whether the authenticated user's Staff record has Time Clock (HOMMA)
   * (fid 359) checked. Only meaningful for Senior Staff participant logins.
   */
  isTimeClockEnabled(): boolean {
    return this.participantInfo.timeClockEnabled === true;
  }

  /**
   * Look up a staff record in the cached activeStaff data and return whether
   * its Time Clock (HOMMA) field (fid 359) is checked.
   * @param staffRecordId The staff record ID (fid 3) to check
   */
  checkTimeClockEnabled(staffRecordId: number): boolean {
    const cachedStaff = this.quickbaseService.activeStaff.value;
    if (!cachedStaff || !Array.isArray(cachedStaff) || !staffRecordId) {
      return false;
    }

    const match = cachedStaff.find((staff: any) => {
      const id = staff?.staffRecordId ?? staff?.userId;
      return id === staffRecordId || Number(id) === Number(staffRecordId);
    });

    this.logger.log(`checkTimeClockEnabled for staffRecordId ${staffRecordId}: ${!!match?.timeClockEnabled}`);
    return !!match?.timeClockEnabled;
  }

  getParticipantEmail(): string {
    return this.participantInfo.email;
  }

  /**
   * Check if a resident record ID belongs to a Senior Staff member
   * Uses the cached activeStaff data from QuickbaseService
   * Matches resident record ID against staff Related Participant field (fid 9)
   * @param residentRecordId The resident record ID to check
   * @returns The staff record ID if found, or 0 if not a Senior Staff
   */
  checkIsSeniorStaff(residentRecordId: number): number {
    this.logger.log(`🔍 checkIsSeniorStaff called with residentRecordId: ${residentRecordId} (type: ${typeof residentRecordId})`);

    const cachedStaff = this.quickbaseService.activeStaff.value;
    this.logger.log(`📋 Cached activeStaff data (raw):`, cachedStaff);

    if (cachedStaff && Array.isArray(cachedStaff)) {
      this.logger.log(`📊 Found ${cachedStaff.length} staff records in cache`);

      // Debug: inspect each staff entry for relatedParticipantId types/values
      for (let i = 0; i < cachedStaff.length; i++) {
        const s = cachedStaff[i];
        try {
          this.logger.debug(`  staff[${i}] relatedParticipantId:`, s.relatedParticipantId, `(type: ${typeof s.relatedParticipantId})`, `staffRecordId: ${s.staffRecordId}`, `displayName: ${s.displayName}`);
        } catch (e) {
          this.logger.debug(`  staff[${i}] - failed to inspect`, e);
        }
      }

      // First try strict equality (existing behavior), then fall back to numeric comparison
      const matchStrict = cachedStaff.find((staff: any) => staff.relatedParticipantId && staff.relatedParticipantId === residentRecordId);
      if (matchStrict) {
        const resolvedId = (matchStrict.staffRecordId ?? matchStrict.userId) || 0;
        this.logger.log(`✅ MATCH FOUND (strict): Resident ID ${residentRecordId} matches staff "${matchStrict.displayName}" (resolvedId: ${resolvedId})`);
        return resolvedId;
      }

      // Try numeric coercion comparison to handle string/number mismatches
      const matchNumeric = cachedStaff.find((staff: any) => {
        try {
          const left = Number(staff.relatedParticipantId);
          const right = Number(residentRecordId);
          return !Number.isNaN(left) && !Number.isNaN(right) && left === right;
        } catch (e) {
          return false;
        }
      });

      if (matchNumeric) {
        const resolvedId = (matchNumeric.staffRecordId ?? matchNumeric.userId) || 0;
        this.logger.log(`✅ MATCH FOUND (numeric-coercion): Resident ID ${residentRecordId} matches staff "${matchNumeric.displayName}" (resolvedId: ${resolvedId})`);
        return resolvedId;
      }

      this.logger.log(`❌ NO MATCH: Resident ID ${residentRecordId} not found in Senior Staff list (after strict and numeric checks)`);
      return 0;
    }

    this.logger.warn(`⚠️ No cached activeStaff data available - returning 0`);
    return 0;
  }

  /**
   * Reset all login-specific authentication state. Called at the start of any
   * successful login and during logout so a subsequent login cannot inherit
   * stale role information from a different login path.
   */
  public resetAuthState(): void {
    this.userInfo = { houseName: '', staffId: '' };
    this.participantInfo = { email: '', recordId: 0, fullName: '', isStaff: false, staffRecordId: 0, timeClockEnabled: false };
    this.displayName = '';
    try { this.quickbaseService.currentStaffRole = ''; } catch (e) {}
    // Clear cached invoice payments on any login reset. Invoice payments are
    // house-specific; without this a participant's first payment view can use
    // stale data from a previous session, causing the listing to appear empty.
    try { this.quickbaseService.invoicePayments.next(null); } catch (e) {}
    try { sessionStorage.removeItem('HOMMA__MISSED_CLOCKOUT_ALERT'); } catch (e) {}
  }

  // Manual logout method
  public manualLogout() {
    this.resetAuthState();
    try { this.quickbaseService.clearAllCaches(); } catch (e) {}
    try { this.quickbaseService.clearLastResidentSearch(); } catch (e) {}
    try { this.router.navigate(['/login']); } catch (e) {}
  }

}