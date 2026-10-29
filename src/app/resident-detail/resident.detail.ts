import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QuickbaseService } from '../services/quickbase.service';
import { ThemeService } from '../services/theme.service';
import { UserService } from '../services/user.service';
import { Location } from '@angular/common';
import { App } from '@capacitor/app';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from '../dialog/dialog.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PhotoStorageService } from '../services/photoProcessing.service';
import { PopoverController, AlertController } from '@ionic/angular';
import { ResidentActionsComponent } from '../resident-actions/resident-actions.component';
import { ResidentSearchComponent } from '../resident-search/resident-search.component';

@Component({
  selector: 'HOMMA-resident-detail',
  templateUrl: './resident.detail.html',
  styleUrls: ['./resident.detail.scss'],
})

export class ResidentDetailComponent  implements OnInit, OnDestroy {
  @ViewChild('residentSearch', { static: false }) residentSearch!: ResidentSearchComponent;
  residentData: any;
  showJobBoardComingSoon = true;
  theHouseName: string = '';
  houseLeaderName: string = '';
  houseLeaderPhone: string = '';
  houseLeaderRecordId: string = ''; // Add this property
  residentPhoto: string | undefined;
  isResident: boolean = false;
  isStaff: boolean = false;

  // House Leaders reach 1-on-1 reviews through their assigned Task cards only
  get isHouseLeader(): boolean {
    return this.quickbaseService.isHouseLeaderSession;
  }
  timeClockEnabled: boolean = false;
  timeEntryStatus: string = '';
  steReady: boolean = false;
  steRecordId: any = null;
  clockedIn: boolean = false;
  clockInTime: Date | null = null;
  elapsedText: string = '';
  processing: boolean = false;
  private elapsedTimer: any = null;
  private tenHourAlertShown: boolean = false;
  todaySessions: { start: Date; end: Date; durText: string }[] = [];
  workedTodayText: string = '';
  breaksTodayText: string = '';
  private punchTimeline: { type: string; ts: Date }[] = [];
  announcements: any[] = [];
  // Search session state
  searchSessionExists: boolean = false;
  searchResults: any[] = [];
  searchQuery: string = '';

  constructor(
    private router: Router,
    private location: Location,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private dialog: MatDialog,
    private photoStorageService: PhotoStorageService,
    private quickbaseService: QuickbaseService,
    private userService: UserService,
    public themeService: ThemeService,
    private popoverCtrl: PopoverController,
    private alertCtrl: AlertController
  ) { 
  }

  private resolveHouseLeaderRecordIdFromContext(state?: any): string {
    const candidates = [
      this.houseLeaderRecordId,
      state?.houseLeaderRecordId,
      state?.HouseLeaderRecordId,
      this.route.snapshot?.queryParamMap?.get('houseLeaderRecordId'),
      this.route.snapshot?.queryParamMap?.get('HouseLeaderRecordId'),
      this.route.snapshot?.queryParams?.['houseLeaderRecordId'],
      this.route.snapshot?.queryParams?.['HouseLeaderRecordId'],
      this.residentData?.houseLeaderRecordId?.value,
      this.residentData?.houseLeaderRecordId
    ];

    for (const candidate of candidates) {
      const value = candidate === null || candidate === undefined ? '' : String(candidate).trim();
      if (value) {
        return value;
      }
    }

    return '';
  }

  async presentResidentActions(resident: any, isPending: boolean = false) {
    try {
      const pop = await this.popoverCtrl.create({
        component: ResidentActionsComponent,
        componentProps: {
          resident,
          isPending,
          theHouseName: this.theHouseName,
          houseLeaderRecordId: this.houseLeaderRecordId,
          houseLeaderName: this.houseLeaderName,
          HLphone: this.houseLeaderPhone,
          maxMeetingDate: ''
        },
        translucent: true
      });
      await pop.present();
    } catch (e) {
      console.error('Error presenting resident actions popover', e);
    }
  }

  // Wait for the participant photo to be available (either on residentData or in PhotoStorageService)
  // before navigating to the training page. This avoids the UI showing a missing photo on the
  // training screen immediately after navigation. Polls briefly up to a timeout.
  async navigateToTraining(): Promise<void> {
    const participantName = this.residentData?.residentFullName?.value;
    const participantId = this.residentData?.recordNumber2?.value || this.residentData?.recordNumber || '';

    // Helper to resolve a photo from residentData or PhotoStorageService
    const resolvePhoto = () => {
      // residentData may hold a photo directly
      const direct = this.residentData?.residentPhoto;
      if (direct) return direct;
      // PhotoStorageService may have a base64 or saved photo keyed by id
      try {
        const stored = this.photoStorageService.getPhoto(String(participantId));
        if (stored) return stored;
      } catch (e) {
        // ignore
      }
      return undefined;
    };

    // Resolve photo value (may be a URL, data URI, or undefined)
    const participantPhoto = resolvePhoto();

    // If we have a photo string, attempt to load it (ensures browser cache/decoder has it)
    async function waitForImageLoad(src: string | undefined, timeout = 3000): Promise<void> {
      if (!src) return;
      // If the src is a data URI or empty, still attempt to load but it should be immediate
      return new Promise<void>((resolve) => {
        try {
          const img = new Image();
          let settled = false;
          const onDone = () => {
            if (settled) return;
            settled = true;
            cleanup();
            resolve();
          };
          const onError = () => onDone();
          const cleanup = () => {
            img.onload = null;
            img.onerror = null;
          };
          img.onload = onDone;
          img.onerror = onError;
          // Start load
          img.src = src;
          // If the image is already complete (cached), resolve immediately
          if ((img.complete && img.naturalWidth !== 0) || (img.complete && img.naturalHeight !== 0)) {
            onDone();
            return;
          }
          // Timeout fallback
          setTimeout(() => {
            onDone();
          }, timeout);
        } catch (e) {
          // If anything goes wrong, just resolve so navigation proceeds
          resolve();
        }
      });
    }

    // Wait for image to finish loading (or timeout) before navigation so the Training page shows it immediately
    try {
      await waitForImageLoad(participantPhoto, 3000);
    } catch (e) {
      // ignore and proceed to navigate
    }

    // console.log('Navigating to Training with participantName:', participantName, 'and participantPhoto (resolved):', participantPhoto);
    // Prepare navigation state (full residentData) and query params fallback.
    const residentCloneForNav = Object.assign({}, this.residentData);
    if (residentCloneForNav) residentCloneForNav.residentPhoto = undefined;
    const navState = {
      residentData: residentCloneForNav,
      theHouseName: this.theHouseName,
      houseLeaderName: this.houseLeaderName
    };

    // Persist the resolved photo into PhotoStorageService so the destination can retrieve it
    // (avoids relying solely on `sessionStorage` which can fail on some mobile WebViews).
    try {
      if (participantPhoto && participantId) {
        this.photoStorageService.setPhoto(String(participantId), participantPhoto);
      }
    } catch (e) {
      // ignore storage failures
    }

    // Do not include photo data in query params. Persist to PhotoStorageService
    // and pass only the participantId so destinations can retrieve the image.
    const queryParams: any = { participantId };
    try {
      if (participantPhoto && participantId) {
        try {
          sessionStorage.setItem(`residentPhoto_${participantId}`, participantPhoto);
        } catch (e) {
          // ignore storage errors
        }
      }
    } catch (e) {}

    this.router.navigate(['/training'], { state: navState, queryParams });
  }

  async navigateToClassroom(): Promise<void> {
    const participantId = this.residentData?.recordNumber2?.value || this.residentData?.recordNumber || '';
    const participantPhoto = this.residentData?.residentPhoto;

    // Persist the resolved photo so the Classroom page can retrieve it
    try {
      if (participantPhoto && participantId) {
        this.photoStorageService.setPhoto(String(participantId), participantPhoto);
        try {
          sessionStorage.setItem(`residentPhoto_${participantId}`, participantPhoto);
        } catch (e) {}
      }
    } catch (e) {}

    const residentCloneForNav = Object.assign({}, this.residentData);
    if (residentCloneForNav) residentCloneForNav.residentPhoto = undefined;
    const navState = {
      residentData: residentCloneForNav,
      theHouseName: this.theHouseName,
      houseLeaderName: this.houseLeaderName,
      returnUrl: this.router.url
    };

    const queryParams: any = { participantId };

    this.router.navigate(['/classroom'], { state: navState, queryParams });
  }

  navigateToTransportation() {
    const participantName = this.residentData?.residentFullName?.value || '';
    const participantPhoto = this.residentData?.residentPhoto;
    const participantId = this.residentData?.recordNumber2?.value || this.residentData?.recordNumber;
    const resolvedHouseLeaderRecordId = this.resolveHouseLeaderRecordIdFromContext();
    const isStaff = this.userService.isStaffUser();
    const destination = isStaff ? '/transportation-history' : '/transportation';

    // Persist photo and navigate passing only identifiers; avoid sending photo data in query params.
    try {
      if (participantPhoto && participantId) {
        this.photoStorageService.setPhoto(String(participantId), participantPhoto);
        try {
          sessionStorage.setItem(`residentPhoto_${participantId}`, participantPhoto);
        } catch (e) {}
      }
    } catch (e) {}

    this.router.navigate([destination], {
      queryParams: { participantName, participantId, theHouseName: this.theHouseName, houseLeaderName: this.houseLeaderName, houseLeaderRecordId: resolvedHouseLeaderRecordId },
      state: {
        residentData: this.residentData,
        fromSearch: this.searchSessionExists,
        searchResults: this.searchResults,
        searchQuery: this.searchQuery,
        houseLeaderRecordId: resolvedHouseLeaderRecordId,
        houseLeaderName: this.houseLeaderName,
        theHouseName: this.theHouseName
      }
    });
  }

  addParticipantReviews() {
    if (!this.residentData) {
      // console.error('residentData is undefined');
      return;
    }
  
    const participantName = this.residentData.residentFullName?.value || 'Unknown Participant';
    const residentPhoto = this.residentData.residentPhoto || null;
    
    // Debug CCO data structure
    // console.log('DEBUG: residentData.residentCCOfirst:', this.residentData.residentCCOfirst);
    // console.log('DEBUG: residentData.residentCCOlast:', this.residentData.residentCCOlast);
    
    const ccoFirstName = this.residentData.residentCCOfirst?.value || '';
    const ccoLastName = this.residentData.residentCCOlast?.value || '';
    const ccoFullName = ccoFirstName && ccoLastName ? `${ccoFirstName} ${ccoLastName}` : 
                       ccoFirstName || ccoLastName || 'CCO not listed';
                       
    // console.log('DEBUG: ccoFirstName =', ccoFirstName);
    // console.log('DEBUG: ccoLastName =', ccoLastName);
    // console.log('DEBUG: ccoFullName =', ccoFullName);
    const ccoPhoneNumber = this.residentData.residentCCOphone?.value || 'No Phone Number';
    const ccoMobile = this.residentData.residentCCOmobile?.value || 'No Mobile Number';
  const ccoEmail = this.residentData.residentCCOemail?.value || this.residentData.residentCCOEmail?.value || 'No CCO Email';
    const workStatus = this.residentData.WorkStatus?.value || 'Unknown Work Status';
    const docStatus = this.residentData.residentDOCstatus?.value || '';
    const participantEmail = this.residentData.residentEmail?.value || 'No Email';
    const participantPhone = this.residentData.residentPhone?.value || 'No Phone';
    const participantId = this.residentData.recordNumber2?.value || 'No ID';
    const Last1on1Date = this.residentData.Last1on1Date?.value || 'No Date';
  
    // If any of the critical fields are missing, log an error and return
    if (!participantName || !workStatus) {
      // console.error('Critical properties are undefined or empty');
      return;
    }
  
    // // console.log('Navigating to participant reviews with participantName:', participantName, 'and participantPhoto:', participantPhoto);
    // Persist photo for destination retrieval and navigate without embedding the photo in params
    try {
      if (residentPhoto && participantId) {
        this.photoStorageService.setPhoto(String(participantId), residentPhoto);
        try { sessionStorage.setItem(`residentPhoto_${participantId}`, residentPhoto); } catch (e) {}
      }
    } catch (e) {}

    this.router.navigate(['/participant-reviews'], { 
      queryParams: { 
        ccoFullName, 
        ccoPhoneNumber,
        ccoMobile,
        ccoEmail,
        docStatus,
        participantId,
        participantName,
        participantEmail,
        participantPhone, 
        workStatus, 
        Last1on1Date,
        theHouseName: this.theHouseName,
        houseLeaderName: this.houseLeaderName 
      } 
    });
  }
  
  getSafeHtml(html: string): SafeHtml {
  return this.sanitizer.bypassSecurityTrustHtml(html);
}

exitApp() {
  this.clearCache();
  this.router.navigate(['/login']);
}

isPaymentsActive(): boolean {
  return this.router.url.includes('/payments');
}

payNow() {
  const selectedResident = this.residentData ? { ...this.residentData } : null;
  if (selectedResident) {
    delete selectedResident.residentPhoto;
  }

  if (selectedResident) {
    this.router.navigate(['payments'], {
      relativeTo: this.route,
      state: { selectedResident, isParticipant: true, theHouseName: this.theHouseName, fromResidentDetails: true, fromSearch: this.searchSessionExists }
    });
    return;
  }

  this.router.navigate(['/tabs', 'payments'], { state: { selectedResident } });
}

goToVitals() {
  if (this.isPaymentsActive()) {
    this.location.back();
  }
}

  navigateToJobBoard() {
    // Temporary gate: while showJobBoardComingSoon is true, the Job Board tab
    // opens a Coming Soon decoy page instead of the real Job Board. When the
    // flag is set to false, the existing real Job Board is exposed normally.
    // If the participant (or HL) is currently on the Payments child route, replace
    // that history entry so the Back button returns to the resident-detail context
    // instead of landing on Payments.
    const navigationExtras = { replaceUrl: this.isPaymentsActive() };
    if (this.showJobBoardComingSoon) {
      this.router.navigate(['/coming-soon'], {
        ...navigationExtras,
        state: { title: 'Job Board' },
      });
      return;
    }
    this.router.navigate(['/job-board'], {
      ...navigationExtras,
      state: { residentData: this.residentData },
    });
  }

addObservationReport() {
    // Persist photo and navigate without embedding full photo data in state
    try {
      const pid = this.residentData?.recordNumber2?.value || this.residentData?.recordNumber || this.residentData?.id || '';
      const photo = this.residentData?.residentPhoto;
      if (photo && pid) {
        try { this.photoStorageService.setPhoto(String(pid), photo); } catch (e) {}
        try { sessionStorage.setItem(`residentPhoto_${pid}`, photo); } catch (e) {}
      }
    } catch (e) {}
    const clone = Object.assign({}, this.residentData);
    if (clone) clone.residentPhoto = undefined;
    this.router.navigate(['/observation-report'],  { state: { residentData: clone } });
    // console.log('Resident Data:', this.residentData);
  }

  addResidentUpdate() {
    try {
      const pid = this.residentData?.recordNumber2?.value || this.residentData?.recordNumber || this.residentData?.id || '';
      const photo = this.residentData?.residentPhoto;
      if (photo && pid) {
        try { this.photoStorageService.setPhoto(String(pid), photo); } catch (e) {}
        try { sessionStorage.setItem(`residentPhoto_${pid}`, photo); } catch (e) {}
      }
    } catch (e) {}
    const clone2 = Object.assign({}, this.residentData);
    if (clone2) clone2.residentPhoto = undefined;
    this.router.navigate(['/resident-update'], { state: { residentData: clone2 } });
    // console.log('Resident detail data:', this.residentData);
  }
    // Function to call the phone number or send a text message
  promptAction(phoneNumber: string, name: string) {
    const dialogRef = this.dialog.open(DialogComponent, {
      data: { phoneNumber: phoneNumber, name: name }
    });
  }

  goBack() {
    if (this.userService.isStaffUser() && this.searchSessionExists && this.residentData) {
      this.quickbaseService.setLastResidentSearch(
        this.searchQuery,
        this.searchResults,
        this.residentData,
        true
      );
    }
    this.location.back();
  }

  ngOnInit(): void {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { 
      residentData: any, 
      theHouseName: string, 
      houseLeaderName: string, 
      houseLeaderPhone: string, 
      houseLeaderRecordId?: string,
      HouseLeaderRecordId?: string,
      residentPhoto: string, 
      isResident: boolean,
      announcements?: any[],
      fromSearch?: boolean,
      searchResults?: any[],
      searchQuery?: string
     };
    // Read query params early so we can show the passed photo immediately
    let queryParticipantId: string | null = null;
    this.route.queryParams.subscribe(params => {
      if (params['residentPhoto']) {
        this.residentPhoto = params['residentPhoto'];
      }
      // Extract house leader record ID from query params (passed from home page)
      this.houseLeaderRecordId = params['houseLeaderRecordId'] || params['HouseLeaderRecordId'] || this.houseLeaderRecordId || '';
      if (params['theHouseName']) {
        this.theHouseName = params['theHouseName'];
      }
      if (params['houseLeaderName']) {
        this.houseLeaderName = params['houseLeaderName'];
      }
      // some navigations use recordNumber2 or participantId
      queryParticipantId = params['recordNumber2'] || params['participantId'] || null;
    });

    if (state && state.residentData) {
      this.residentData = state.residentData;
      this.theHouseName = state.theHouseName || '';
      this.houseLeaderName = state.houseLeaderName || '';
      this.houseLeaderPhone = state.houseLeaderPhone || '';
      this.houseLeaderRecordId = this.resolveHouseLeaderRecordIdFromContext(state);
      // Resolve safe photo src (may come from PhotoStorageService/sessionStorage)
      const safeSrc = this.photoStorageService.getSafeSrc(state.residentPhoto, this.residentData?.recordNumber2?.value);
      this.residentPhoto = safeSrc || '';
      // Ensure the template which checks `residentData.residentPhoto` sees the safe src too
      try {
        if (safeSrc) this.residentData.residentPhoto = safeSrc;
      } catch (e) {}
      this.isResident = state.isResident;
      // When navigated from the staff 'Resident Search', show the participant view
      // (hide senior-staff-only buttons) so staff can view resident vitals as a resident.
      this.isStaff = state.fromSearch ? false : this.userService.isStaffUser();
      this.timeClockEnabled = this.userService.isTimeClockEnabled();
      if (this.timeClockEnabled) {
        const staffRecordId = this.userService.getParticipantInfo().staffRecordId;
        this.quickbaseService.getTodayStaffTimeEntry(staffRecordId).subscribe(records => {
          if (records.length === 1) {
            this.steRecordId = records[0]['3']?.value ?? records[0]['3'];
            this.restoreTimeClockState(this.steRecordId);
            this.checkMissedClockOutYesterday(staffRecordId);
          } else if (records.length === 0) {
            this.timeEntryStatus = 'NO TIME ENTRY FOUND FOR TODAY';
          } else {
            this.timeEntryStatus = 'MULTIPLE TIME ENTRIES FOUND';
          }
        });
      }
      this.announcements = state.announcements || [];
      // If navigated from a search session, capture the search data so we can return
      if (state.fromSearch) {
        this.searchSessionExists = true;
        this.searchResults = state.searchResults || [];
        this.searchQuery = state.searchQuery || '';
      }
      // console.log('Resident Data from state:', this.residentData); // Log the resident data from state
      // console.log('House Name:', this.theHouseName); // Log the house name
      // console.log('House Leader Name:', this.houseLeaderName); // Log the house leader name
      // console.log('House Leader Phone:', this.houseLeaderPhone); // Log the house leader phone
      // console.log('Resident Photo:', this.residentPhoto); // Log the resident photo
      // console.log('Is Resident:', this.isResident); // Log the isResident flag 
      // console.log('Announcements:', this.announcements); // Log the announcements
    } else {
      // console.log('State not available, falling back to route parameters');
  const id = Number(this.route.snapshot.paramMap.get('id'));
      // console.log('ID:', id); // Log the ID
      // Subscribe to residentData but only pick the matching resident for this id to avoid overriding
      this.quickbaseService.residentData.subscribe(data => {
        try {
          // console.log('Data:', data); // Log the data
          this.isResident = false;
          if (Array.isArray(data)) {
            const found = data.find((resident: any) => String(resident?.recordNumber2?.value || resident?.recordNumber || '') === String(id));
            if (found) {
              this.residentData = found;
              const safe = this.photoStorageService.getSafeSrc(found.residentPhoto, found?.recordNumber2?.value) || undefined;
              this.residentPhoto = safe || this.residentPhoto;
              try { if (safe) found.residentPhoto = safe; } catch (e) {}
              // console.log('Resident Data (found by id):', this.residentData);
            }
          } else if (data && typeof data === 'object') {
            // single object emission - set if it matches id
            const incomingId = String(data?.recordNumber2?.value || data?.recordNumber || data?.id || '');
            if (incomingId === String(id)) {
              this.residentData = data;
              const safe2 = this.photoStorageService.getSafeSrc(data.residentPhoto, data?.recordNumber2?.value) || undefined;
              this.residentPhoto = safe2 || this.residentPhoto;
              try { if (safe2) data.residentPhoto = safe2; } catch (e) {}
              // console.log('Resident Data (matched object):', this.residentData);
            }
          }
        } catch (e) {
          // console.error('Error processing residentData subscription:', e);
        }
      });
    }
    // Note: queryParams subscription above already extracted residentPhoto; log current values
    // console.log('House Name:', this.theHouseName);
    // console.log('House Leader Name:', this.houseLeaderName);
    // console.log('Resident Photo:', this.residentPhoto);
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  goToMessageCenter(): void {
    const residentIDnumber = this.residentData?.recordNumber2?.value; // Get the correct record number
    const residentName = this.residentData?.residentFullName?.value || 'Unknown Resident';
    
    // console.log('Navigating to Message Center with resident ID:', residentIDnumber);
    // console.log('Resident Name:', residentName);
    // console.log('House Name:', this.theHouseName);
    
    // Pass comprehensive data for the message center
    try {
      const pid = this.residentData?.recordNumber2?.value || this.residentData?.recordNumber || this.residentData?.id || '';
      const photo = this.residentData?.residentPhoto;
      if (photo && pid) {
        try { this.photoStorageService.setPhoto(String(pid), photo); } catch (e) {}
        try { sessionStorage.setItem(`residentPhoto_${pid}`, photo); } catch (e) {}
      }
    } catch (e) {}
    const clone3 = Object.assign({}, this.residentData);
    if (clone3) clone3.residentPhoto = undefined;
    this.router.navigate(['/message.center'], { 
      state: { 
        residentIDnumber: residentIDnumber,
        residentData: clone3
      },
      queryParams: {
        residentName: residentName,
        theHouseName: this.theHouseName,
        recordNumber2: residentIDnumber
      }
    });
  }

  navigateToExpenseReceipt(): void {
    this.router.navigate(['/expense-receipt']);
  }

  async ionViewWillEnter() {
    const last = this.quickbaseService.getLastResidentSearch();
    const staff = this.userService.getParticipantInfo();
    this.residentSearch?.restoreFromCache();
  }

  /**
   * Restore clock state from today's punches on the validated STE record.
   * Enables the button only after the lookup succeeds; on failure the button
   * stays disabled and we do not assume the staff member is clocked out.
   */
  private restoreTimeClockState(steRecordId: any) {
    this.quickbaseService.getStaffTimePunches(steRecordId).subscribe(
      (punches: any[]) => {
        const sorted = (punches || []).slice().sort((a: any, b: any) => {
          const ta = new Date(a['10']?.value ?? a['10']).getTime() || 0;
          const tb = new Date(b['10']?.value ?? b['10']).getTime() || 0;
          if (ta !== tb) {
            return ta - tb;
          }
          return (Number(a['3']?.value ?? a['3']) || 0) - (Number(b['3']?.value ?? b['3']) || 0);
        });
        this.punchTimeline = sorted.map((p: any) => ({
          type: String(p['9']?.value ?? p['9'] ?? ''),
          ts: new Date(p['10']?.value ?? p['10'])
        })).filter((p: any) => !isNaN(p.ts.getTime()));
        this.computeDailyStats();
        const latest = sorted.length ? sorted[sorted.length - 1] : null;
        const latestType = latest ? String(latest['9']?.value ?? latest['9'] ?? '') : '';
        if (latestType.toLowerCase() === 'clock in') {
          const ts = new Date(latest['10']?.value ?? latest['10']);
          const punchIsToday = isNaN(ts.getTime()) || this.laDateStr(ts) === this.laDateStr(new Date());
          if (punchIsToday) {
            this.clockedIn = true;
            this.clockInTime = isNaN(ts.getTime()) ? new Date() : ts;
            this.updateElapsed();
            this.elapsedTimer = setInterval(() => this.updateElapsed(), 1000);
          } else {
            // Open Clock In from a previous Pacific day — alert, leave the
            // prior-day record untouched, and let staff clock in fresh today.
            this.showForgotClockOutAlert();
          }
        }
        this.steReady = true;
      },
      (error: any) => {
        console.error('Failed to restore time clock state', error);
        this.timeEntryStatus = 'TIME CLOCK STATUS UNAVAILABLE — RELOAD TO RETRY';
      }
    );
  }

  /**
   * Best-effort GPS capture for a punch. Always resolves — permission denial,
   * timeout, or geocode failure never blocks the punch from being saved.
   */
  private capturePunchLocation(): Promise<{ latitude?: number; longitude?: number; address?: string; accuracyFeet?: number }> {
    return new Promise(resolve => {
      try {
        if (!navigator?.geolocation) {
          resolve({});
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const location: any = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude
            };
            if (typeof pos.coords.accuracy === 'number' && isFinite(pos.coords.accuracy)) {
              location.accuracyFeet = Math.round(pos.coords.accuracy * 3.28084);
            }
            this.quickbaseService.reverseGeocodeAddress(location.latitude, location.longitude).subscribe(
              (address) => {
                if (address) {
                  location.address = address;
                }
                resolve(location);
              }
            );
          },
          () => resolve({}),
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
      } catch (e) {
        resolve({});
      }
    });
  }

  toggleClock() {
    if (this.processing || !this.steReady) {
      return;
    }
    this.processing = true;
    this.timeEntryStatus = '';

    const punchType = this.clockedIn ? 'Clock Out' : 'Clock In';
    // Capture the punch timestamp at tap time; GPS may take a few seconds.
    const punchTimestamp = new Date().toISOString();

    this.capturePunchLocation().then(location => {
      this.quickbaseService.createStaffTimePunch(this.steRecordId, punchType, location, punchTimestamp).subscribe(
        () => {
          this.processing = false;
          this.punchTimeline.push({type: punchType, ts: new Date(punchTimestamp)});
          this.computeDailyStats();
          if (this.clockedIn) {
            this.clockedIn = false;
            this.clockInTime = null;
            this.elapsedText = '';
            if (this.elapsedTimer) {
              clearInterval(this.elapsedTimer);
              this.elapsedTimer = null;
            }
          } else {
            this.clockedIn = true;
            this.tenHourAlertShown = false;
            this.clockInTime = new Date(punchTimestamp);
            this.updateElapsed();
            this.elapsedTimer = setInterval(() => this.updateElapsed(), 1000);
          }
        },
        (error: any) => {
          console.error(`${punchType} punch failed`, error);
          this.processing = false;
          this.timeEntryStatus = `${punchType.toUpperCase()} FAILED — TRY AGAIN`;
        }
      );
    });
  }

  private updateElapsed() {
    if (!this.clockInTime) {
      this.elapsedText = '';
      return;
    }
    const totalMin = Math.max(0, Math.floor((Date.now() - this.clockInTime.getTime()) / 60000));
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    this.elapsedText = `${h}h ${String(m).padStart(2, '0')}m`;
    this.computeDailyStats();
    this.checkTenHourReminder();
  }

  /**
   * One-time reminder once a clock-in session passes 10 hours. Runs from the
   * elapsed ticker while clocked in and right after state restore, so it also
   * fires when the app is reopened already past the threshold. Dismissal-only;
   * never clocks the employee out.
   */
  private checkTenHourReminder() {
    if (this.tenHourAlertShown || !this.clockedIn || !this.clockInTime) {
      return;
    }
    if (Date.now() - this.clockInTime.getTime() < 10 * 60 * 60 * 1000) {
      return;
    }
    this.tenHourAlertShown = true;
    this.alertCtrl.create({
      message: "You've been clocked in for 10 hours. If you've finished working, please remember to CLOCK OUT.",
      buttons: ['OK']
    }).then(alert => alert.present());
  }

  /**
   * Derive daily totals and the completed session list from the punch
   * timeline. Pairs Clock In -> next Clock Out; an unmatched Clock Out is
   * ignored, a superseded Clock In is dropped, and a trailing open Clock In
   * counts as the active session through "now".
   */
  private computeDailyStats() {
    const sessions: { start: Date; end: Date; durText: string }[] = [];
    let openIn: Date | null = null;
    let lastOut: Date | null = null;
    let breakMs = 0;
    let workedMs = 0;

    for (const p of this.punchTimeline) {
      const t = p.type.toLowerCase();
      if (t === 'clock in') {
        openIn = p.ts;
        if (lastOut && p.ts.getTime() > lastOut.getTime()) {
          breakMs += p.ts.getTime() - lastOut.getTime();
        }
      } else if (t === 'clock out' && openIn && p.ts.getTime() > openIn.getTime()) {
        const dur = p.ts.getTime() - openIn.getTime();
        sessions.push({start: openIn, end: p.ts, durText: this.formatHm(dur)});
        workedMs += dur;
        lastOut = p.ts;
        openIn = null;
      }
    }
    if (openIn && this.laDateStr(openIn) === this.laDateStr(new Date())) {
      workedMs += Math.max(0, Date.now() - openIn.getTime());
    }
    this.todaySessions = sessions;
    this.workedTodayText = this.formatHm(workedMs);
    this.breaksTodayText = this.formatHm(breakMs);
  }

  /**
   * Independent check of yesterday's STE: if its latest punch is an open
   * Clock In, alert once per login session. Read-only — yesterday's STE and
   * punches are never modified. Missing STE/punches or query errors continue
   * silently.
   */
  private checkMissedClockOutYesterday(staffRecordId: any) {
    const flagKey = 'HOMMA__MISSED_CLOCKOUT_ALERT';
    try {
      if (sessionStorage.getItem(flagKey)) {
        return;
      }
    } catch (e) {}
    this.quickbaseService.getYesterdayStaffTimeEntry(staffRecordId).subscribe(
      (entries: any[]) => {
        if (!entries || entries.length !== 1) {
          return;
        }
        const yRid = entries[0]['3']?.value ?? entries[0]['3'];
        this.quickbaseService.getStaffTimePunches(yRid).subscribe(
          (punches: any[]) => {
            const sorted = (punches || []).slice().sort((a: any, b: any) => {
              const ta = new Date(a['10']?.value ?? a['10']).getTime() || 0;
              const tb = new Date(b['10']?.value ?? b['10']).getTime() || 0;
              if (ta !== tb) {
                return ta - tb;
              }
              return (Number(a['3']?.value ?? a['3']) || 0) - (Number(b['3']?.value ?? b['3']) || 0);
            });
            const latest = sorted.length ? sorted[sorted.length - 1] : null;
            const latestType = latest ? String(latest['9']?.value ?? latest['9'] ?? '') : '';
            if (latestType.toLowerCase() === 'clock in') {
              try {
                sessionStorage.setItem(flagKey, '1');
              } catch (e) {}
              // Flag yesterday's STE (fid 63) before alerting — but only claim
              // it was flagged if the write (or an existing flag) confirms it.
              const alreadyFlagged = entries[0]['63']?.value === true || entries[0]['63'] === true;
              if (alreadyFlagged) {
                this.presentMissedClockOutAlert(true);
                return;
              }
              this.quickbaseService.markStaffTimeEntryMissedClockOut(yRid).subscribe(
                () => this.presentMissedClockOutAlert(true),
                (err) => {
                  console.error('Failed to flag yesterday STE for missed clock-out', err);
                  this.presentMissedClockOutAlert(false);
                }
              );
            }
          },
          () => {}
        );
      },
      () => {}
    );
  }

  /**
   * Missed clock-out alert. `flagged` true means fid 63 on yesterday's STE is
   * confirmed set (already checked or write succeeded); false means the flag
   * could not be saved so the copy stays non-committal. Dismissal-only.
   */
  private presentMissedClockOutAlert(flagged: boolean) {
    const message = flagged
      ? 'You forgot to clock out yesterday. That time entry has been flagged for review. You may clock in today.'
      : 'You forgot to clock out yesterday. That time entry needs review. You may clock in today.';
    this.alertCtrl.create({ message, buttons: ['OK'] }).then(alert => alert.present());
  }

  private laDateStr(d: Date): string {
    return d.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  }

  /**
   * Latest punch was an open Clock In from a previous Pacific day. Do not
   * write a Clock Out or alter the old record — flagging for supervisor
   * review isn't implemented yet, so the copy says "needs review". On OK the
   * UI resets to a fresh green CLOCK IN against today's validated STE.
   */
  private showForgotClockOutAlert() {
    this.alertCtrl.create({
      message: 'You forgot to clock out on a previous day. That time entry needs review. You can clock in for today.',
      buttons: [{
        text: 'OK',
        handler: () => {
          this.clockedIn = false;
          this.clockInTime = null;
          this.elapsedText = '';
        }
      }]
    }).then(alert => alert.present());
  }

  private formatHm(ms: number): string {
    const totalMin = Math.max(0, Math.floor(ms / 60000));
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${h}h ${String(m).padStart(2, '0')}m`;
  }

  ngOnDestroy() {
    if (this.elapsedTimer) {
      clearInterval(this.elapsedTimer);
      this.elapsedTimer = null;
    }
  }


  clearCache() {
    this.residentData = null;
    this.theHouseName = '';
    this.houseLeaderName = '';
    this.houseLeaderPhone = '';
    this.residentPhoto = undefined;
    this.isResident = false;
    // console.log('Cache cleared');
  }
}
