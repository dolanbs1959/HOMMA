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
    staffRecordId: number 
  } = { email: '', recordId: 0, fullName: '', isStaff: false, staffRecordId: 0 };

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

  // Participant login info methods
  setParticipantInfo(email: string, recordId: number, fullName: string, isStaff: boolean = false, staffRecordId: number = 0) {
    this.participantInfo = { email, recordId, fullName, isStaff, staffRecordId };
  }

  getParticipantInfo() {
    return this.participantInfo;
  }

  isStaffUser(): boolean {
    return this.participantInfo.isStaff;
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

  // Manual logout method
  public manualLogout() {
    try { this.quickbaseService.clearAllCaches(); } catch (e) {}
    try { this.router.navigate(['/login']); } catch (e) {}
  }

}