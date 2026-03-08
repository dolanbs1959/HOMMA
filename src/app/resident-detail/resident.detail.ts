import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'HOMMA-resident-detail',
  templateUrl: './resident.detail.html',
  styleUrls: ['./resident.detail.scss'],
})

export class ResidentDetailComponent  implements OnInit {
  residentData: any;
  theHouseName: string = '';
  houseLeaderName: string = '';
  houseLeaderPhone: string = '';
  houseLeaderRecordId: string = ''; // Add this property
  residentPhoto: string | undefined;
  isResident: boolean = false;
  isStaff: boolean = false;
  announcements: any[] = [];

  constructor(
    private router: Router,
    private location: Location,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private dialog: MatDialog,
    private photoStorageService: PhotoStorageService,
    private quickbaseService: QuickbaseService,
    private userService: UserService,
    public themeService: ThemeService
  ) {
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

  navigateToTransportation() {
    const participantName = this.residentData.residentFullName.value;
    const participantPhoto = this.residentData.residentPhoto;
    const participantId = this.residentData.recordNumber2.value;
    // Persist photo and navigate passing only identifiers; avoid sending photo data in query params.
    try {
      if (participantPhoto && participantId) {
        this.photoStorageService.setPhoto(String(participantId), participantPhoto);
        try {
          sessionStorage.setItem(`residentPhoto_${participantId}`, participantPhoto);
        } catch (e) {}
      }
    } catch (e) {}

    this.router.navigate(['/transportation'], { queryParams: { participantName, participantId, theHouseName: this.theHouseName, houseLeaderName: this.houseLeaderName, houseLeaderRecordId: this.houseLeaderRecordId } });
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

payNow() {
  window.location.href = 'https://houseofmercyministries.net/payments/';
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
    this.location.back();
  }

  ngOnInit(): void {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as {
      residentData: any,
      theHouseName: string,
      houseLeaderName: string,
      houseLeaderPhone: string,
      residentPhoto: string,
      isResident: boolean,
      announcements?: any[]
     };
    // Read query params early so we can show the passed photo immediately
    let queryParticipantId: string | null = null;
    this.route.queryParams.subscribe(params => {
      if (params['residentPhoto']) {
        this.residentPhoto = params['residentPhoto'];
      }
      // Extract house leader record ID from query params (passed from home page)
      if (params['houseLeaderRecordId']) {
        this.houseLeaderRecordId = params['houseLeaderRecordId'];
      }
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
      // Resolve safe photo src (may come from PhotoStorageService/sessionStorage)
      const safeSrc = this.photoStorageService.getSafeSrc(state.residentPhoto, this.residentData?.recordNumber2?.value);
      this.residentPhoto = safeSrc || '';
      // Ensure the template which checks `residentData.residentPhoto` sees the safe src too
      try {
        if (safeSrc) this.residentData.residentPhoto = safeSrc;
      } catch (e) {}
      this.isResident = state.isResident;
      this.isStaff = this.userService.isStaffUser();
      this.announcements = state.announcements || [];

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
