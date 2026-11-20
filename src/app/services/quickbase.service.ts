// src/app/services/quickbase.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, catchError, throwError, of, forkJoin, from, retryWhen, timer, finalize, shareReplay } from 'rxjs';
import { map, tap, switchMap, mergeMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { PhotoStorageService } from './photoProcessing.service';
import { getFunctions, httpsCallable } from '@angular/fire/functions';
import { connectFunctionsEmulator } from 'firebase/functions';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root',
})
export class QuickbaseService {
  private baseUrl = environment.baseUrl;
  private realm = environment.realm; //bobfaulk.quickbase.com
  private appId = environment.appId;//HOM app
  private queryStaffTableId = environment.queryStaffTableId; //Employee table
  private roleAssignmentsTableId = environment.roleAssignmentsTableID; // Role Assignments table
  private queryResidentTableId = environment.queryResidentTableId; //Resident table
  private apiKey = environment.apiKey;
  private QUICKBASE_URL = environment.QUICKBASE_URL; //URL for queries
  private qryObservationTableID = environment.qryObservationTableID;
  private observationsURL = environment.ObservationsURL;
  private ResidentUpdateTableID = environment.ResidentUpdateTableID;
  private ActivityTableID = environment.ActivityTableID;
  private AttendanceTableID = environment.AttendanceTableID;
  private StaffTasksTableID = environment.StaffTasksTableID;
  private qryMinistryHouseTableID = environment.qryMinistryHouseTableID;
  private transportationTableId = environment.transportationTableID; // replace with your actual table ID
  private trainingTableID = environment.trainingTableID;
  private classesTableId = environment.classesTableID;
  private registrationTableId = environment.registrationTableID;
  private communicationTableId = environment.communicationTableID;
  private announcementsTableId = environment.announcementsTableID;
  private invoicePaymentsTableId = environment.invoicePaymentsTableID;
  private jobBoardTableId = environment.jobBoardTableId;
  private staffTimeEntriesTableID = environment.staffTimeEntriesTableID; // Staff Time Entries table
  private staffTimePunchesTableID = environment.staffTimePunchesTableID; // Staff Time Punches table
  
  private errorMessage: BehaviorSubject<string> = new BehaviorSubject<string>('');
  errorMessage$: Observable<string> = this.errorMessage.asObservable();
  TaskRecordId: number = 0;
  STAalert: string = '';
  Alert: string = '';
  maxMeetingDate: string = '';
  theHouseName: string = '';
  HLphone: string = '';
  queryData: any;
  // Active Role Assignment names (Role Assignments FID 10) for the typed
  // credential's Staff record(s). A staff member may hold several roles.
  currentStaffRoles: string[] = [];
  // Whether the session record actually in use (finalRecord) is a House
  // Leader (Staff FID 71 = 1). For area managers the session record is the
  // house's House Leader record, so the session operates AS that House Leader
  // even though the credential isn't one.
  sessionIsHouseLeader: boolean = false;
  // Name of the staff member whose credential was typed (field 10 of the
  // requesting user's staff record). Differs from the session's
  // HouseLeaderName when an area manager logs into a house — used for
  // signature attribution (e.g. Stipulated Agreement).
  currentStaffName: string = '';

  // True when the authenticated session is operating as a House Leader.
  // Centralized so every consumer uses the same verified comparison.
  get isHouseLeaderSession(): boolean {
    return this.sessionIsHouseLeader === true;
  }

  // True when the typed credential holds at least one active role other than
  // House Leader (e.g. Area Manager). Gates staff-only House Leader Login
  // features such as the Stipulated Agreement. Fails closed when the Role
  // Assignments lookup returned nothing.
  get hasNonHouseLeaderRole(): boolean {
    return (this.currentStaffRoles || []).some(r => !!r && r.trim().toLowerCase() !== 'house leader');
  }

  // Reset all staff role/identity state captured at House Leader Login.
  clearStaffRoleState(): void {
    this.currentStaffRoles = [];
    this.sessionIsHouseLeader = false;
    this.currentStaffName = '';
    try { localStorage.removeItem('currentStaffRoles'); } catch (e) {}
    try { localStorage.removeItem('sessionIsHouseLeader'); } catch (e) {}
    try { localStorage.removeItem('currentStaffName'); } catch (e) {}
    // Legacy keys from the deleted Staff FID 93 role field
    try { localStorage.removeItem('currentStaffRole'); } catch (e) {}
    try { localStorage.removeItem('sessionStaffRole'); } catch (e) {}
  }
  isActivityAddedOnce = false;
  
  // Enhanced caching with BehaviorSubjects
  residentData = new BehaviorSubject<any>(null);
  pendingArrivals = new BehaviorSubject<any>(null);
  staffTasks = new BehaviorSubject<any>(null);
  // Reactive alert subjects so UI can subscribe to changes
  private _STAalert = new BehaviorSubject<string>('');
  STAalert$ = this._STAalert.asObservable();
  announcements = new BehaviorSubject<any>(null);
  activeStaff = new BehaviorSubject<any>(null);
  trainingRecords = new BehaviorSubject<any>(null);
  houseKPIs = new BehaviorSubject<any>(null); // Used to store all house data with KPIs
  transportRequests = new BehaviorSubject<any>(null); // Cached transport requests for house leaders
  locations = new BehaviorSubject<any>(null); // Cached locations (pickup/destination)
  invoicePayments = new BehaviorSubject<any>(null); // Cached invoice payment records for the current house
  openJobs = new BehaviorSubject<any>(null); // Cached open job board records
  
  // Simple session-based caching - no timers needed
  
  residentsSelections: any[] = [];
  staffRecordID: number = 0;
  // Shared in-flight StaffTasks request so concurrent subscribers never duplicate the API call
  private staffTasksRequest$: Observable<any> | null = null;

  // API call tracking for debugging
  private apiCallCount = 0;
  private cacheHitCount = 0;
  // Temporary in-memory cache for last resident search (to support back-navigation)
  private _lastResidentSearch: { query: string; results: any[]; selectedResident?: any; openOnReturn?: boolean } | null = null;

  private functions = getFunctions();
  private quickbaseProxy = httpsCallable(this.functions, 'quickbaseProxy');
  private getCurriculumCallable = httpsCallable(this.functions, 'getCurriculum');
  private reverseGeocodeCallable = httpsCallable(this.functions, 'reverseGeocode');

  constructor(
    private http: HttpClient,
    private photoStorageService: PhotoStorageService,
    private logger: LoggerService
  ) {
    // If running on localhost, connect the Functions instance to the emulator
    try {
      if (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost') {
        connectFunctionsEmulator(this.functions, 'localhost', 5001);
        this.logger.log('🔧 Connected QuickbaseService functions to localhost:5001 emulator');
      }
    } catch (e) {

    // Instrument BehaviorSubject.next for key caches so we catch any
    // direct `.next()` calls from other modules (intercepts overwrites).
    try {
      const wrapNext = (name: string, subj: BehaviorSubject<any>) => {
        if (!subj || !(subj instanceof BehaviorSubject)) return;
        const orig = subj.next.bind(subj);
        subj.next = (v: any) => {
          try {
            // debug logging disabled for intercepted next
          } catch (e) {}
          return orig(v);
        };
      };

      try { wrapNext('houseKPIs', this.houseKPIs); } catch (e) {}
      try { wrapNext('staffTasks', this.staffTasks); } catch (e) {}
    } catch (e) {}

  }

    this.logger.log('🚀 QuickbaseService initialized with enhanced caching and secure proxy');
    // Initialize STAalert subject with current value
    try { this._STAalert.next(this.STAalert || ''); } catch (e) {}

    // Restore the authenticated staff role so role-gated UI keeps working after
    // a reload/update restore (when query() does not re-run)
    try {
      const storedRoles = JSON.parse(localStorage.getItem('currentStaffRoles') || '[]');
      this.currentStaffRoles = Array.isArray(storedRoles) ? storedRoles.map((r: any) => String(r)) : [];
    } catch (e) { this.currentStaffRoles = []; }
    try { this.sessionIsHouseLeader = localStorage.getItem('sessionIsHouseLeader') === 'true'; } catch (e) {}
    try { this.currentStaffName = localStorage.getItem('currentStaffName') || ''; } catch (e) {}

    // Restore preserved app state after a reload if present.
    try {
      const preserved = sessionStorage.getItem('HOMMA__PRESERVED_STATE');
      if (preserved) {
        const parsed = JSON.parse(preserved);
        if (parsed && Array.isArray(parsed.residentData)) {
          // Before publishing restored residents, repair photo fields so we don't
          // display placeholder trimmed strings as image srcs. Prefer any
          // sessionStorage-saved `residentPhoto_{id}` or in-memory PhotoStorageService value.
          try {
            const repaired = (parsed.residentData || []).map((r: any) => {
              try {
                const copy = Object.assign({}, r);
                const rid = copy && (copy.recordNumber2?.value || copy.recordNumber || copy.residentIDnumber?.value);
                const photo = copy && copy.residentPhoto;
                // If the preserved snapshot contains the trimmed placeholder, attempt to restore from sessionStorage
                if (photo && typeof photo === 'string' && photo.startsWith('<base64 trimmed')) {
                  try {
                    const ss = sessionStorage.getItem(`residentPhoto_${rid}`);
                    if (ss) {
                      copy.residentPhoto = ss;
                      try { this.photoStorageService.setPhoto(String(rid), ss); } catch (e) {}
                    } else {
                      // remove invalid placeholder so template falls back to default image logic
                      copy.residentPhoto = undefined;
                    }
                  } catch (e) { copy.residentPhoto = undefined; }
                } else if (photo && typeof photo === 'string' && !photo.startsWith('data:') && !photo.startsWith('http')) {
                  // unknown non-data src; attempt to look up saved session copy
                  try {
                    const ss2 = sessionStorage.getItem(`residentPhoto_${rid}`);
                    if (ss2) {
                      copy.residentPhoto = ss2;
                      try { this.photoStorageService.setPhoto(String(rid), ss2); } catch (e) {}
                    }
                  } catch (e) {}
                }
                return copy;
              } catch (e) { return r; }
            });
              this.residentData.next(parsed.residentData);
            try {
              const len = repaired.length || 0;
              const sample = repaired.length > 0 ? repaired[0] : null;
              this.logger.log('Restored residentData from preserved state', { length: len, sample: sample ? Object.keys(sample).slice(0,10) : null });
              // restored residentData logging disabled
            } catch (e) {}
          } catch (e) {
            // Fallback to original publish if repair fails
            try { this.residentData.next(parsed.residentData); } catch (err) {}
          }
        }
        if (parsed && parsed.queryData) {
          this.queryData = parsed.queryData;
          this.logger.log('Restored queryData from preserved state');
        }
        // Restore pendingArrivals and staffTasks if present in preserved state
        try {
          if (parsed && parsed.pendingArrivals) {
            const pa = parsed.pendingArrivals;
            this.pendingArrivals.next(pa);
            try { /* restored pendingArrivals (logging disabled) */ } catch (e) {}
            this.logger.log('Restored pendingArrivals from preserved state');
          }
        } catch (e) {}
        try {
          if (parsed && parsed.staffTasks) {
              let st = parsed.staffTasks;
              // Normalize shape: accept either an array of tasks or an object with `.data`
              try {
                if (Array.isArray(st)) {
                  st = { data: st };
                } else if (st && st.data && !Array.isArray(st.data)) {
                  // ensure data is array
                  st.data = Array.isArray(st.data) ? st.data : [st.data];
                }
              } catch (e) {}
              this.publishCache('staffTasks', this.staffTasks, st);
              try { /* restored staffTasks (logging disabled) */ } catch (e) {}
              this.logger.log('Restored staffTasks from preserved state');
            }
        } catch (e) {}
        try { sessionStorage.removeItem('HOMMA__PRESERVED_STATE'); } catch (e) {}
        // If staffTasks wasn't included in the preserved snapshot, try restoring
        // a previously persisted staffTasks from sessionStorage (helps when
        // export ran before tasks were fetched).
        try {
          const raw = sessionStorage.getItem('HOMMA__STAFFTASKS');
          if (raw && !this.isCacheAvailable('staffTasks')) {
            try {
              const parsedTasks = JSON.parse(raw);
              if (parsedTasks) {
                try { this.publishCache('staffTasks', this.staffTasks, parsedTasks); } catch (e) { this.staffTasks.next(parsedTasks); }
                try { /* restored staffTasks from sessionStorage (logging disabled) */ } catch (e) {}
              }
            } catch (e) {}
          }
        } catch (e) {}
      }
    } catch (e) {}

    // Expose a lightweight state exporter so UpdateService can preserve
    // minimal UI state before forcing an update/reload.
    try {
      (window as any).HOMMA_exportState = () => {
        try {
          const sanitizeResident = (r: any) => {
            try {
              const copy: any = Object.assign({}, r);
              // Trim very large base64 photo strings to avoid massive preserved payloads
              if (copy && copy.residentPhoto && typeof copy.residentPhoto === 'string') {
                copy.residentPhoto = `<base64 trimmed ${copy.residentPhoto.length} chars>`;
              }
              return copy;
            } catch (e) { return r; }
          };

          const residents = Array.isArray(this.residentData.value) ? this.residentData.value.map(sanitizeResident) : (this.residentData.value || []);

          // Export a compact summary for staff tasks to avoid large payloads while
          // still preserving the list identity/count for a smooth restore.
          const rawStaff = this.staffTasks.value;
          let staffSummary: any = null;
          try {
            if (rawStaff) {
              if (Array.isArray(rawStaff)) {
                staffSummary = { dataLength: rawStaff.length };
              } else if (rawStaff.data && Array.isArray(rawStaff.data)) {
                staffSummary = { dataLength: rawStaff.data.length };
              } else {
                staffSummary = { info: typeof rawStaff };
              }
            }
          } catch (e) { staffSummary = null; }

          return {
            residentData: residents,
            queryData: this.queryData || null,
            pendingArrivals: this.pendingArrivals.value || [],
            staffTasks: staffSummary
          };
        } catch (e) { return null; }
      };
    } catch (e) {}
  }

  // Escape single quotes for Quickbase where clauses by doubling them
  private escapeForQuickbase(value: string): string {
    if (!value && value !== '') return value;
    return String(value).replace(/'/g, "''");
  }

  // Checkbox / numeric flag fields (e.g. Staff FID 71 House Leader = 1)
  private isQbFlagSet(field: any): boolean {
    const v = (field && typeof field === 'object' && 'value' in field) ? field.value : field;
    if (v === true || v === 1) return true;
    const str = String(v ?? '').trim().toLowerCase();
    return str === '1' || str === 'true' || str === 'yes';
  }

  // Emails are compared trimmed and lowercased
  public normalizeEmail(value: any): string {
    return this.normalizeFieldToString(value).trim().toLowerCase();
  }

  // Normalize various Quickbase field shapes into a display string
  public normalizeFieldToString(field: any): string {
    try {
      if (field === null || field === undefined) return '';
      if (typeof field === 'string') return field;
      if (typeof field === 'number' || typeof field === 'boolean') return String(field);
      if (typeof field === 'object') {
        if (Array.isArray(field)) {
          return field
            .map((item: any) => this.normalizeFieldToString(item))
            .filter((s: string) => s !== '')
            .join(', ');
        }
        if ('value' in field) {
          const inner = field.value;
          if (inner && typeof inner === 'object') return this.normalizeFieldToString(inner);
          return String(inner ?? '');
        }
        if ('display' in field) return String(field.display ?? '');
        if ('text' in field) return String(field.text ?? '');
        if ('name' in field) return String(field.name ?? '');
        if ('html' in field) return String(field.html ?? '');
        try { return JSON.stringify(field); } catch (e) { return String(field); }
      }
      return String(field);
    } catch (e) {
      return '';
    }
  }

  /**
   * Secure proxy method - calls Firebase Cloud Function instead of Quickbase directly
   * This keeps the API token server-side and never exposed to clients
   */
  public callQuickbaseProxy(method: string, endpoint: string, body?: any): Observable<any> {
    // Defensive logging of the outgoing payload
    let safeBody = '{}';
    try {
      safeBody = JSON.stringify(body || {});
      this.logger.debug(`Proxy Request -> method: ${method}, endpoint: ${endpoint}, body: ${safeBody}`);
    } catch (e) {
      this.logger.warn('Failed to stringify proxy body for logging', e);
    }

    return from(this.quickbaseProxy({ method, endpoint, body })).pipe(
      // Retry transient server errors (Quickbase 503 / functions/internal) with backoff
      retryWhen(errors => errors.pipe(
        mergeMap((err: any, i: number) => {
          const attempt = i + 1;
          const isTransient = (err && (err.code === 'functions/internal' || err.message?.includes('Quickbase API error') || err.status === 503));
          if (isTransient && attempt <= 2) {
            const waitMs = 500 * Math.pow(2, i); // 500ms, 1000ms
            this.logger.warn(`Transient proxy error detected — retrying attempt ${attempt} after ${waitMs}ms`, { attempt, waitMs, method, endpoint, err });
            return timer(waitMs);
          }
          this.logger.error('QuickbaseProxy non-transient error or retries exhausted', { attempt, method, endpoint, err, bodyPreview: safeBody.substring(0, 100) });
          return throwError(() => err);
        })
      )),
      map((result: any) => {
        // Normalize callable result shapes: firebase v2 wraps in `result`, v1 in `data`
        const payload = result?.data ?? result?.result ?? result;
        // If the proxy returned a structured failure, surface it as an error so retry/catchError run
        if (payload && payload.success === false) {
          const err = new Error(payload.error?.message || 'Quickbase proxy error');
          // attach details for logging
          (err as any).details = payload.error;
          throw err;
        }
        // Prefer the `data` field if present, else return the whole payload
        return payload?.data ?? payload;
      }),
      catchError(error => {
        try {
          this.logger.error('Quickbase Proxy Error - code:', (error && error.code) || 'N/A');
          this.logger.error('Quickbase Proxy Error - message:', (error && error.message) || 'N/A');
          this.logger.error('Quickbase Proxy Error - details:', (error && error.details) || error);
          this.logger.error('QuickbaseProxy ERROR', { method, endpoint, bodyPreview: safeBody.substring(0, 100), error });
        } catch (e) {
          this.logger.error('Quickbase Proxy Error (failed to extract details)', error);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Calls the getCurriculum Firebase function to securely download a QuickBase attachment.
   * Returns a base64 data object that the browser can open as a PDF.
   */
  public getCurriculum(recordId: string, fieldId: number = 161, fileName?: string): Promise<any> {
    this.logger.log('QuickbaseService.getCurriculum - calling function', { tableId: this.classesTableId, recordId, fieldId, fileName });
    return this.getCurriculumCallable({
      tableId: this.classesTableId,
      recordId,
      fieldId,
      fileName: fileName || 'curriculum.pdf'
    });
  }

  refreshAnnouncements(): Observable<any> {
  // Check if cached data is available
  if (this.isCacheAvailable('announcements')) {
    return this.announcements.asObservable();
  }
  
  this.trackApiCall('refreshAnnouncements');
  this.logger.log('Fetching fresh announcements from API');
  const body = {
    from: this.announcementsTableId,
    select: [3, 6],
    options: {
      skip: 0,
      top: 0,
      compareWithAppLocalTime: false
    }
  };
  return this.callQuickbaseProxy('POST', 'query', body).pipe(
    tap(response => {
      this.logger.debug('Announcements loaded successfully');
      // Update cache with fresh data
      this.announcements.next(response);
    })
  );
}

  // Utility: check whether a named BehaviorSubject cache has data
  isCacheAvailable(cacheKey: string): boolean {
    try {
      const subj: any = (this as any)[cacheKey];
      if (!subj || !(subj instanceof BehaviorSubject)) return false;
      const val = subj.value;
      if (val === null || val === undefined) return false;
      if (Array.isArray(val)) return val.length > 0;
      return true;
    } catch (e) {
      return false;
    }
  }

  // Helper to publish to a BehaviorSubject with diagnostics (stack + payload summary)
  private publishCache(cacheName: string, subj: BehaviorSubject<any>, value: any): void {
    try {
      const stack = (new Error(`publishCache:${cacheName} stack trace`)).stack || 'no-stack';
      try { this.logger.debug(`publishCache invoked for ${cacheName}`, { stack }); } catch (e) { /* suppressed console output */ }
      // Defensive: avoid overwriting restored UI caches with null/empty responses
      // for specific critical caches where a transient empty response would
      // cause a visible UI flash (residents/pendingArrivals are already stable).
      if (cacheName === 'houseKPIs') {
        try {
          const isEmptyArray = Array.isArray(value) && value.length === 0;
          const isEmptyData = value && Array.isArray(value.data) && value.data.length === 0;
          const isNullish = value === null || value === undefined;
          if (isNullish || isEmptyArray || isEmptyData) {
            try { this.logger.debug(`publishCache skipped for ${cacheName} because incoming value empty`, { isNullish, isEmptyArray, isEmptyData }); } catch (e) {}
            return;
          }
        } catch (e) {}
      }
      // payload summary
      try {
        if (!value) {
          // publishCache summary logging suppressed
        } else if (Array.isArray(value)) {
          // publishCache summary logging suppressed
        } else if (value.data && Array.isArray(value.data)) {
          // publishCache summary logging suppressed
        } else {
          // publishCache summary logging suppressed
        }
      } catch (e) {}
      subj.next(value);
      // Persist staffTasks to sessionStorage so it survives reload timing issues
      try {
        if (cacheName === 'staffTasks' && value) {
          try {
            const serial = JSON.stringify(value);
            try { sessionStorage.setItem('HOMMA__STAFFTASKS', serial); } catch (e) {}
            try { /* persisted staffTasks to sessionStorage (logging suppressed) */ } catch (e) {}
          } catch (e) {}
        }
      } catch (e) {}
    } catch (e) {
      try { subj.next(value); } catch (err) { this.logger.warn(`Failed to publish cache ${cacheName}`, err); }
    }
  }

  // Lightweight API call tracker for diagnostics
  trackApiCall(name: string): void {
    try {
      this.apiCallCount = (this.apiCallCount || 0) + 1;
      this.logger.debug('QuickbaseService API call', { name, count: this.apiCallCount });
    } catch (e) {}
  }

  // Last resident search helpers (support back-navigation UX)
  setLastResidentSearch(query: string, results: any[], selectedResident?: any, openOnReturn?: boolean): void {
    const selectedId = selectedResident?.recordNumber2?.value || selectedResident?.recordNumber || 'none';
    const selectedName = selectedResident?.residentFullName?.value || selectedResident?.residentFullName || selectedResident?.residentName || 'none';
    console.log('[Quickbase] setLastResidentSearch', { query, resultsCount: results?.length || 0, selectedId, selectedName, openOnReturn });
    this._lastResidentSearch = { query, results, selectedResident, openOnReturn };
  }

  getLastResidentSearch(): { query: string; results: any[]; selectedResident?: any; openOnReturn?: boolean } | null {
    return this._lastResidentSearch;
  }

  clearLastResidentSearch(): void {
    this._lastResidentSearch = null;
  }

  // Clear commonly used caches (used during logout / user switch)
  clearAllCaches(): void {
    try {
      const stack = (new Error('clearAllCaches stack trace')).stack || 'no-stack';
      try { this.logger.warn('clearAllCaches invoked', { stack: stack }); } catch (e) { /* suppressed console warn */ }

      this.residentData.next(null);
      this.pendingArrivals.next(null);
      this.publishCache('staffTasks', this.staffTasks, null);
      this.announcements.next(null);
      this.activeStaff.next(null);
      this.trainingRecords.next(null);
      this.publishCache('houseKPIs', this.houseKPIs, null);
      this.transportRequests.next(null);
      this.locations.next(null);
      this.invoicePayments.next(null);
      this.openJobs.next(null);
    } catch (e) {
      this.logger.warn('clearAllCaches failed', e);
    }
  }

  insertCommunication(data: any): Observable<any> {
    this.logger.log('Inserting communication record');
    // Sanitize string values to remove accidental whitespace
    const sanitizeRecord = (rec: any) => {
      const out: any = {};
      for (const k of Object.keys(rec)) {
        const entry = rec[k];
        if (entry && typeof entry.value === 'string') {
          out[k] = { value: entry.value.trim() };
        } else {
          out[k] = entry;
        }
      }
      return out;
    };

    const sanitized = sanitizeRecord(data);
    const body = {
      to: this.communicationTableId,
      data: [sanitized],
      fieldsToReturn: [3, 15]
    };
    this.logger.log('Communication payload:', body);
    try {
      const serialized = JSON.stringify(body);
      this.logger.log('QuickbaseService - serialized communication body length:', serialized.length);
      // log each field length inside the first data element for diagnosis
      const first = sanitized;
      Object.keys(first).forEach(k => {
        const entry = first[k];
        const str = entry && typeof entry.value === 'string' ? entry.value : JSON.stringify(entry);
        this.logger.log(`QuickbaseService - field ${k} length:`, (str || '').length);
      });
    } catch (e) {
      this.logger.warn('QuickbaseService - failed to serialize communication body for logging', e);
    }
    return this.callQuickbaseProxy('POST', 'records', body);
  }
  
  registerParticipant(classRecordId: string, participantId: string, transportationRequested: string): Observable<any> {
  const body = {
    to: this.registrationTableId,
    data: [
      {
        51: { value: classRecordId },
        56: { value: transportationRequested },
        16: { value: 'Registered' },
        47: { value: participantId }
      }
    ],
    fieldsToReturn: [3, 53] 
  };
  this.logger.debug('Registering participant');

  return this.callQuickbaseProxy('POST', 'records', body).pipe(
    tap(response => this.logger.debug('Registration successful'))
  );
}

  getClassesRecords(trainingRecordId: string): Observable<{ data: any[] }> {
    const body = {
    from: this.classesTableId, 
    select: [3, 7, 47, 40, 45, 62],
    where: `{44.EX.'${trainingRecordId}'}AND{40.EX.'Open'}AND{7.OAF.${new Date().toISOString().split('T')[0]}}`,
    options: {
    skip: 0,
    top: 0,
    compareWithAppLocalTime: false
      }
  };
    this.logger.debug('Requesting classes records');
 
     return this.callQuickbaseProxy('POST', 'query', body).pipe(
       map(data => {
         // QuickBase returns the records in the nested `data.data` property
         const records = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
         this.logger.debug('Classes loaded successfully');
         return { data: records };
       }),
       tap(response => this.logger.debug('Classes loaded successfully'))
     );
  }

  //Query to get classes a participant is registered for
  getRegisteredClasses(participantId: string): Observable<{ data: any[] }> {
    const escapedId = String(participantId || '').replace(/'/g, "\\'");
    const body = {
      from: this.registrationTableId,
      select: [3, 16, 47, 51],
      where: `{47.EX.'${escapedId}'}AND{16.EX.'Registered'}`,
      options: {
        skip: 0,
        top: 0,
        compareWithAppLocalTime: false
      }
    };
    this.logger.debug('Requesting registered classes for participant', participantId);

    return this.callQuickbaseProxy('POST', 'query', body).pipe(
      switchMap((regResponse: any) => {
        const regRecords = this.extractRecords(regResponse);
        if (regRecords.length === 0) {
          return of({ data: [] });
        }
        const classIds = regRecords
          .map((r: any) => String(this.getFieldValue(r, 51) ?? ''))
          .filter((id: string) => id !== '');
        if (classIds.length === 0) {
          const combined = regRecords.map((r: any) => this.enrichRegistration(r, new Map()));
          return of({ data: combined });
        }
        const classWhere = classIds
          .map(id => `{3.EX.'${id.replace(/'/g, "\\'")}'}`)
          .join('OR');
        const classBody = {
          from: this.classesTableId,
          select: [3, 7, 45, 47, 161],
          where: classWhere,
          options: {
            skip: 0,
            top: 0,
            compareWithAppLocalTime: false
          }
        };
        return this.callQuickbaseProxy('POST', 'query', classBody).pipe(
          map((classResponse: any) => {
            const classRecords = this.extractRecords(classResponse);
            const classMap = new Map<string, any>();
            classRecords.forEach((c: any) => {
              const id = String(this.getFieldValue(c, 3) ?? '');
              if (id) {
                classMap.set(id, c);
              }
            });
            const combined = regRecords.map((r: any) => this.enrichRegistration(r, classMap));
            this.logger.debug('Registered classes enriched successfully', { count: combined.length });
            return { data: combined };
          }),
          catchError(err => {
            this.logger.error('Error fetching class details for registered classes', err);
            const combined = regRecords.map((r: any) => this.enrichRegistration(r, new Map()));
            return of({ data: combined });
          })
        );
      }),
      catchError(error => {
        this.logger.error('Error fetching registered classes', error);
        return of({ data: [] });
      })
    );
  }

  private extractRecords(response: any): any[] {
    if (Array.isArray(response?.data?.data)) return response.data.data;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response)) return response;
    return [];
  }

  private getFieldValue(record: any, fid: any): any {
    const field = record?.[fid];
    if (field && typeof field === 'object' && 'value' in field) {
      return field.value;
    }
    return field;
  }

  private normalizeCurriculum(raw: any): any | null {
    if (!raw) return null;
    let fileName: string | null = null;
    let url: string | null = null;
    let hasFile = false;
    let attachment: any = null;

    if (typeof raw === 'object') {
      attachment = raw.value ?? raw;
      const inner = raw.value || raw;
      if (inner && typeof inner === 'object') {
        const versions = Array.isArray(inner.versions) ? inner.versions : [];
        const latestVersion = versions.reduce((latest: any, v: any) => {
          if (!v) return latest;
          return (!latest || (v.versionNumber || 0) > (latest.versionNumber || 0)) ? v : latest;
        }, null);
        fileName = latestVersion?.fileName || latestVersion?.filename || inner.fileName || inner.filename || inner.name || null;
        url = inner.url || inner.downloadUrl || null;
      }
      hasFile = !!(fileName || url || (typeof attachment === 'object' && Object.keys(attachment).length > 0));
    } else {
      hasFile = true;
      fileName = String(raw);
    }

    if (!hasFile) return null;
    return { hasFile, fileName, url, attachment, raw };
  }

  private getAttachmentUrl(tableId: string, recordId: string, fid: string, versionId: string = '0'): string {
    return `https://${this.realm}/up/${tableId}/a/r${recordId}/e${fid}/v${versionId}?usertoken=${this.apiKey}`;
  }

  private enrichRegistration(reg: any, classMap: Map<string, any>): any {
    const registrationId = this.getFieldValue(reg, 3) ?? '';
    const status = this.getFieldValue(reg, 16) ?? '';
    const classId = String(this.getFieldValue(reg, 51) ?? '');
    const classRecord = classMap?.get(classId) || null;

    const className = classRecord ? (this.getFieldValue(classRecord, 45) ?? '') : '';
    const classDate = classRecord ? (this.getFieldValue(classRecord, 7) ?? null) : null;
    const rawCurriculum = classRecord ? (this.getFieldValue(classRecord, 161) ?? null) : null;
    const curriculum = this.normalizeCurriculum(rawCurriculum);

    return {
      registrationId,
      status,
      classId,
      className,
      classDate,
      curriculum,
      hasCurriculum: !!curriculum,
      classRecord,
      registration: reg
    };
  }

  //Query to get available training modules
  getTrainingRecords(): Observable<{ data: any[] }> {
    // Check if cached data is available and actually contains records
    if (this.isCacheAvailable('trainingRecords')) {
      const cached = this.trainingRecords.value;
      if (cached && Array.isArray(cached.data) && cached.data.length > 0) {
        return this.trainingRecords.asObservable();
      }
    }
    
    this.trackApiCall('getTrainingRecords');
    this.logger.log('Fetching fresh training records from API');
    const body = {
      from: this.trainingTableID,
      select: [3, 7, 8, 12, 18],
      where: `{19.EX.'Elevate Academy'}AND{18.GT.0}AND{30.OAF.${new Date().toISOString().split('T')[0]}}`,
      sortBy: [
        {
          fieldId: 7,
          order: 'ASC'
        }
      ],
      options: {
        skip: 0,
        top: 0,
        compareWithAppLocalTime: false
      }
    };
  
    this.logger.debug('Requesting training modules');
  
    return this.callQuickbaseProxy('POST', 'query', body).pipe(
      map(data => {
        this.logger.debug('Training modules loaded successfully');
        return { data: data || [] };
      }),
      tap(mappedData => {
        // Update cache with mapped data
        this.trainingRecords.next(mappedData);
      }),
      catchError(error => {
        this.logger.error('Error fetching training records', error);
        return of({ data: [] });
      })
    );
  }

  //Query to get attendance record based on participantID and activityID
getStaffTasks(): Observable<any> {
  // Check if cached data is available. The cached value must contain an actual
  // task list — a restored state summary (e.g. {dataLength: n}) is not usable
  // and must trigger a fresh fetch so the counter is correct after a reload.
  const cached = this.staffTasks.value;
  const hasUsableCache = !!cached && (Array.isArray(cached) ? cached.length > 0 : Array.isArray(cached.data));
  if (hasUsableCache) {
    // Re-emit the counter so subscribers that attach after a restore/reload
    // (when _STAalert was reset to '') still get the correct count.
    const cachedCount = Array.isArray(cached) ? cached.length : cached.data.length;
    this.STAalert = `There are ${cachedCount} Staff Task Assignments Due`;
    try { this._STAalert.next(this.STAalert); } catch (e) {}
    return this.staffTasks.asObservable();
  }
  // If we don't yet have a valid staffRecordID, try to rehydrate from queryData or persisted session info
  const resolvedStaffId = this.staffRecordID || (this.queryData?.recordNumber?.value ?? this.queryData?.recordNumber) || Number(localStorage.getItem('savedRecordNumber')) || 0;
  if (!resolvedStaffId || resolvedStaffId === 0) {
    this.logger.warn('getStaffTasks: staffRecordID not yet available, skipping fetch to avoid empty overwrite');
    // Return the cached observable (may be null) without making the API call
    return this.staffTasks.asObservable();
  }

  // update staffRecordID to the resolved value for future calls
  this.staffRecordID = resolvedStaffId;

  // Reuse the in-flight request so concurrent callers (e.g. the login prefetch
  // and the Tasks page) share a single API call instead of duplicating it.
  if (this.staffTasksRequest$) {
    return this.staffTasksRequest$;
  }

  this.trackApiCall('getStaffTasks');
  this.logger.log('Fetching fresh staff tasks from API', { staffRecordID: this.staffRecordID });
  const body = {
    from: this.StaffTasksTableID,
    select: [3, 326, 32, 8, 36, 47, 15, 263, 313, 325],
    where: `{88.EX.${this.staffRecordID}}AND{32.EX.'House Leader'}AND{37.EX.'Active'}AND{41.EX.'Active'}AND{40.EX.'Active'}AND{326.EX.'Incomplete'}`,
    options: {
      skip: 0,
      top: 0,
      compareWithAppLocalTime: false
    }
  };
  this.logger.debug('Requesting staff tasks');
        // Log current cached value to help diagnose overwrites
        try {
          const cur = this.staffTasks.value;
          this.logger.debug('getStaffTasks - current staffTasks shape', { current: cur });
        } catch (e) {}

        // Show a loading message so the UI doesn't display a misleading zero
        // count while the request is in flight
        try {
          this.STAalert = 'Loading Staff Task Assignments...';
          this._STAalert.next(this.STAalert);
        } catch (e) {}

        const staffIdForRequest = resolvedStaffId;
        this.staffTasksRequest$ = this.callQuickbaseProxy('POST', 'query', body).pipe(
          tap(response => {
            // Discard the response if the logged-in staff record changed while
            // the request was in flight (e.g. logout then login as another user)
            if (String(this.staffRecordID) !== String(staffIdForRequest)) {
              this.logger.warn('getStaffTasks: staff record changed mid-flight, discarding stale response');
              return;
            }
            this.logger.debug('Staff tasks loaded successfully', { rawResponse: response });
            try { this.logger.debug('getStaffTasks - first raw task record', JSON.stringify(response?.data?.[0] ?? response?.[0] ?? null)); } catch (e) {}

            const incomingCount = (() => {
              try {
                if (!response) return 0;
                if (Array.isArray(response)) return response.length;
                if (response.data && Array.isArray(response.data)) return response.data.length;
                return 0;
              } catch (e) { return 0; }
            })();

            const currentCount = (() => {
              try {
                const cur = this.staffTasks.value;
                if (!cur) return 0;
                if (Array.isArray(cur)) return cur.length;
                if (cur.data && Array.isArray(cur.data)) return cur.data.length;
                return 0;
              } catch (e) { return 0; }
            })();

            this.logger.log('QuickbaseService - staffTasks incoming vs current', { incomingCount, currentCount });

            if (incomingCount === 0 && currentCount > 0) {
              this.logger.debug('getStaffTasks: incoming empty, preserving existing staffTasks cache');
              // Keep the counter consistent with the preserved cache rather than showing 0
              this.STAalert = `There are ${currentCount} Staff Task Assignments Due`;
              try { this._STAalert.next(this.STAalert); } catch (e) {}
              return;
            }

            // Set STAalert based on the incoming API count (reflect actual tasks due)
            try {
              if (typeof incomingCount === 'number') {
                this.STAalert = `There are ${incomingCount} Staff Task Assignments Due`;
                try { this._STAalert.next(this.STAalert); } catch (e) {}
              }
            } catch (e) {}

            this.publishCache('staffTasks', this.staffTasks, response);
          }),
          catchError(error => {
            this.logger.error('getStaffTasks failed', error);
            // Surface an honest "unavailable" message instead of a misleading zero count
            this.STAalert = 'Staff Task Assignments unavailable - reload to retry';
            try { this._STAalert.next(this.STAalert); } catch (e) {}
            return throwError(() => error);
          }),
          finalize(() => { this.staffTasksRequest$ = null; }),
          shareReplay({ bufferSize: 1, refCount: false })
        );
        return this.staffTasksRequest$;
}

getWeeklyMeetingTaskAssignment(): Observable<number | null> {
  const staffId = this.staffRecordID;
  if (!staffId) {
    this.logger.warn('getWeeklyMeetingTaskAssignment: staffRecordID not available');
    return of(null);
  }
  this.trackApiCall('getWeeklyMeetingTaskAssignment');
  const body = {
    from: this.StaffTasksTableID,
    select: [3],
    where: `{88.EX.${staffId}}AND{32.EX.'House Leader'}AND{37.EX.'Active'}AND{41.EX.'Active'}AND{40.EX.'Active'}AND{326.EX.'Incomplete'}AND{318.EX.4}`,
    options: {
      skip: 0,
      top: 0,
      compareWithAppLocalTime: false
    }
  };
  return this.callQuickbaseProxy('POST', 'query', body).pipe(
    map((response: any) => {
      const data = Array.isArray(response) ? response : (response?.data || []);
      if (!data.length) {
        this.logger.warn('getWeeklyMeetingTaskAssignment: no incomplete meeting task found');
        return null;
      }
      if (data.length > 1) {
        this.logger.warn('getWeeklyMeetingTaskAssignment: multiple matching tasks, using first', { count: data.length });
      }
      const raw = data[0]?.['3'];
      return raw?.value ?? raw ?? null;
    }),
    catchError(err => {
      this.logger.error('getWeeklyMeetingTaskAssignment query failed', err);
      return throwError(() => err);
    })
  );
}

markTaskAssignmentComplete(taskRecordId: number): Observable<any> {
  this.trackApiCall('markTaskAssignmentComplete');
  const body = {
    to: this.StaffTasksTableID,
    data: [{
      3: { value: taskRecordId },
      326: { value: 'Complete' },
      381: { value: new Date().toISOString().split('T')[0] }
    }],
    fieldsToReturn: [3, 326, 381]
  };
  return this.callQuickbaseProxy('POST', 'records', body);
}

clearStaffTasksCache(): void {
  try { sessionStorage.removeItem('HOMMA__STAFFTASKS'); } catch (e) {}
  this.staffTasks.next(null);
  this.staffTasksRequest$ = null;
}

insertActivity(activityData: any): Observable<any> {
  const body = {
    to: this.ActivityTableID, 
    data: [activityData],
    fieldsToReturn: [3, 89] 
  };
  return this.callQuickbaseProxy('POST', 'records', body).pipe(
    map((response: any) => {
      this.logger.debug('Activity inserted successfully', response);
      // Quickbase proxy may return field values as either an object with a `value`
      // property or as a raw primitive. Handle both shapes defensively.
      const first = response?.data?.[0] || {};
      const rawId = first?.['3'];
      const activityId = rawId && rawId.value !== undefined ? rawId.value : rawId;
      this.logger.debug('Resolved activityId', { activityId });
      return activityId;
    })
  );
}

  /**
   * Return the numeric value of field 94 (number of Attendance Records) for an Activity record
   */
  getActivityAttendanceCount(activityId: any): Observable<number> {
    this.trackApiCall('getActivityAttendanceCount');
    this.logger.debug('Querying Activity for attendance count', { activityId });
    const body = {
      from: this.ActivityTableID,
      select: [3, 94],
      where: `{3.EX.'${activityId}'}`,
      options: { skip: 0, top: 0, compareWithAppLocalTime: false }
    };

    return of(0);
  }

  /**
   * Create multiple attendance records in a single batch call.
   * `records` should be an array of objects where keys are field IDs and values are { value: ... } shapes.
   */
  createAttendanceRecordsBulk(records: any[]): Observable<any> {
    if (!Array.isArray(records) || records.length === 0) {
      this.logger.warn('createAttendanceRecordsBulk called with empty records array');
      return of([]);
    }
    this.trackApiCall('createAttendanceRecordsBulk');
    const body = {
      to: this.AttendanceTableID,
      data: records,
      fieldsToReturn: [3, 9, 38, 11]
    };
    this.logger.debug('Creating attendance records in bulk', { count: records.length });
    return this.callQuickbaseProxy('POST', 'records', body).pipe(
      tap(resp => this.logger.debug('Bulk create attendance response', resp)),
      catchError(err => {
        this.logger.error('Error creating attendance records in bulk', err);
        return throwError(() => err);
      })
    );
  }

          //Query to get attendance record based on participantID and activityID
          getAttendance(participantId: string, activityId: number): Observable<any> {
                    this.logger.debug('Querying attendance record');
            // Implement the logic to fetch a record from the AttendanceTableID
            const body = {
              from: this.AttendanceTableID, // replace with your actual table ID
              select: [3, 10, 11, 7, 38], // replace with your actual field IDs
              where: `{9.EX.'${participantId}'}AND{38.EX.'${activityId}'}`, 
              options: {
                skip: 0,
                top: 0,
                compareWithAppLocalTime: false
              }
            };

                    // Log the outgoing query body for debugging
                    try { this.logger.debug('getAttendance - query body', body); } catch (e) {}

                    return this.callQuickbaseProxy('POST', 'query', body).pipe(
                      tap((resp: any) => {
                        try { this.logger.debug('getAttendance - proxy response', resp); } catch (e) {}
                      })
                    );
            
          }
          //Update attendance record retrieved from getAttendance
          updateAttendance(attendanceIdValue: any, updatedAttendanceData: any): Observable<any> {
            this.logger.debug('Updating attendance record');
            // Implement the logic to update a record in the AttendanceTableID
            const url = this.baseUrl;
            const body = {
              to: this.AttendanceTableID, // replace with your actual table ID
              data: [
              {
                "3": { "value": attendanceIdValue }, // Include the attendanceId in the data array
                ...updatedAttendanceData
              }
            ],
              fieldsToReturn: [3, 11, 7] // replace with your actual field IDs
            };
            
            return this.callQuickbaseProxy('POST', 'records', body);
    
          }


  residentupdate(data: any): Observable<any> {
    this.logger.debug('Inserting resident update');

    const body = {
      to: this.ResidentUpdateTableID,
      data: [data],
      fieldsToReturn: [3, 15]
    };
    return this.callQuickbaseProxy('POST', 'records', body);
  }

  insertTransportationRequest(data: any): Observable<any> {
    this.logger.debug('Inserting transportation request');

    const body = {
      to: this.transportationTableId,
      data: [data],
      fieldsToReturn: [3, 31, 35, 6, 7, 8, 9, 42]
    };
    return this.callQuickbaseProxy('POST', 'records', body).pipe(
      tap(response => {
        this.logger.debug('Transportation request inserted');
      }),
      catchError(error => {
        this.logger.error('Error inserting transportation request', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get transport requests for a house (status Open or Scheduled).
   * Uses in-memory cache (session) to reduce API calls; updates BehaviorSubject when fetched.
   */
  getTransportationRequests(houseName?: string): Observable<{ data: any[] }> {
    // Use simple cache check
    if (this.isCacheAvailable('transportRequests')) {
      return this.transportRequests.asObservable();
    }

    this.trackApiCall('getTransportationRequests');
    this.logger.log(`Fetching transportation requests${houseName ? ' for house: ' + houseName : ' (all houses)'}`);

    const escapedHouse = houseName ? this.escapeForQuickbase(houseName) : null;
    const whereClause = escapedHouse
      ? `{50.EX.'${escapedHouse}'}AND({7.EX.'Open'}OR{7.EX.'Scheduled'})`
      : `({7.EX.'Open'}OR{7.EX.'Scheduled'})`;

    const body = {
      from: this.transportationTableId,
      select: [3, 6, 7, 8, 9, 23, 31, 35, 42, 50, 51],
      where: whereClause,
      sortBy: [
        {
          fieldId: 6,
          order: 'ASC'
        }
      ],
      options: {
        skip: 0,
        top: 0,
        compareWithAppLocalTime: false
      }
    };
    // Ensure we have locations cached (will fetch if cache miss)
    return this.getLocations().pipe(
      switchMap((locations: any[]) =>
        this.callQuickbaseProxy('POST', 'query', body).pipe(
          map((response: any) => {
            const dataArray = response?.data || [];
            // Map to friendly structure and resolve pickup/destination names
            const mapped = dataArray.map((r: any) => {
              const pickupId = r['31']?.value || r['31'];
              const destinationId = r['35']?.value || r['35'];
              const pickup = (locations || []).find((l: any) => l.id === pickupId || l.id == pickupId);
              const destination = (locations || []).find((l: any) => l.id === destinationId || l.id == destinationId);

              return {
                id: r['3']?.value || r['3'],
                dateRequested: r['6']?.value || r['6'],
                status: r['7']?.value || r['7'],
                purpose: r['8']?.value || r['8'],
                participantId: r['9']?.value || r['9'],
                notes: r['23']?.value || r['23'],
                pickupId: pickupId,
                pickupName: pickup ? pickup.name : (pickupId || ''),
                destinationId: destinationId,
                destinationName: destination ? destination.name : (destinationId || ''),
                requestedBy: r['42']?.value || r['42'],
                houseName: r['50']?.value || r['50'],
                houseLeaderName: r['51']?.value || r['51']
              };
            });

            return { data: mapped };
          }),
          tap(mapped => {
            this.logger.debug('Transportation requests loaded successfully');
            this.transportRequests.next(mapped);
          }),
          catchError(error => {
            this.logger.error('Error fetching transportation requests', error);
            return of({ data: [] });
          })
        )
      )
    );
  }

  /**
   * Get all transportation records for a single resident.
   */
  getTransportationRecordsForResident(participantId: string): Observable<{ data: any[] }> {
    this.trackApiCall('getTransportationRecordsForResident');
    const escapedParticipantId = this.escapeForQuickbase(String(participantId));

    const body = {
      from: this.transportationTableId,
      select: [3, 6, 7, 8, 9, 23, 31, 35, 42, 50, 51, 62, 63, 64, 65],
      where: `{9.EX.'${escapedParticipantId}'}`,
      sortBy: [
        {
          fieldId: 6,
          order: 'DESC'
        }
      ],
      options: {
        skip: 0,
        top: 0,
        compareWithAppLocalTime: false
      }
    };

    return this.getLocations().pipe(
      switchMap((locations: any[]) =>
        this.callQuickbaseProxy('POST', 'query', body).pipe(
          map((response: any) => {
            const dataArray = response?.data || [];
            const mapped = dataArray.map((r: any) => {
              const pickupId = this.parseNumberOrNull(r['31']);
              const destinationId = this.parseNumberOrNull(r['35']);
              const pickup = (locations || []).find((l: any) => l.id === pickupId || l.id == pickupId);
              const destination = (locations || []).find((l: any) => l.id === destinationId || l.id == destinationId);
              const startTime = this.normalizeFieldToString(r['62']);
              const endTime = this.normalizeFieldToString(r['63']);
              const beginningMileage = this.parseNumberOrNull(r['64']);
              const endingMileage = this.parseNumberOrNull(r['65']);

              return {
                id: this.normalizeFieldToString(r['3']),
                dateRequested: this.normalizeFieldToString(r['6']),
                status: this.normalizeFieldToString(r['7']),
                purpose: this.normalizeFieldToString(r['8']),
                participantId: this.normalizeFieldToString(r['9']),
                notes: this.normalizeFieldToString(r['23']),
                pickupId,
                pickupName: pickup ? pickup.name : (pickupId !== null ? String(pickupId) : ''),
                destinationId,
                destinationName: destination ? destination.name : (destinationId !== null ? String(destinationId) : ''),
                requestedBy: this.parseNumberOrNull(r['42']),
                houseName: this.normalizeFieldToString(r['50']),
                houseLeaderName: this.normalizeFieldToString(r['51']),
                startTime,
                endTime,
                beginningMileage,
                endingMileage,
                travelTime: this.calculateTravelTime(startTime, endTime),
                distance: this.calculateMileageDistance(beginningMileage, endingMileage)
              };
            });
            return { data: mapped };
          }),
          catchError(error => {
            this.logger.error('Error fetching transportation records for resident', error);
            return of({ data: [] });
          })
        )
      )
    );
  }

  /**
   * Convert a Quickbase numeric field to a number, or null if empty.
   */
  private parseNumberOrNull(field: any): number | null {
    const str = this.normalizeFieldToString(field);
    if (str === '' || str === null || str === undefined) { return null; }
    const n = Number(str);
    return Number.isNaN(n) ? null : n;
  }

  /**
   * Parse a Quickbase time-of-day value to total minutes from midnight.
   */
  private parseTimeOfDayToMinutes(value: any): number | null {
    const str = this.normalizeFieldToString(value);
    if (!str) { return null; }
    const match = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
    if (!match) { return null; }
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[4] ? match[4].toUpperCase() : '';
    if (ampm) {
      if (ampm === 'PM' && hours !== 12) { hours += 12; }
      if (ampm === 'AM' && hours === 12) { hours = 0; }
    }
    return (hours * 60) + minutes;
  }

  /**
   * Calculate travel time display string from two time-of-day values.
   */
  private calculateTravelTime(start: string, end: string): string {
    if (!start || !end) { return ''; }
    const startMinutes = this.parseTimeOfDayToMinutes(start);
    const endMinutes = this.parseTimeOfDayToMinutes(end);
    if (startMinutes === null || endMinutes === null) { return ''; }
    let duration = endMinutes - startMinutes;
    if (duration < 0) { duration += 24 * 60; }
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours} hrs ${minutes} mins`;
  }

  /**
   * Calculate mileage distance display string from two numeric values.
   */
  private calculateMileageDistance(begin: number | null, end: number | null): string {
    if (begin === null || end === null) { return ''; }
    const distance = end - begin;
    return `${distance < 0 ? 0 : distance} miles`;
  }

  /**
   * Update an existing transportation record (FID 3 identifies the record).
   */
  updateTransportationRecord(recordId: number, data: any): Observable<any> {
    this.logger.debug('Updating transportation record', { recordId, data });
    const body = {
      to: this.transportationTableId,
      data: [
        {
          3: { value: recordId },
          ...data
        }
      ],
      fieldsToReturn: [3, 6, 7, 8, 9, 23, 31, 35, 42, 50, 51, 62, 63, 64, 65]
    };
    return this.callQuickbaseProxy('POST', 'records', body).pipe(
      tap(response => {
        this.logger.debug('Transportation record updated', response);
      }),
      catchError(error => {
        this.logger.error('Error updating transportation record', error);
        return throwError(() => error);
      })
    );
  }

  // Fetch and cache locations table (pickup/destination names)
  getLocations(): Observable<any[]> {
    if (this.isCacheAvailable('locations')) {
      return this.locations.asObservable();
    }

    this.trackApiCall('getLocations');
    const body = {
      from: environment.locationTableID,
      select: [3, 7, 9, 6]
    };

    return this.callQuickbaseProxy('POST', 'query', body).pipe(
      map((response: any) => {
        const dataArray = response?.data || [];
        const mapped = dataArray.map((r: any) => ({
          id: r[3]?.value || r[3],
          name: r[7]?.value || r[7],
          address: r[9]?.value || r[9],
          type: r[6]?.value || r[6]
        }));
        return mapped;
      }),
      tap(mapped => {
        this.locations.next(mapped);
        this.logger.debug('Locations cached');
      }),
      catchError(error => {
        this.logger.error('Error fetching locations', error);
        return of([]);
      })
    );
  }

  observationreport(data: any): Observable<any> {
    this.logger.debug('Inserting observation report');

    const body = {
      to: this.qryObservationTableID,
      data: [data],
      fieldsToReturn: [3, 194, 59]
    };
    return this.callQuickbaseProxy('POST', 'records', body);
  }
//method to upload photo from Observation report to the record in Quickbase
  uploadFile(recordId: string, base64String: string) {
    const endpoint = `records/${this.qryObservationTableID}/${recordId}/fields/59/files`;
    const body = {
      "version": 1,
      "file": base64String
    };

    return this.callQuickbaseProxy('POST', endpoint, body);
  }

  //Login to Quickbase and query the Staff table to return the HL and House name.
  //
  // Staff FIDs (after removal of the Staff -> Participants relationship):
  //   3 = Staff Record ID, 6 = Staff Status, 71 = House Leader (1 = yes),
  //   102 = Staff ID (credential), 139 = Alert, 225 = STA alert,
  //   295 = Area Manager, 304 = Name, 305 = Phone, 306 = Email,
  //   372 = House Name (formula query).
  // Roles come from the Role Assignments table (see getActiveStaffRoles).
  query(housename: string, staffID: string): Observable<any> {
    this.logger.debug('Querying staff access');

    // Staff task assignments are house- and staff-specific. Flush the cache
    // at the start of the house/staff query so the Tasks page fetches fresh
    // data for the newly selected house instead of reusing the previous cache.
    // Clearing staffRecordID also guarantees any late-arriving response from a
    // previous user's in-flight request is discarded instead of published.
    // The stored staff roles are reset too so a new login can't inherit the
    // previous user's roles if authentication fails partway through.
    try {
      this.staffTasks.next(null);
      this.staffTasksRequest$ = null;
      this.staffRecordID = 0;
      this.clearStaffRoleState();
    } catch (e) {}

    this.logger.debug('Login attempt - housename/staffID', { housename, staffID });

    const typedStaffID = String(staffID ?? '').trim();
    const selectedHouse = String(housename ?? '').trim();
    const staffIdOf = (r: any) => this.normalizeFieldToString(r?.['102']).trim();
    const houseOf = (r: any) => this.normalizeFieldToString(r?.['372']).trim();
    const isHouseLeaderRecord = (r: any) => this.isQbFlagSet(r?.['71']);
    const isAreaManagerRecord = (r: any) => !!r && (r['295'] === true || r['295']?.value === true || r['295'] === 'Yes');

    // Single API call to get all active staff records with house and area manager info
    const body = {
      from: this.queryStaffTableId,
      select: [3, 6, 71, 102, 139, 225, 295, 304, 305, 306, 372],
      where: `{6.XEX.'Closed'}`, // Get all non-closed staff records
      options: {
        skip: 0,
        top: 0,
        compareWithAppLocalTime: false
      }
    };

    return this.callQuickbaseProxy('POST', 'query', body).pipe(
      map((response: any) => {
        this.logger.debug('Staff query response received');

        if (!response.data || response.data.length === 0) {
          this.logger.debug('No staff records found');
          return { finalRecord: null, credentialRecords: [] };
        }

        const allStaffRecords = response.data;
        this.logger.debug(`Cached ${allStaffRecords.length} staff records`);

        // All Staff records belonging to the typed credential
        const credentialRecords = typedStaffID
          ? allStaffRecords.filter((r: any) => staffIdOf(r) === typedStaffID)
          : [];

        // Filter based on house and staff access logic
        const matchingRecords = allStaffRecords.filter((record: any) => {
          const recordStaffID = staffIdOf(record);

          // Always include the area manager's own record
          if (typedStaffID && recordStaffID === typedStaffID && isAreaManagerRecord(record)) {
            this.logger.debug('Found area manager record');
            return true;
          }

          if (houseOf(record) !== selectedHouse) {
            return false;
          }

          // For house-specific records, include:
          // 1. House Leader records for the requested house
          // 2. Regular staff records that match the requesting staffID
          return isHouseLeaderRecord(record) || (!!typedStaffID && recordStaffID === typedStaffID);
        });

        this.logger.debug(`Matching records found: ${matchingRecords.length}`);

        // For area managers, prioritize house leader records, otherwise use their own record
        let finalRecord = null;
        if (matchingRecords.length > 0) {
          const userRecord = credentialRecords[0];
          const isUserAreaManager = credentialRecords.some((r: any) => isAreaManagerRecord(r));

          if (isUserAreaManager) {
            // Area manager: prefer house leader record for this house
            const houseLeaderRecord = matchingRecords.find((r: any) => isHouseLeaderRecord(r) && houseOf(r) === selectedHouse);

            if (houseLeaderRecord) {
              finalRecord = houseLeaderRecord;
              this.logger.debug('Area manager accessing house leader record');
            } else {
              // Fallback to any house leader record if no specific house match
              const anyHouseLeader = matchingRecords.find((r: any) => isHouseLeaderRecord(r));
              finalRecord = anyHouseLeader || userRecord;
              this.logger.debug('Using fallback record');
            }
          } else {
            // Regular staff: use their own record for this house
            finalRecord = matchingRecords.find((r: any) => staffIdOf(r) === typedStaffID) || null;
            this.logger.debug('Regular staff accessing own record');
          }
        }

        if (finalRecord) {
          // QuickBase records use field '3' as the record ID, ensure it's properly structured
          if (!finalRecord.recordNumber && finalRecord['3']) {
            finalRecord.recordNumber = finalRecord['3'];
          } else if (!finalRecord.recordNumber && !finalRecord['3']) {
            this.logger.error('Record missing field 3 (record ID)');
            throw new Error('Invalid record structure - missing record ID in field 3');
          }
          this.logger.debug('Final record selected successfully');
        }

        // Capture the authenticated user's name (field 304) so signatures
        // attribute the agreement to the person who logged in rather than
        // the session's House Leader record.
        const requestingUserRecord = credentialRecords.find((r: any) => houseOf(r) === selectedHouse) || credentialRecords[0];
        this.currentStaffName = requestingUserRecord ? (this.normalizeFieldToString(requestingUserRecord['304']) || '') : '';
        try { localStorage.setItem('currentStaffName', this.currentStaffName || ''); } catch (e) {}

        // Session House Leader status comes from the record actually selected
        // for this session (finalRecord). For area managers this is the house's
        // House Leader record.
        this.sessionIsHouseLeader = !!finalRecord && isHouseLeaderRecord(finalRecord);
        try { localStorage.setItem('sessionIsHouseLeader', String(this.sessionIsHouseLeader)); } catch (e) {}

        return { finalRecord, credentialRecords };
      }),
      switchMap(({ finalRecord, credentialRecords }: any) => {
        if (!finalRecord) {
          this.logger.error('No matching records found');
          this.errorMessage.next('No authorization found for this staff ID and house combination.');
          return of(null);
        }

        const recordNumber = finalRecord['3'];
        if (recordNumber === undefined) {
          this.logger.error('Record number not found in processed response');
          this.errorMessage.next('This Staff ID is not active! Please re-enter and try again.');
          return of(null);
        }

        const credentialRecordIds: number[] = (credentialRecords || [])
          .map((r: any) => Number(r['3']?.value ?? r['3']))
          .filter((id: number) => Number.isFinite(id) && id > 0);

        // Roles: active Role Assignments for the credential's Staff record(s).
        // Communication FID 26 needs the House Leader's Participant record ID,
        // resolved by matching Staff Email (306) to Participant Email (177).
        return forkJoin({
          roles: this.getActiveStaffRoles(credentialRecordIds),
          participantId: this.getParticipantRecordIdByEmail(finalRecord['306'])
        }).pipe(
          map(({ roles, participantId }) => {
            this.currentStaffRoles = roles;
            try { localStorage.setItem('currentStaffRoles', JSON.stringify(roles)); } catch (e) {}

            this.logger.debug('Processing staff record');
            this.staffRecordID = recordNumber.value || recordNumber; // Store for other functions

            // Store values for service state (normalize alert fields to strings)
            this.STAalert = this.normalizeFieldToString(finalRecord['225']) || '';
            try { this._STAalert.next(this.STAalert); } catch (e) {}
            this.Alert = this.normalizeFieldToString(finalRecord['139']) || '';

            return {
              'recordNumber': recordNumber,
              'theHouseName': { value: houseOf(finalRecord) },
              'HouseLeaderName': finalRecord['304'],
              // Staff Record ID (FID 3) of the session's House Leader record;
              // Transport FID 42 (Requested By) references Staff.
              'HouseLeaderRecordId': recordNumber,
              // Participant Record ID of the session's House Leader (email match);
              // Communication FID 26 references Participant.
              'HouseLeaderParticipantId': { value: participantId || '' },
              'HLphone': finalRecord['305'],
              'STAalert': finalRecord['225'],
              'Alert': finalRecord['139']
            };
          })
        );
      }),
      catchError(error => {
        this.logger.error('Error during Quickbase query', error);
        this.errorMessage.next('Error querying Quickbase');
        return throwError(error);
      })
    );
  }

  /**
   * Active role names for the given Staff record IDs.
   * Role Assignments table: FID 12 = Related Staff (Staff FID 3),
   * FID 9 = Related Role, FID 10 = Role (name), FID 6 = RA Status.
   * Returns a de-duplicated list; an empty list on failure (fails closed).
   */
  getActiveStaffRoles(staffRecordIds: number[]): Observable<string[]> {
    const ids = Array.from(new Set((staffRecordIds || []).filter(id => Number.isFinite(id) && id > 0)));
    if (ids.length === 0) {
      return of([]);
    }

    const body = {
      from: this.roleAssignmentsTableId,
      select: [3, 6, 9, 10, 12],
      where: ids.map(id => `{12.EX.${id}}`).join('OR'),
      options: {
        skip: 0,
        top: 0,
        compareWithAppLocalTime: false
      }
    };

    return this.callQuickbaseProxy('POST', 'query', body).pipe(
      map((response: any) => {
        const roles = (response?.data || [])
          .filter((r: any) => this.normalizeFieldToString(r['6']).trim().toLowerCase() === 'active')
          .map((r: any) => this.normalizeFieldToString(r['10']).trim())
          .filter((name: string) => !!name);
        const unique: string[] = Array.from(new Set<string>(roles));
        this.logger.debug('Active staff roles resolved', { count: unique.length });
        return unique;
      }),
      catchError(error => {
        this.logger.error('Failed to load staff role assignments', error);
        return of([]);
      })
    );
  }

  /**
   * Resolve a Participant Record ID (FID 3) by email (Participant FID 177).
   * Emails are compared trimmed + lowercased. Returns null when there is no
   * match or the match is ambiguous.
   */
  getParticipantRecordIdByEmail(emailField: any): Observable<number | null> {
    const email = this.normalizeEmail(emailField);
    if (!email) {
      return of(null);
    }

    const body = {
      from: this.queryResidentTableId,
      select: [3, 177],
      where: `{177.CT.'${this.escapeForQuickbase(email)}'}`,
      options: {
        skip: 0,
        top: 0,
        compareWithAppLocalTime: false
      }
    };

    return this.callQuickbaseProxy('POST', 'query', body).pipe(
      map((response: any) => {
        const ids: number[] = Array.from(new Set<number>((response?.data || [])
          .filter((r: any) => this.normalizeEmail(r['177']) === email)
          .map((r: any) => Number(r['3']?.value ?? r['3']))
          .filter((id: number) => Number.isFinite(id) && id > 0)));
        if (ids.length !== 1) {
          this.logger.warn('Participant lookup by staff email did not resolve to a single record', { matches: ids.length });
          return null;
        }
        return ids[0];
      }),
      catchError(error => {
        this.logger.error('Participant lookup by email failed', error);
        return of(null);
      })
    );
  }

  // postData method removed - functionality moved to query() method which now uses secure proxy   

  getResidentsByEmail(email: string, password: string): Observable<any> {
    this.logger.log(`getResidentsByEmail called with email: "${email}"`);
    
    const body = {
      from: this.queryResidentTableId,
      select: [3, 692, 31, 24, 40, 72, 116, 177, 131, 132, 135, 141, 564, 576, 150, 442, 296, 275, 7, 340, 53, 439, 90, 441, 448, 477, 655, 693, 694, 695, 699, 700, 705, 706, 789, 790, 797, 798, 897],
      where: `{177.EX.'${email}'}`,// Query by email only first, password validated in login.page.ts
      options: {
        skip: 0,
        top: 0,
        compareWithAppLocalTime: false
      }
    };
    
    this.logger.log(`Query WHERE clause: {177.EX.'${email}'}`);
    
    return this.postData2(body);
  }


getResidents(savedRecordNumber: number | { value: number }): Observable<any> {
  const actualRecordNumber = typeof savedRecordNumber === 'number' ? savedRecordNumber : savedRecordNumber.value; // Use the value property if savedRecordNumber is an object
  this.logger.debug('Fetching residents');

  const body = {
    from: this.queryResidentTableId,
    select: [
      3, 692, 14, 31, 24, 40, 72, 116, 177, 131, 132, 133, 135, 141,
      564, 576, 150, 442, 296, 275, 7, 340, 53, 439, 90, 441, 448, 477,
      655, 693, 694, 695, 699, 700, 705, 706, 789, 790, 797, 798, 897
    ],
    where: `{692.EX.${actualRecordNumber}}AND{349.EX.'Active'}`,
    options: {
      skip: 0,
      top: 0,
      compareWithAppLocalTime: false
    }
  };

  return this.postData2(body);
}

  /**
   * Search residents by full name (field 72) — returns mapped resident objects
   */
  searchResidentsByName(name: string, top: number = 50, houseName?: string): Observable<any[]> {
    this.trackApiCall('searchResidentsByName');
    const escaped = this.escapeForQuickbase(name || '');
    const escapedHouse = houseName ? this.escapeForQuickbase(houseName) : null;
    const whereName = `{72.CT.'${escaped}'}AND{349.XEX.'In-Active'}AND{349.XEX.''}`;
    const whereWithHouse = escapedHouse ? `{275.EX.'${escapedHouse}'}AND{72.CT.'${escaped}'}AND{349.XEX.'In-Active'}AND{349.XEX.''}` : whereName;
    const body = {
      from: this.queryResidentTableId,
      select: [
        3, 692, 14, 31, 24, 40, 72, 116, 177, 131, 132, 133, 135, 141,
        564, 576, 150, 442, 296, 275, 7, 340, 53, 439, 90, 441, 448, 477,
        655, 693, 694, 695, 699, 700, 705, 706, 789, 790, 797, 798, 897
      ],
      where: whereWithHouse,
      options: {
        skip: 0,
        top: top,
        compareWithAppLocalTime: false
      }
    };

    return this.postData2(body);
  }
 
postData2(body: any): Observable<any[]> {
  this.logger.debug('Executing query via proxy');
  return this.callQuickbaseProxy('POST', 'query', body).pipe(
    switchMap((response2: any): Observable<any[]> => {
      this.logger.debug('Query response received');
      // Support both shapes returned by the proxy: { data: [...] } or [...]
      const dataArray = Array.isArray(response2) ? response2 : (response2?.data || []);
      if (!Array.isArray(dataArray) && dataArray) {
        this.logger.warn('postData2 - unexpected dataArray shape, coercing to array', { dataArray });
      }
      try {
        const len = Array.isArray(dataArray) ? dataArray.length : 0;
        this.logger.debug(`postData2 - received data array length: ${len}`);
        if (len > 0 && dataArray[0]) {
          this.logger.debug('postData2 - sample record keys:', Object.keys(dataArray[0]));
        }
      } catch (e) {
        this.logger.warn('postData2 - failed to inspect response data', e);
      }
      if (!dataArray || dataArray.length === 0) {
        this.logger.debug('No data found in the response');
        return of([]);
      }

      const mapped = dataArray.map((record: any) => {
        const residentPhotoHtml = record['40']?.value;
        const residentPhotoUrl = residentPhotoHtml ? this.extractImageUrl(residentPhotoHtml) : 'assets/default-pic/defaultPhoto.png';
        return {
          residentIDnumber: record['3'],
          recordNumber2: record['3'],
          residentPhoto: residentPhotoUrl,
          residentFullName: record['72'],
          residentBedStart: record['564'],
          residentPhone: record['31'],
          residentEmail: record['177'],
          residentDOB: record['116'],
          residentDOCstatus: record['14'],
          residentCCOfirst: record['131'],
          residentCCOlast: record['132'],
          residentCCOemail: record['133'],
          residentCCOphone: record['135'],
          residentCCOmobile: record['141'],
          residentAge: record['576'],
          SOLevel: record['150'],
          Room: record['442'],
          Bed: record['296'],
          ParticipantStatus: record['7'],
          FeesDueFirstofMonth: record['340'],
          PastDueFees: record['53'],
          WorkStatus: record['439'],
          ActivePayplans: record['90'],
          FinancialStatus: record['441'],
          Last1on1Date: record['477'],
          houseName: record['275'],
          houseLeaderName: record['693'],
          houseLeaderPhone: record['694'],
          houseLeaderRecordId: record['692'],
          houseLeaderEmail: record['695'],
          AreaMgrName: record['699'],
          AreaMgrPhone: record['700'],
          CareMgrName: record['705'],
          CareMgrPhone: record['706'],
          ProgMgrName: record['797'],
          ProgMgrPhone: record['798'],
          ProgDirName: record['789'],
          ProgDirPhone: record['790'],
          residentPassword: record['897']
        };
      });

      // Prefetch Quickbase-hosted images via the secure callable proxy and cache them
      const fetches = mapped.map((m: any) => {
        try {
          const url = m.residentPhoto;
          if (typeof url === 'string' && url.includes(this.realm) && url.startsWith('http')) {
            return this.callQuickbaseProxy('GET', url).pipe(
              map((imgData: any) => {
                // callQuickbaseProxy will return base64 for binary responses thanks to the function change
                m.residentPhoto = imgData || m.residentPhoto;
                try {
                  const id = (m.recordNumber2 && (m.recordNumber2.value || m.recordNumber2)) || '';
                  if (id) this.photoStorageService.setPhoto(String(id), m.residentPhoto);
                } catch (e) {}
                return m;
              }),
              catchError(() => of(m))
            );
          }
        } catch (e) {
          // fall through
        }
        return of(m);
      });

      return (forkJoin(fetches) as unknown as Observable<any[]>).pipe(
        map(results => results || [])
      );
    }),
    catchError(error => {
      this.logger.error('Error fetching residents', error);
      return of([]);
    })
  );
}

private extractImageUrl(html: string): string | null {
  const match = html.match(/src="([^"]+)"/);
  if (!match) return null;
  let url = match[1];
  // Normalize protocol-relative URLs
  if (url.startsWith('//')) {
    url = `https:${url}`;
  }
  // If URL is root-relative (starts with '/') or missing scheme, make it absolute against the Quickbase realm
  if (url.startsWith('/')) {
    url = `https://${this.realm}${url}`;
  } else if (!/^https?:\/\//i.test(url)) {
    // If it lacks a protocol (e.g. 'up/...'), prefix with realm
    url = `https://${this.realm}/${url.replace(/^\/+/, '')}`;
  }
  return url;
}

/**
 * Fetch the staff member's photo from the Staff table.
 * Staff FID 307 ("Photo New") is a rich text field that renders the photo stored
 * in FID 308 ("Photo", file attachment). Prefer the rendered <img> URL from 307;
 * fall back to 308's file attachment URL. The image is downloaded through the
 * secure proxy and cached in PhotoStorageService under a `staff_`-prefixed key
 * so it can't collide with participant record IDs.
 */
getStaffPhoto(staffRecordId: number | string): Observable<string | null> {
  const id = String(staffRecordId ?? '').trim();
  if (!id || id === '0') {
    return of(null);
  }

  const cacheKey = `staff_${id}`;
  const cached = this.photoStorageService.getPhoto(cacheKey);
  if (cached) {
    return of(cached);
  }

  const body = {
    from: this.queryStaffTableId,
    select: [3, 307, 308],
    where: `{3.EX.${id}}`,
    options: {
      skip: 0,
      top: 0,
      compareWithAppLocalTime: false
    }
  };

  return this.callQuickbaseProxy('POST', 'query', body).pipe(
    switchMap((response: any) => {
      const record = response?.data?.[0];
      if (!record) {
        return of(null);
      }

      const richText = record['307']?.value ?? record['307'];
      let url = (typeof richText === 'string') ? this.extractImageUrl(richText) : null;

      if (!url) {
        const attachment = record['308']?.value ?? record['308'];
        const attachmentUrl = (attachment && typeof attachment === 'object' && attachment.url)
          ? attachment.url
          : (typeof attachment === 'string' ? attachment : null);
        if (attachmentUrl) {
          // File attachment URLs come back root-relative ("/files/..."); make absolute
          url = attachmentUrl.startsWith('http')
            ? attachmentUrl
            : `https://${this.realm}${attachmentUrl.startsWith('/') ? '' : '/'}${attachmentUrl}`;
        }
      }

      if (!url) {
        return of(null);
      }

      return this.callQuickbaseProxy('GET', url).pipe(
        map((imgData: any) => {
          const photo = imgData || null;
          if (photo) {
            try { this.photoStorageService.setPhoto(cacheKey, photo); } catch (e) {}
            try { sessionStorage.setItem(`residentPhoto_${cacheKey}`, photo); } catch (e) {}
          }
          return photo;
        }),
        catchError(() => of(null))
      );
    }),
    catchError(error => {
      this.logger.warn('getStaffPhoto failed', error);
      return of(null);
    })
  );
}

//Convert the photo file to base64
// downloadAndConvertToBase64(fileUrl: string, recordId: string): Observable<string> {
//   const urlParts = fileUrl.split('/');
//   const dbid = urlParts[2];
//   const rid = urlParts[3];
//   const fid = urlParts[4];
//   const vid = urlParts[5] || '0'; // Use '0' to get the most recent version if VID is not provided
//   const url = `https://${this.realm}/up/${dbid}/a/r${rid}/e${fid}/v${vid}?usertoken=${this.apiKey}`;
//   // const url = `api/up/${dbid}/a/r${rid}/e${fid}/v${vid}?usertoken=${this.apiKey}`;
//   // const url = `https://corsproxy.io/up/${dbid}/a/r${rid}/e${fid}/v${vid}?usertoken=${this.apiKey}`;
//   const headers = this.getHeaders();
//   // console.log('Downloading file from URL:', url);
//   // console.log('Using headers:', headers.keys()); // Log the header keys to verify they are set

//   return this.http.get(url, { responseType: 'arraybuffer', headers }).pipe(
//     switchMap(response => {
//       // console.log('File downloaded successfully:', response);
//       const blob = new Blob([response], { type: 'image/jpeg' });
//       return this.resizeImage(blob, 100, 100); // Resize to 100x100 pixels
//     }),
//     map(base64 => {
//       // console.log('File converted to base64:', base64);
//       this.photoStorageService.setPhoto(recordId, base64);
//       return base64;
//     }),
//     catchError(error => {
//       // console.error('Error downloading file:', error);
//       // console.error('Response status:', error.status);
//       // console.error('Response body:', error.error);
//       return of(''); // Return an empty string if there's an error
//     })
//   );
// }
// Resize the image using a canvas element
// resizeImage(blob: Blob, width: number, height: number): Observable<string> {
//   return new Observable<string>(observer => {
//     const reader = new FileReader();
//     reader.onload = (event: any) => {
//       const img = new Image();
//       img.onload = () => {
//         const canvas = document.createElement('canvas');
//         canvas.width = width;
//         canvas.height = height;
//         const ctx = canvas.getContext('2d');
//         if (ctx) {
//           ctx.drawImage(img, 0, 0, width, height);
//         } else {
//           // console.error('Failed to get 2D context');
//         }
//         const base64 = canvas.toDataURL('image/jpeg');
//         observer.next(base64);
//         observer.complete();
//       };
//       img.src = event.target.result;
//     };
//     reader.onerror = error => observer.error(error);
//     reader.readAsDataURL(blob);
//   });
// }

//Query to get all pending new arrivals in the house
getPendingArrivals(savedRecordNumber: number | { value: number }): Observable<any> {
  const actualRecordNumber = typeof savedRecordNumber === 'number' ? savedRecordNumber : savedRecordNumber.value; // Use the value property if savedRecordNumber is an object
  this.logger.debug('Fetching pending arrivals');

  const body = {
  from: this.queryResidentTableId,
  select: [3, 692, 72, 116, 576, 150, 191, 7],
  where: `{692.EX.${actualRecordNumber}}AND{7.CT.'Pending New Arrival'}`,
  options: {
    skip: 0,
    top: 0,
    compareWithAppLocalTime: false
  }
};
this.logger.debug('Requesting pending arrivals via proxy');
return this.postDataForPendingArrivals(body);
}

  // Diagnostic wrapper for when pendingArrivals is next'ed from login
  public publishPendingArrivals(data: any) {
    try {
      const len = Array.isArray(data) ? data.length : (data ? 1 : 0);
      this.logger.log('QuickbaseService - pendingArrivals populated', { length: len });
      this.logger.debug('publishPendingArrivals length', { length: len });
    } catch (e) {}
    try {
      const incomingLen = Array.isArray(data) ? data.length : (data ? 1 : 0);
      const current = this.pendingArrivals.value;
      const currentLen = Array.isArray(current) ? current.length : (current ? 1 : 0);
      // If the incoming payload is empty but we already have cached items, keep the cache
      if (incomingLen === 0 && currentLen > 0) {
        this.logger.debug('publishPendingArrivals: incoming empty, preserving existing cache');
        return;
      }
    } catch (e) {}

    this.pendingArrivals.next(data);
  }

postDataForPendingArrivals(body: any) {
  return this.callQuickbaseProxy('POST', 'query', body).pipe(
    map((response: any) => {
      this.logger.debug('Pending arrivals response received');
      const dataArray = response.data;
      if (dataArray && dataArray.length > 0) {
        return dataArray.map((record: any) => ({
          'recordNumber2': record['3'],
          'residentFullName': record['72'],
          'residentDOB': record['116'],
          'residentAge': record['576'],
          'SOLevel': record['150'],
          'ParticipantStatus': record['7'],
          'PRD': record['191']
          // Add other fields as needed
        }));
      } else {
        return [];
      }
    })
  );
}

getMaxMeetingDate(houseName: string): Observable<any> {
  const escapedHouse = this.escapeForQuickbase(houseName);
  const body = {
    from: this.AttendanceTableID,
    select: [3, 40, 18, 51],
    where: `{18.EX.'${escapedHouse}'}AND{39.CT.'House Meeting'}AND{40.XEX.null}AND{51.XCT.'Incomplete'}`,
    sortBy: [
      {
        fieldId: 40,
        order: 'DESC'
      }
    ],
    options: {
      skip: 0,
      top: 1,
      compareWithAppLocalTime: false
    }
  };

    // Log the outgoing body for debugging the last-meeting query
    try { this.logger.debug('getMaxMeetingDate - query body', body); } catch (e) {}

    return this.callQuickbaseProxy('POST', 'query', body).pipe(
      tap((resp: any) => {
        try { this.logger.debug('getMaxMeetingDate - proxy response', resp); } catch (e) {}
      })
    );
}

getInvoicePayments(houseName: string): Observable<any> {
  const escapedHouse = this.escapeForQuickbase(houseName);
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const body = {
    from: this.invoicePaymentsTableId,
    select: [3, 6, 7, 15, 19, 28, 42],
    where: `{42.EX.'${escapedHouse}'}AND{6.OAF.${cutoff}}`,
    options: {
      skip: 0,
      top: 0,
      compareWithAppLocalTime: false
    }
  };

  return this.callQuickbaseProxy('POST', 'query', body).pipe(
    tap((response: any) => {
      const data = response?.data || [];
      this.invoicePayments.next(data);
    })
  );
}

getInvoicePaymentsForResident(residentId: string | number): Observable<any> {
  const id = String(residentId || '');
  if (!id) {
    return of([]);
  }
  const escapedId = this.escapeForQuickbase(id);
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const body = {
    from: this.invoicePaymentsTableId,
    select: [3, 6, 7, 15, 19, 28, 42],
    where: `{28.EX.'${escapedId}'}AND{6.OAF.${cutoff}}`,
    options: {
      skip: 0,
      top: 0,
      compareWithAppLocalTime: false
    }
  };

  return this.callQuickbaseProxy('POST', 'query', body).pipe(
    map((response: any) => response?.data || [])
  );
}


getDropdownChoices(): Observable<any> {
  const endpoint = `fields?tableId=${this.qryObservationTableID}`;
  return this.callQuickbaseProxy('GET', endpoint);
}


getHouseNames(): Observable<any> {
  const body = {
    from: this.qryMinistryHouseTableID,
    select: [
      10,  // House Name
      47,  // Active Beds
      294, // Occupied Beds
      577, // Arrivals last 30 Days
      581, // Departures last 30 Days
      837, // Active Clients over 210 days
      529, // Active Clients under 210 days
      843, // Current Month Participant 1-on-1s
      962, // All Client Observations this month
      840, // Negative Client Observations this month
      753, // All-time Client Observations
      854, // House Meetings Last 7 days
      838, // Present at Meeting (last 30 days)
      839  // Absent at Meeting (last 30 days)
    ],
    where: `({69.CT.'Voucher'}OR{69.CT.'vacating'})`, // only houses with a status containing 'Voucher' or 'vacating'
    sortBy: [
      {
        fieldId: 10,
        order: 'ASC'
      }
    ],
    options: {
      skip: 0,
      top: 0,
      compareWithAppLocalTime: false
    }
  };

  return this.callQuickbaseProxy('POST', 'query', body).pipe(
    tap(response => {
      this.logger.debug('🏠 House names response received');
    }),
    map(response => {
      // Transform the data - handle both array and object formats
      const dataArray = Array.isArray(response) ? response : (response.data || []);
      const houseData = dataArray.map((record: any) => ({
        houseName: record['10']?.value || '',
        activeBeds: record['47']?.value || 0,
        occupiedBeds: record['294']?.value || 0,
        arrivalsLast30Days: record['577']?.value || 0,
        departuresLast30Days: record['581']?.value || 0,
        activeClientsOver210Days: record['837']?.value || 0,
        activeClientsUnder210Days: record['529']?.value || 0,
        currentMonthOneOnOnes: record['843']?.value || 0,
        allObservationsThisMonth: record['962']?.value || 0,
        negativeObservationsThisMonth: record['840']?.value || 0,
        allTimeObservations: record['753']?.value || 0,
        houseMeetingsLast7Days: record['854']?.value || 0,
        presentAtMeetingLast30Days: record['838']?.value || 0,
        absentAtMeetingLast30Days: record['839']?.value || 0
      }));
      
      // Cache the house data for KPI lookups
      const incomingCount = Array.isArray(houseData) ? houseData.length : 0;
      const currentCount = (() => {
        try {
          const cur = this.houseKPIs.value;
          if (!cur) return 0;
          if (Array.isArray(cur)) return cur.length;
          return 0;
        } catch (e) { return 0; }
      })();

      // If the fresh response is empty but we already have cached KPI data,
      // preserve the existing cache instead of overwriting with an empty set.
      if (incomingCount === 0 && currentCount > 0) {
        this.logger.debug('getHouseNames: incoming empty, preserving existing houseKPIs cache', { incomingCount, currentCount });
      } else {
        this.publishCache('houseKPIs', this.houseKPIs, houseData);
        this.logger.debug('🏠 House data with KPIs cached successfully');
      }
      
      // Return both house names for dropdown AND full house data with KPIs
      return {
        houseNames: dataArray.map((record: any) => record['10'].value),
        houseData: houseData
      };
    })
    ,
    catchError(err => {
      this.logger.error('getHouseNames failed - returning empty list', err);
      this.logger.error('getHouseNames proxy error, returning empty lists', { err });
      return of({ houseNames: [], houseData: [] });
    })
  );
}

// Get KPI data for a specific house from the cached house data
getHouseKPIsByName(houseName: string): any {
  // First check if we have cached house data
  const cachedHouseData = this.houseKPIs.value;
  if (cachedHouseData && Array.isArray(cachedHouseData)) {
    const houseData = cachedHouseData.find((house: any) => house.houseName === houseName);
    if (houseData) {
      this.logger.debug('🏠 Found KPI data for house');
      return houseData;
    }
  }
  
  this.logger.warn('🏠 No KPI data found for requested house');
  return null;
}

// Clear house KPI cache (useful for logout or data refresh)
clearHouseKPICache(): void {
  this.publishCache('houseKPIs', this.houseKPIs, null);
  this.logger.log('🏠 House KPI cache cleared');
}

getActiveStaff(): Observable<any> {
  // Check if cached data is available
  if (this.isCacheAvailable('activeStaff')) {
    this.logger.log('📋 getActiveStaff - returning cached data');
    return this.activeStaff.asObservable();
  }
  
  this.trackApiCall('getActiveStaff');
  this.logger.log('Fetching fresh active staff from API');
  const body = {
    from: this.queryStaffTableId,
    // Include additional fields that may contain email or identifiers (best-effort)
    // fid 3 = Staff Record ID, 102 = Staff ID, 118 = User, 301 = Feedback Role,
    // 304 = Name, 305 = Phone, 306 = Staff Email, 359 = Time Clock (HOMMA)
    select: [3, 102, 118, 139, 301, 304, 305, 306, 359],
    where: `{6.EX.'Active'}AND{292.EX.'Yes'}`, //fields for Staff Status; Senior Staff
    sortBy: [
      {
        fieldId: 3,
        order: 'ASC'
      }
    ],
    options: {
      skip: 0,
      top: 0,
      compareWithAppLocalTime: false
    }
  };

  return this.callQuickbaseProxy('POST', 'query', body).pipe(
    tap(response => {
      this.logger.debug('Active staff RAW API response:', response);
      this.logger.log(`Active staff records returned: ${response?.data?.length || 0}`);
    }),
    map(response => {
      const renameMap: Record<string, string> = {
        'barry dolan': 'Database Administrator'
      };
      const exclusions = ['faulk'];

      // Build mapped records with prioritized email extraction
      const mapped = (response.data || []).map((record: any) => {
        let email: string | null = null;

        // 1) Prefer email from the dedicated user field (fid 118) when present
        try {
          const uf = record['118'] || record[118];
          const ufVal = uf && (uf.value ?? uf);
          if (ufVal) {
            if (Array.isArray(ufVal)) {
              for (const entry of ufVal) {
                if (entry && typeof entry === 'object' && entry.email) {
                  email = String(entry.email).trim();
                  break;
                }
                if (typeof entry === 'string' && /@.+\./.test(entry)) {
                  email = entry.trim();
                  break;
                }
              }
            } else if (typeof ufVal === 'object') {
              if (ufVal.email) {
                email = String(ufVal.email).trim();
              } else if (ufVal.name && /@.+\./.test(String(ufVal.name))) {
                email = String(ufVal.name).trim();
              }
            } else if (typeof ufVal === 'string' && /@.+\./.test(ufVal)) {
              email = ufVal.trim();
            }
          }
        } catch (e) {
          // ignore and fall back to heuristic
        }

        // 2) Fallback: Staff Email (fid 306)
        if (!email) {
          const staffEmail = this.normalizeFieldToString(record['306']).trim();
          if (staffEmail) email = staffEmail;
        }

        // 3) Fallback: scan all returned fields for any email-like string
        if (!email) {
          try {
            for (const key of Object.keys(record)) {
              const v = record[key];
              const val = v && (v.value ?? v);
              if (typeof val === 'string' && /@.+\./.test(val)) {
                email = val.trim();
                break;
              }
            }
          } catch (e) {}
        }

        const tc359 = record['359'];
        const timeClockEnabled = tc359 === true || tc359?.value === true || tc359 === 'Yes' || tc359?.value === 'Yes';

        return {
          raw: record,
          userId: record['3']?.value,
          displayName: record['304']?.value,
          feedbackRole: (record['301'] && (record['301'].value ?? record['301'])) || null,
          // Normalized Staff Email (fid 306) used to recognize Senior Staff at participant login
          staffEmail: this.normalizeEmail(record['306']),
          staffId: record['102']?.value || record['102'],
          timeClockEnabled,
          email
        };
      });

      // Apply global filtering and renames (case-insensitive)
      const processed = mapped
        .filter((s: any) => {
          const name = (s.displayName || '').toLowerCase().trim();
          return !exclusions.some(token => name.includes(token));
        })
        .map((s: any) => {
          const name = (s.displayName || '').trim();
          const lname = name.toLowerCase();
          return {
            userId: s.userId,
            displayName: renameMap[lname] || name,
            feedbackRole: s.feedbackRole || null,
            staffEmail: s.staffEmail,
            staffId: s.staffId,
            timeClockEnabled: !!s.timeClockEnabled,
            email: s.email
          };
        });

      processed.forEach((p: any) => this.logger.debug(`  Mapped staff: userId=${p.userId}, displayName="${p.displayName}", email=${p.email}`));
      return processed;
    }),
    tap(mappedData => {
      // Update cache with mapped data
      this.logger.log(`📋 Caching ${mappedData.length} active staff records`);
      this.activeStaff.next(mappedData);
    })
  );
}

  /**
   * Query and cache open job board records. Returns the cached array on
   * subsequent calls, ensuring the Job Board page does not trigger a new
   * QuickBase request.
   */
  getOpenJobs(): Observable<any[]> {
    if (this.isCacheAvailable('openJobs')) {
      this.logger.log('Returning cached open jobs');
      return this.openJobs.asObservable();
    }

    this.trackApiCall('getOpenJobs');
    this.logger.log('Fetching open jobs from API');
    const body = {
      from: this.jobBoardTableId,
      select: [3, 6, 8, 9, 10, 12, 13, 14, 16, 17, 18, 19, 20, 21, 23, 24, 25],
      where: `{14.EX.'Open'}`,
      sortBy: [
        {
          fieldId: 25,
          order: 'DESC'
        }
      ],
      options: {
        skip: 0,
        top: 0,
        compareWithAppLocalTime: false
      }
    };

    return this.callQuickbaseProxy('POST', 'query', body).pipe(
      map(response => {
        const records = this.extractRecords(response);
        return records.map((record: any) => ({
          id: this.getFieldValue(record, 3) ?? '',
          jobTitle: this.getFieldValue(record, 6) ?? '',
          skillsNeeded: this.getFieldValue(record, 8) ?? '',
          shifts: this.getFieldValue(record, 9) ?? '',
          payRate: this.getFieldValue(record, 10) ?? '',
          benefits: this.getFieldValue(record, 12) ?? '',
          employerReferral: this.getFieldValue(record, 13) ?? '',
          status: this.getFieldValue(record, 14) ?? '',
          employerName: this.getFieldValue(record, 16) ?? '',
          employerAddress: this.getFieldValue(record, 17) ?? '',
          employerCity: this.getFieldValue(record, 18) ?? '',
          employerIndustry: this.getFieldValue(record, 19) ?? '',
          employerPhone: this.getFieldValue(record, 20) ?? '',
          employerPointOfContact: this.getFieldValue(record, 21) ?? '',
          employerWebsite: this.getFieldValue(record, 23) ?? '',
          employerEmail: this.getFieldValue(record, 24) ?? '',
          datePosted: this.getFieldValue(record, 25) ?? null,
          raw: record
        }));
      }),
      tap(mappedData => {
        this.logger.log(`Cached ${mappedData.length} open jobs`);
        this.openJobs.next(mappedData);
      }),
      catchError(error => {
        this.logger.error('Error fetching open jobs', error);
        return of([]);
      })
    );
  }

  /**
   * Returns the number of cached open jobs for the UI to derive a count.
   */
  getOpenJobCount(): number {
    const jobs = this.openJobs.value;
    return Array.isArray(jobs) ? jobs.length : 0;
  }

  /**
   * Query the Staff Time Entries table for today's record for the given staff
   * record. Staff Reference (fid 29) is matched to the staff record ID and
   * Work Date (fid 7) to today's date in America/Los_Angeles.
   * Read-only: returns matching records (fid 3 only); empty array on error.
   */
  getTodayStaffTimeEntry(staffRecordId: number | string): Observable<any[]> {
    this.trackApiCall('getTodayStaffTimeEntry');
    // Today's date in America/Los_Angeles as YYYY-MM-DD
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
    const body = {
      from: this.staffTimeEntriesTableID,
      select: [3], // fid 3 = Record ID#
      where: `{29.EX.${staffRecordId}}AND{7.EX.'${today}'}`,
      options: {
        skip: 0,
        top: 0,
        compareWithAppLocalTime: false
      }
    };

    this.logger.log(`getTodayStaffTimeEntry - staffRecordId=${staffRecordId}, workDate=${today}`);
    return this.callQuickbaseProxy('POST', 'query', body).pipe(
      map(response => this.extractRecords(response)),
      catchError(error => {
        this.logger.error('Error querying Staff Time Entries', error);
        return of([]);
      })
    );
  }

  /**
   * Query the Staff Time Entries table for YESTERDAY's record for the given
   * staff record (America/Los_Angeles calendar date). Same shape as
   * getTodayStaffTimeEntry — read-only, returns fid 3 matches, [] on error.
   */
  getYesterdayStaffTimeEntry(staffRecordId: number | string): Observable<any[]> {
    this.trackApiCall('getYesterdayStaffTimeEntry');
    // Yesterday in America/Los_Angeles as YYYY-MM-DD — computed via UTC date
    // math on the LA calendar date so device timezone can't skew the result.
    const laToday = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
    const [y, m, d] = laToday.split('-').map(Number);
    const yd = new Date(Date.UTC(y, m - 1, d) - 86400000);
    const yesterday = `${yd.getUTCFullYear()}-${String(yd.getUTCMonth() + 1).padStart(2, '0')}-${String(yd.getUTCDate()).padStart(2, '0')}`;
    const body = {
      from: this.staffTimeEntriesTableID,
      select: [3, 63], // fid 3 = Record ID#, fid 63 = Missed Clock-Out flag
      where: `{29.EX.${staffRecordId}}AND{7.EX.'${yesterday}'}`,
      options: {
        skip: 0,
        top: 0,
        compareWithAppLocalTime: false
      }
    };

    return this.callQuickbaseProxy('POST', 'query', body).pipe(
      map(response => this.extractRecords(response)),
      catchError(error => {
        this.logger.error('Error querying yesterday Staff Time Entries', error);
        return of([]);
      })
    );
  }

  /**
   * Set the Missed Clock-Out flag (fid 63) on a Staff Time Entries record.
   * Errors propagate so the caller can avoid claiming the flag was saved.
   */
  markStaffTimeEntryMissedClockOut(steRecordId: number | string): Observable<any> {
    this.trackApiCall('markStaffTimeEntryMissedClockOut');
    const body = {
      to: this.staffTimeEntriesTableID,
      data: [{
        3: { value: steRecordId },
        63: { value: true }
      }],
      fieldsToReturn: [3]
    };
    return this.callQuickbaseProxy('POST', 'records', body).pipe(
      map(response => {
        const payload = response || {};
        if (payload.lineErrors) {
          console.error('Quickbase flag update rejected', payload.lineErrors);
          throw new Error(`Quickbase rejected the flag update: ${JSON.stringify(payload.lineErrors)}`);
        }
        const updated = payload?.metadata?.updatedRecordIds;
        const records = payload?.data ?? payload;
        if ((!updated || updated.length === 0) && (!Array.isArray(records) || records.length === 0)) {
          console.error('Quickbase did not confirm flag update', response);
          throw new Error('Quickbase did not confirm the flag update');
        }
        return response;
      })
    );
  }

  /**
   * Query today's punch records for a Staff Time Entry.
   * fid 6 = Related Staff Time Entry, fid 9 = Punch Type,
   * fid 10 = Punch Timestamp, fid 3 = Record ID.
   * Sorted by timestamp then Record ID. Errors propagate so the caller can
   * distinguish a failed lookup from an empty punch list.
   */
  getStaffTimePunches(steRecordId: number | string): Observable<any[]> {
    this.trackApiCall('getStaffTimePunches');
    const body = {
      from: this.staffTimePunchesTableID,
      select: [3, 9, 10],
      where: `{6.EX.${steRecordId}}`,
      sortBy: [
        { fieldId: 10, order: 'ASC' },
        { fieldId: 3, order: 'ASC' }
      ],
      options: {
        skip: 0,
        top: 0,
        compareWithAppLocalTime: false
      }
    };

    return this.callQuickbaseProxy('POST', 'query', body).pipe(
      map(response => this.extractRecords(response))
    );
  }

  /**
   * Create a punch record in the Staff Time Punches table.
   * fid 6 = Related Staff Time Entry (the daily STE record ID),
   * fid 9 = Punch Type ('Clock In' | 'Clock Out'),
   * fid 10 = Punch Timestamp (ISO string).
   * The observable errors propagate to the caller so the UI can react.
   */
  createStaffTimePunch(
    steRecordId: number | string,
    punchType: string,
    location?: { latitude?: number; longitude?: number; address?: string; accuracyFeet?: number },
    timestampIso?: string
  ): Observable<any> {
    this.trackApiCall('createStaffTimePunch');
    const record: any = {
      6: { value: steRecordId },
      9: { value: punchType },
      10: { value: timestampIso || new Date().toISOString() }
    };
    if (location) {
      if (typeof location.latitude === 'number') {
        record[11] = { value: location.latitude };
      }
      if (typeof location.longitude === 'number') {
        record[12] = { value: location.longitude };
      }
      if (location.address) {
        record[13] = { value: location.address };
      }
      if (typeof location.accuracyFeet === 'number') {
        record[14] = { value: location.accuracyFeet };
      }
    }
    const body = {
      to: this.staffTimePunchesTableID,
      data: [record],
      fieldsToReturn: [3]
    };
    this.logger.log(`createStaffTimePunch - steRid=${steRecordId}, type=${punchType}`);
    return this.callQuickbaseProxy('POST', 'records', body).pipe(
      map((response: any) => {
        // Quickbase can return HTTP 207 with metadata.lineErrors on rejected
        // records, and the proxy may return either the full {data, metadata}
        // object or just the records array. Verify actual creation.
        const meta = response?.metadata ?? response?.data?.metadata ?? {};
        const lineErrors = meta.lineErrors;
        const errorCount = lineErrors ? (Array.isArray(lineErrors) ? lineErrors.length : Object.keys(lineErrors).length) : 0;
        if (errorCount > 0) {
          this.logger.error('Quickbase rejected staff time punch', lineErrors);
          throw new Error(`Quickbase rejected the punch record: ${JSON.stringify(lineErrors)}`);
        }
        const createdIds = Array.isArray(meta.createdRecordIds) ? meta.createdRecordIds : [];
        const records = Array.isArray(response) ? response
          : (Array.isArray(response?.data) ? response.data : []);
        if (createdIds.length === 0 && records.length === 0) {
          this.logger.error('Quickbase did not confirm punch record creation', response);
          throw new Error('Quickbase did not confirm creation of the punch record');
        }
        return response;
      })
    );
  }

  /**
   * Reverse geocode coordinates to a street address via the server-side
   * Firebase callable (no third-party keys in client code).
   * Best-effort only: resolves to null on any failure so callers can proceed
   * without an address.
   */
  reverseGeocodeAddress(latitude: number, longitude: number): Observable<string | null> {
    this.trackApiCall('reverseGeocodeAddress');
    return from(this.reverseGeocodeCallable({ latitude, longitude })).pipe(
      map((result: any) => {
        const payload = result?.data ?? result?.result ?? result;
        if (!payload || payload.success === false) {
          return null;
        }
        return payload?.data?.address || payload?.address || null;
      }),
      catchError(error => {
        this.logger.warn('reverseGeocodeAddress failed', error);
        return of(null);
      })
    );
  }
}
