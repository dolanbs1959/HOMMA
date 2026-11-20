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

const staffRecord = (o: { rid: number; staffId: string; house: string; hl?: boolean; am?: boolean; email?: string; name?: string; status?: string }) => ({
  3: f(o.rid), 6: f(o.status || 'Active'), 71: f(o.hl ? 1 : 0), 102: f(o.staffId), 139: f(''), 225: f(''),
  295: f(!!o.am), 304: f(o.name || `Staff ${o.rid}`), 305: f('555-0100'), 306: f(o.email || ''), 372: f(o.house)
});

describe('Staff authentication (FID 71 / FID 295 / email matching)', () => {
  let qb: QuickbaseService;
  let userService: UserService;
  let calls: any[];

  function mockQuickbase(staff: any[], participants: any[] = []) {
    calls = [];
    spyOn(qb, 'callQuickbaseProxy').and.callFake((_m: string, _e: string, body: any) => {
      calls.push(body);
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

  const login = (house: string, staffId: string) => new Promise<any>(resolve => qb.query(house, staffId).subscribe(resolve));

  it('never selects deleted Staff FIDs and makes no Role Assignments query', async () => {
    mockQuickbase([]);
    await login('Alpha House', '100');
    const staffQuery = calls[0];
    [9, 10, 55, 93, 223].forEach(fid => expect(staffQuery.select).not.toContain(fid));
    [3, 6, 71, 295, 304, 305, 306, 372].forEach(fid => expect(staffQuery.select).toContain(fid));
    expect(calls.every(c => c.from === 'bs8cmihpr' || c.from === 'bjgvye6ni')).toBeTrue();
  });

  it('House Leader-only: own house via FID 71; Staff and Participant IDs kept separate', async () => {
    mockQuickbase(
      [staffRecord({ rid: 11, staffId: '100', house: 'Alpha House', hl: true, email: ' HL@Example.com ', name: 'Hal Leader' })],
      [{ 3: f(501), 177: f('hl@example.com') }]
    );
    const res = await login('Alpha House', '100');
    expect(res.HouseLeaderRecordId).toEqual(f(11));
    expect(res.HouseLeaderParticipantId).toEqual(f(501));
    expect(res.HouseLeaderName).toEqual(f('Hal Leader'));
    expect(res.theHouseName).toEqual(f('Alpha House'));
    expect(qb.isHouseLeaderSession).toBeTrue();
    expect(qb.isStaffSession).toBeFalse();
  });

  it('House Leader-only user cannot select another house', async () => {
    mockQuickbase([
      staffRecord({ rid: 11, staffId: '100', house: 'Alpha House', hl: true }),
      staffRecord({ rid: 12, staffId: '400', house: 'Beta House', hl: true })
    ]);
    expect(await login('Beta House', '100')).toBeNull();
  });

  it('authorized Staff (Active + FID 295) select any house as its House Leader record', async () => {
    mockQuickbase([
      staffRecord({ rid: 20, staffId: '200', house: 'HQ', am: true, name: 'Area Mgr' }),
      staffRecord({ rid: 12, staffId: '400', house: 'Beta House', hl: true })
    ]);
    const res = await login('Beta House', '200');
    expect(res.HouseLeaderRecordId).toEqual(f(12));
    expect(qb.sessionIsHouseLeader).toBeTrue();
    expect(qb.isStaffSession).toBeTrue();
    expect(qb.isHouseLeaderSession).toBeFalse();
    expect(qb.currentStaffName).toBe('Area Mgr');
  });

  it('Staff who are also House Leaders keep Staff privileges at another house', async () => {
    mockQuickbase([
      staffRecord({ rid: 11, staffId: '100', house: 'Alpha House', hl: true, am: true, name: 'HL Staff' }),
      staffRecord({ rid: 12, staffId: '400', house: 'Beta House', hl: true })
    ]);
    const res = await login('Beta House', '100');
    expect(res.HouseLeaderRecordId).toEqual(f(12));
    expect(qb.isStaffSession).toBeTrue();
    expect(qb.isHouseLeaderSession).toBeFalse();
    expect(qb.currentStaffName).toBe('HL Staff');
  });

  it('FID 295 on a non-Active Staff record grants nothing', async () => {
    mockQuickbase([
      staffRecord({ rid: 20, staffId: '200', house: 'HQ', am: true, status: 'Inactive' }),
      staffRecord({ rid: 12, staffId: '400', house: 'Beta House', hl: true })
    ]);
    expect(await login('Beta House', '200')).toBeNull();
    expect(qb.isStaffSession).toBeFalse();
  });

  it('other staff use their own record for the selected house without Staff privileges', async () => {
    mockQuickbase([
      staffRecord({ rid: 30, staffId: '300', house: 'Beta House' }),
      staffRecord({ rid: 12, staffId: '400', house: 'Beta House', hl: true })
    ]);
    const res = await login('Beta House', '300');
    expect(res.HouseLeaderRecordId).toEqual(f(30));
    expect(qb.isHouseLeaderSession).toBeFalse();
    expect(qb.isStaffSession).toBeFalse();
  });

  it('rejects unknown Staff IDs', async () => {
    mockQuickbase([staffRecord({ rid: 12, staffId: '400', house: 'Beta House', hl: true })]);
    expect(await login('Beta House', '999')).toBeNull();
  });

  it('leaves the Participant ID blank when the House Leader email matches several participants', async () => {
    mockQuickbase(
      [staffRecord({ rid: 11, staffId: '100', house: 'Alpha House', hl: true, email: 'dup@example.com' })],
      [{ 3: f(501), 177: f('dup@example.com') }, { 3: f(502), 177: f('DUP@example.com') }]
    );
    const res = await login('Alpha House', '100');
    expect(res.HouseLeaderRecordId).toEqual(f(11));
    expect(res.HouseLeaderParticipantId).toEqual(f(''));
  });

  describe('UserService Senior Staff (participant login)', () => {
    beforeEach(() => {
      // activeStaff cache is already limited to {6.EX.'Active'}AND{292.EX.'Yes'}
      qb.activeStaff.next([
        { userId: 41, displayName: 'Senior A', staffEmail: 'senior@example.com', timeClockEnabled: true },
        { userId: 42, displayName: 'Senior B', staffEmail: 'other@example.com', timeClockEnabled: false }
      ]);
    });

    it('matches on trimmed, lowercased email', () => {
      expect(userService.checkIsSeniorStaff('  Senior@Example.COM ')).toBe(41);
    });

    it('returns 0 for non-matching or empty email (participant-only access)', () => {
      expect(userService.checkIsSeniorStaff('participant@example.com')).toBe(0);
      expect(userService.checkIsSeniorStaff('')).toBe(0);
    });

    it('Time Clock follows FID 359', () => {
      expect(userService.checkTimeClockEnabled(41)).toBeTrue();
      expect(userService.checkTimeClockEnabled(42)).toBeFalse();
    });
  });
});
