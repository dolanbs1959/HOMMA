import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { ɵAngularFireSchedulers } from '@angular/fire';
import { FirebaseApp, provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { Functions, provideFunctions, getFunctions } from '@angular/fire/functions';
import { QuickbaseService } from './quickbase.service';
import { UserService } from './user.service';
import { environment } from '../../environments/environment';

const f = (value: any) => ({ value });

const staffRecord = (o: { rid: number; staffId: string; house: string; hl?: boolean; am?: boolean; email?: string; name?: string }) => ({
  3: f(o.rid), 6: f('Active'), 71: f(o.hl ? 1 : 0), 102: f(o.staffId), 139: f(''), 225: f(''),
  295: f(!!o.am), 304: f(o.name || `Staff ${o.rid}`), 305: f('555-0100'), 306: f(o.email || ''), 372: f(o.house)
});

describe('Staff authentication (Role Assignments / email matching)', () => {
  let qb: QuickbaseService;
  let userService: UserService;
  let calls: any[];

  function mockQuickbase(staff: any[], roleAssignments: any[], participants: any[]) {
    calls = [];
    spyOn(qb, 'callQuickbaseProxy').and.callFake((_m: string, _e: string, body: any) => {
      calls.push(body);
      if (body.from === environment.roleAssignmentsTableID) return of({ data: roleAssignments });
      if (body.from === 'bjgvye6ni') return of({ data: participants });
      return of({ data: staff });
    });
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        provideFirebaseApp(() => initializeApp(environment.firebase)),
        provideFunctions(() => getFunctions())
      ]
    });
    TestBed.inject(ɵAngularFireSchedulers);
    TestBed.inject(FirebaseApp);
    TestBed.inject(Functions);
    qb = TestBed.inject(QuickbaseService);
    userService = TestBed.inject(UserService);
    localStorage.clear();
  });

  it('never selects deleted Staff FIDs in the login query', () => {
    mockQuickbase([], [], []);
    qb.query('Alpha House', '100').subscribe();
    const staffQuery = calls[0];
    [9, 10, 55, 93, 223].forEach(fid => expect(staffQuery.select).not.toContain(fid));
    [3, 71, 304, 305, 306, 372].forEach(fid => expect(staffQuery.select).toContain(fid));
  });

  it('House Leader login: FID 71 flag, multiple active roles, Staff vs Participant IDs kept separate', (done) => {
    mockQuickbase(
      [staffRecord({ rid: 11, staffId: '100', house: 'Alpha House', hl: true, email: ' HL@Example.com ' })],
      [
        { 6: f('Active'), 10: f('House Leader'), 12: f(11) },
        { 6: f('Active'), 10: f('Driver'), 12: f(11) },
        { 6: f('Inactive'), 10: f('Area Manager'), 12: f(11) }
      ],
      [{ 3: f(501), 177: f('hl@example.com') }]
    );
    qb.query('Alpha House', '100').subscribe(res => {
      expect(res.HouseLeaderRecordId).toEqual(f(11));
      expect(res.HouseLeaderParticipantId).toEqual(f(501));
      expect(res.theHouseName).toEqual(f('Alpha House'));
      expect(qb.isHouseLeaderSession).toBeTrue();
      expect(qb.currentStaffRoles).toEqual(['House Leader', 'Driver']);
      expect(qb.hasNonHouseLeaderRole).toBeTrue();
      const raQuery = calls.find(c => c.from === environment.roleAssignmentsTableID);
      expect(raQuery.where).toBe('{12.EX.11}');
      done();
    });
  });

  it('House Leader with only the House Leader role gets no extra staff privileges', (done) => {
    mockQuickbase(
      [staffRecord({ rid: 11, staffId: '100', house: 'Alpha House', hl: true })],
      [{ 6: f('Active'), 10: f('House Leader'), 12: f(11) }],
      []
    );
    qb.query('Alpha House', '100').subscribe(res => {
      expect(res.HouseLeaderParticipantId).toEqual(f(''));
      expect(qb.hasNonHouseLeaderRole).toBeFalse();
      done();
    });
  });

  it('Area Manager operates as the house House Leader record but keeps own credential roles', (done) => {
    mockQuickbase(
      [
        staffRecord({ rid: 20, staffId: '200', house: 'HQ', am: true, name: 'Area Mgr' }),
        staffRecord({ rid: 11, staffId: '100', house: 'Alpha House', hl: true, email: 'hl@example.com' })
      ],
      [{ 6: f('Active'), 10: f('Area Manager'), 12: f(20) }],
      [{ 3: f(501), 177: f('HL@example.com') }]
    );
    qb.query('Alpha House', '200').subscribe(res => {
      expect(res.HouseLeaderRecordId).toEqual(f(11));
      expect(res.HouseLeaderParticipantId).toEqual(f(501));
      expect(qb.isHouseLeaderSession).toBeTrue();
      expect(qb.currentStaffName).toBe('Area Mgr');
      expect(qb.currentStaffRoles).toEqual(['Area Manager']);
      expect(calls.find(c => c.from === environment.roleAssignmentsTableID).where).toBe('{12.EX.20}');
      done();
    });
  });

  it('Regular staff only gets their own record for the selected house', (done) => {
    mockQuickbase(
      [
        staffRecord({ rid: 11, staffId: '100', house: 'Alpha House', hl: true }),
        staffRecord({ rid: 30, staffId: '300', house: 'Alpha House' })
      ],
      [], []
    );
    qb.query('Alpha House', '300').subscribe(res => {
      expect(res.HouseLeaderRecordId).toEqual(f(30));
      expect(qb.isHouseLeaderSession).toBeFalse();
      expect(qb.hasNonHouseLeaderRole).toBeFalse();
      done();
    });
  });

  it('rejects a staff ID with no record for the selected house', (done) => {
    mockQuickbase([staffRecord({ rid: 30, staffId: '300', house: 'Beta House' })], [], []);
    qb.query('Alpha House', '300').subscribe(res => {
      expect(res).toBeNull();
      done();
    });
  });

  it('does not resolve a Participant ID when the email matches several participants', (done) => {
    mockQuickbase(
      [staffRecord({ rid: 11, staffId: '100', house: 'Alpha House', hl: true, email: 'hl@example.com' })],
      [],
      [{ 3: f(501), 177: f('hl@example.com') }, { 3: f(502), 177: f('HL@example.com ') }]
    );
    qb.query('Alpha House', '100').subscribe(res => {
      expect(res.HouseLeaderParticipantId).toEqual(f(''));
      done();
    });
  });

  describe('UserService.checkIsSeniorStaff', () => {
    beforeEach(() => {
      qb.activeStaff.next([
        { userId: 41, displayName: 'Senior A', staffEmail: 'senior@example.com', timeClockEnabled: true },
        { userId: 42, displayName: 'Senior B', staffEmail: 'other@example.com', timeClockEnabled: false }
      ]);
    });

    it('matches on trimmed, lowercased email', () => {
      expect(userService.checkIsSeniorStaff('  Senior@Example.COM ')).toBe(41);
    });

    it('returns 0 for non-matching or empty email', () => {
      expect(userService.checkIsSeniorStaff('participant@example.com')).toBe(0);
      expect(userService.checkIsSeniorStaff('')).toBe(0);
    });
  });
});
