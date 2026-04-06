// src/app/services/quickbase.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, catchError, throwError, of, forkJoin, from, retryWhen, timer } from 'rxjs';
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
  
  private errorMessage: BehaviorSubject<string> = new BehaviorSubject<string>('');
  errorMessage$: Observable<string> = this.errorMessage.asObservable();
  TaskRecordId: number = 0;
  STAalert: string = '';
  Alert: string = '';
  maxMeetingDate: string = '';
  queryData: any;
  isActivityAddedOnce = false;
  
  // Enhanced caching with BehaviorSubjects
  residentData = new BehaviorSubject<any>(null);
  pendingArrivals = new BehaviorSubject<any>(null);
  staffTasks = new BehaviorSubject<any>(null);
  announcements = new BehaviorSubject<any>(null);
  activeStaff = new BehaviorSubject<any>(null);
  trainingRecords = new BehaviorSubject<any>(null);
  houseKPIs = new BehaviorSubject<any>(null); // Used to store all house data with KPIs
  transportRequests = new BehaviorSubject<any>(null); // Cached transport requests for house leaders
  locations = new BehaviorSubject<any>(null); // Cached locations (pickup/destination)
  
  // Simple session-based caching - no timers needed
  
  residentsSelections: any[] = [];
  staffRecordID: number = 0;

  // API call tracking for debugging
  private apiCallCount = 0;
  private cacheHitCount = 0;
  // Temporary in-memory cache for last resident search (to support back-navigation)
  private _lastResidentSearch: { query: string; results: any[] } | null = null;

  private functions = getFunctions();
  private quickbaseProxy = httpsCallable(this.functions, 'quickbaseProxy');

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
      this.logger.warn('Failed to connect functions emulator', e);
    }

    this.logger.log('🚀 QuickbaseService initialized with enhanced caching and secure proxy');
  }

  // Escape single quotes for Quickbase where clauses by doubling them
  private escapeForQuickbase(value: string): string {
    if (!value && value !== '') return value;
    return String(value).replace(/'/g, "''");
  }

  /**
   * Secure proxy method - calls Firebase Cloud Function instead of Quickbase directly
   * This keeps the API token server-side and never exposed to clients
   */
  public callQuickbaseProxy(method: string, endpoint: string, body?: any): Observable<any> {
    // Defensive logging of the outgoing payload (also emit console logs for temporary debugging)
    let safeBody = '{}';
    try {
      safeBody = JSON.stringify(body || {});
      this.logger.debug(`Proxy Request -> method: ${method}, endpoint: ${endpoint}, body: ${safeBody}`);
      // Temporary console debug to aid diagnosing 500 errors for specific houses/users
      this.logger.debug('QuickbaseProxy Request Preview', { method, endpoint, bodyPreview: safeBody.substring(0, 200) });
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
        this.logger.debug('🔒 Proxy call received', result);
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
        // Log more details about the Firebase error
        try {
          this.logger.error('Quickbase Proxy Error - code:', (error && error.code) || 'N/A');
          this.logger.error('Quickbase Proxy Error - message:', (error && error.message) || 'N/A');
          this.logger.error('Quickbase Proxy Error - details:', (error && error.details) || error);
          // Also emit console.error with payload preview to help capture what triggered the 500
          this.logger.error('QuickbaseProxy ERROR', { method, endpoint, bodyPreview: safeBody.substring(0, 100), error });
        } catch (e) {
          this.logger.error('Quickbase Proxy Error (failed to extract details)', error);
        }
        return throwError(() => error);
      })
    );
  }

  private isCacheAvailable(cacheKey: string): boolean {
    // Simple check - if we have cached data in this session, use it
    const cacheMap: any = {
      'staffTasks': this.staffTasks.value,
      'announcements': this.announcements.value,
      'activeStaff': this.activeStaff.value,
      'trainingRecords': this.trainingRecords.value,
      'residentData': this.residentData.value,
      'pendingArrivals': this.pendingArrivals.value,
      'houseKPIs': this.houseKPIs.value,
      'transportRequests': this.transportRequests.value,
      'locations': this.locations.value
    };
    
    const hasCache = !!cacheMap[cacheKey];
    if (hasCache) {
      this.cacheHitCount++;
      this.logger.debug(`📊 Cache HIT for ${cacheKey} (Total hits: ${this.cacheHitCount})`);
    } else {
      this.logger.debug(`📊 Cache MISS for ${cacheKey} - fetching fresh data`);
    }
    
    return hasCache;
  }

  private trackApiCall(methodName: string): void {
    this.apiCallCount++;
    this.logger.debug(`🌐 API CALL ${this.apiCallCount}: ${methodName} (Cache hits: ${this.cacheHitCount})`);
  }

  public getApiStats(): { apiCalls: number, cacheHits: number, efficiency: string } {
    const totalRequests = this.apiCallCount + this.cacheHitCount;
    const efficiency = totalRequests > 0 ? ((this.cacheHitCount / totalRequests) * 100).toFixed(1) + '%' : '0%';
    return {
      apiCalls: this.apiCallCount,
      cacheHits: this.cacheHitCount,
      efficiency
    };
  }

  // Clear all caches (useful for logout)
  public clearAllCaches(): void {
    this.staffTasks.next(null);
    this.announcements.next(null);
    this.activeStaff.next(null);
    this.trainingRecords.next(null);
    this.residentData.next(null);
    this.pendingArrivals.next(null);
    this.logger.log('All caches cleared');
  }

  // Store last resident search in memory (cleared on logout or explicit clear)
  public setLastResidentSearch(query: string, results: any[]): void {
    try {
      this._lastResidentSearch = { query: query || '', results: Array.isArray(results) ? results : [] };
      this.logger.debug('Last resident search cached', { query, count: this._lastResidentSearch.results.length });
    } catch (e) {
      this.logger.warn('Failed to cache last resident search', e);
    }
  }

  public getLastResidentSearch(): { query: string; results: any[] } | null {
    return this._lastResidentSearch;
  }

  public clearLastResidentSearch(): void {
    this._lastResidentSearch = null;
    this.logger.debug('Last resident search cleared');
  }

  // getHeaders() method removed - all requests now go through secure Firebase Cloud Function proxy
  // The API token is never exposed to the client

  // quickbase.service.ts
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
       map(data => ({ data })),
       tap(response => this.logger.debug('Classes loaded successfully'))
     );
  }

  //Query to get available training modules
  getTrainingRecords(): Observable<{ data: any[] }> {
    // Check if cached data is available
    if (this.isCacheAvailable('trainingRecords')) {
      return this.trainingRecords.asObservable();
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
  // Check if cached data is available
  if (this.isCacheAvailable('staffTasks')) {
    return this.staffTasks.asObservable();
  }
  
  this.trackApiCall('getStaffTasks');
  this.logger.log('Fetching fresh staff tasks from API');
  const body = {
    from: this.StaffTasksTableID, 
    select: [3, 22, 32, 8, 36, 47, 15, 263],
    where: `{34.EX.${this.staffRecordID}}AND{12.EX.'House Leader'}AND{37.EX.'Active'}AND{41.EX.'Active'}AND{40.EX.'Active'}AND{22.CT.'Activity Over-Due'}`, 
    options: {
      skip: 0,
      top: 0,
      compareWithAppLocalTime: false
    }
  };
  this.logger.debug('Requesting staff tasks');

  return this.callQuickbaseProxy('POST', 'query', body).pipe(
    tap(response => {
      this.logger.debug('Staff tasks loaded successfully');
      // Update cache with fresh data
      this.staffTasks.next(response);
    })
  );
}

insertActivity(activityData: any): Observable<any> {
  const body = {
    to: this.ActivityTableID, 
    data: [activityData],
    fieldsToReturn: [3, 89] 
  };
  return this.callQuickbaseProxy('POST', 'records', body).pipe(
    map((response: any) => {
      this.logger.debug('Activity inserted successfully');
      const activityId = response.data[0]?.['3'].value;
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
  query(housename: string, staffID: string): Observable<any> {
    this.logger.debug('Querying staff access');
    this.logger.debug('Login attempt - housename/staffID', { housename, staffID });
    
    // Single API call to get all active staff records with house and area manager info
    const body = {
      from: this.queryStaffTableId,
      select: [3, 6, 9, 10, 55, 93, 102, 139, 223, 225, 247, 248, 295], // Added 93 (Role), 102 (Staff ID) and 295 (Senior Staff)
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
          return { ...response, data: [] };
        }
        
        // Cache the full dataset
        const allStaffRecords = response.data;
        this.logger.debug(`Cached ${allStaffRecords.length} staff records`);
        
        // Second query: Filter cached results based on house and staff access logic
        const matchingRecords = allStaffRecords.filter((record: any) => {
          const recordHouseName = record['223']?.value || record['223'];
          const recordStaffID = record['102']?.value || record['102'];
          const isAreaManager = record['295'] === true || record['295']?.value === true || record['295'] === 'Yes';
          
          // First, check if this is the requesting user (area manager check)
          if (recordStaffID === staffID && isAreaManager) {
            this.logger.debug('Found area manager record');
            return true; // Always include the area manager's own record
          }
          
          // Check if this record matches the requested house
          const houseMatches = recordHouseName === housename;
          
          if (!houseMatches) {
            return false; // Skip records not for this house
          }
          
          // For house-specific records, include:
          // 1. House Leader records for the requested house
          // 2. Regular staff records that match the requesting staffID
          const isHouseLeader = (record['93']?.value || record['93']) === 'House Leader';
          const staffIDMatches = recordStaffID === staffID;
          
          this.logger.debug('Checking record access permissions');
          
          return isHouseLeader || staffIDMatches;
        });
        
        this.logger.debug(`Matching records found: ${matchingRecords.length}`);
        
        // For area managers, prioritize house leader records, otherwise use their own record
        let finalRecord = null;
        if (matchingRecords.length > 0) {
          // Check if requesting user is area manager by finding their record
          const userRecord = allStaffRecords.find((r: any) => (r['102']?.value || r['102']) === staffID);
          const isUserAreaManager = userRecord && (userRecord['295'] === true || userRecord['295']?.value === true || userRecord['295'] === 'Yes');
          
          this.logger.debug(`User access level determined`);
          
          if (isUserAreaManager) {
            // Area manager: prefer house leader record for this house
            const houseLeaderRecord = matchingRecords.find((r: any) => {
              const isHL = (r['93']?.value || r['93']) === 'House Leader';
              const houseMatch = (r['223']?.value || r['223']) === housename;
              return isHL && houseMatch;
            });
            
            if (houseLeaderRecord) {
              finalRecord = houseLeaderRecord;
              this.logger.debug('Area manager accessing house leader record');
            } else {
              // Fallback to any house leader record if no specific house match
              const anyHouseLeader = matchingRecords.find((r: any) => (r['93']?.value || r['93']) === 'House Leader');
              finalRecord = anyHouseLeader || userRecord;
              this.logger.debug('Using fallback record');
            }
          } else {
            // Regular staff: use their own record
            finalRecord = matchingRecords.find((r: any) => (r['102']?.value || r['102']) === staffID);
            this.logger.debug('Regular staff accessing own record');
          }
        }
        
        // Process the final record and ensure proper structure
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
        
        // Return the modified response that postData can process
        return {
          ...response,
          data: finalRecord ? [finalRecord] : []
        };
      }),
      switchMap((processedResponse: any) => {
        // Process the filtered data through postData logic without making another HTTP call
        if (processedResponse.data && processedResponse.data.length > 0) {
          const record = processedResponse.data[0];
          const recordNumber = record['3']; // Field 3 is the record ID
          
          if (recordNumber !== undefined) {
            this.logger.debug('Processing staff record');
            this.staffRecordID = recordNumber.value || recordNumber; // Store for other functions
            
            // Extract additional fields
            const theHouseName = record['223'];
            const HouseLeaderName = record['10'];
            const HouseLeaderRecordId = record['9'];
            const HLphone = record['55'];
            const TaskRecordId = record['247'];
            const STAalert = record['225'];
            const Alert = record['139'];

            // Store values for service state
            this.TaskRecordId = record['247']?.value || record['247'] || 0;
            this.STAalert = record['225']?.value || record['225'] || '';
            this.Alert = record['139']?.value || record['139'] || '';

            return of({
              'recordNumber': recordNumber,
              'theHouseName': theHouseName,
              'HouseLeaderName': HouseLeaderName,
              'HouseLeaderRecordId': HouseLeaderRecordId,
              'HLphone': HLphone,
              'TaskRecordId': TaskRecordId,
              'STAalert': STAalert,
              'Alert': Alert
            });
          } else {
            this.logger.error('Record number not found in processed response');
            this.errorMessage.next('This Staff ID is not active! Please re-enter and try again.');
            return of(null);
          }
        } else {
          this.logger.error('No matching records found');
          this.errorMessage.next('No authorization found for this staff ID and house combination.');
          return of(null);
        }
      }),
      catchError(error => {
        this.logger.error('Error during Quickbase query', error);
        this.errorMessage.next('Error querying Quickbase');
        return throwError(error);
      })
    );
  }

  // postData method removed - functionality moved to query() method which now uses secure proxy   

  getResidentsByEmail(email: string, password: string): Observable<any> {
    this.logger.log(`getResidentsByEmail called with email: "${email}"`);
    
    const body = {
      from: this.queryResidentTableId,
      select: [3, 692, 31, 24, 40, 72, 116, 177, 131, 132, 135, 141, 564, 576, 150, 442, 296, 275, 7, 340, 53, 439, 90, 441, 448, 477, 655, 693, 694, 699, 700, 705, 706, 789, 790, 797, 798, 897],
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
      655, 693, 694, 699, 700, 705, 706, 789, 790, 797, 798, 897
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
        655, 693, 694, 699, 700, 705, 706, 789, 790, 797, 798, 897
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
      const dataArray = response2.data;
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
      this.houseKPIs.next(houseData);
      this.logger.debug('🏠 House data with KPIs cached successfully');
      
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
  this.houseKPIs.next(null);
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
    select: [3, 9, 10, 55, 102, 118, 139, 177, 301],  // fid 3 = Staff Record ID, fid 9 = Related Participant, fid 10 = Display Name, others may include contact info
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

        // 2) Fallback: scan all returned fields for any email-like string
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

        return {
          raw: record,
          userId: record['3']?.value,
          displayName: record['10']?.value,
          feedbackRole: (record['301'] && (record['301'].value ?? record['301'])) || null,
          relatedParticipantId: record['9']?.value,
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
            relatedParticipantId: s.relatedParticipantId,
            email: s.email
          };
        });

      processed.forEach((p: any) => this.logger.debug(`  Mapped staff: userId=${p.userId}, displayName="${p.displayName}", email=${p.email}, relatedParticipantId=${p.relatedParticipantId}`));
      return processed;
    }),
    tap(mappedData => {
      // Update cache with mapped data
      this.logger.log(`📋 Caching ${mappedData.length} active staff records`);
      this.activeStaff.next(mappedData);
    })
  );
}
}
