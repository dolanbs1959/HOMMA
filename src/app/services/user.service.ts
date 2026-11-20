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
   * Check whether a participant email belongs to a Senior Staff member.
   * Uses the cached activeStaff data from QuickbaseService, which only contains
   * Active (Staff fid 6) Senior Staff (fid 292) records. Matches the participant
   * email (Participant fid 177) against Staff Email (fid 306), both trimmed and
   * lowercased. Grants no privileges itself; callers use the returned staff
   * record ID for Senior Staff recognition and the Time Clock (fid 359) check.
   * @param participantEmail The participant's email address
   * @returns The staff record ID if found, or 0 if not a Senior Staff
   */
  checkIsSeniorStaff(participantEmail: string): number {
    const email = this.quickbaseService.normalizeEmail(participantEmail);
    if (!email) {
      this.logger.log('checkIsSeniorStaff: no participant email provided - returning 0');
      return 0;
    }

    const cachedStaff = this.quickbaseService.activeStaff.value;
    if (!cachedStaff || !Array.isArray(cachedStaff)) {
      this.logger.warn('No cached activeStaff data available - returning 0');
      return 0;
    }

    const matches = cachedStaff.filter((staff: any) => !!staff?.staffEmail && staff.staffEmail === email);
    if (matches.length === 0) {
      this.logger.log('checkIsSeniorStaff: no Senior Staff email match');
      return 0;
    }
    if (matches.length > 1) {
      this.logger.warn(`checkIsSeniorStaff: ${matches.length} Senior Staff records share this email; using the first`);
    }

    const resolvedId = Number(matches[0].staffRecordId ?? matches[0].userId) || 0;
    this.logger.log(`checkIsSeniorStaff: matched staff "${matches[0].displayName}" (staffRecordId: ${resolvedId})`);
    return resolvedId;
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
    try { this.quickbaseService.clearStaffRoleState(); } catch (e) {}
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