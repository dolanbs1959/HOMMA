import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { VersionService } from 'src/app/services/version.service';
import { Router } from '@angular/router';
import { QuickbaseService } from '../services/quickbase.service';
import { Subscription, Observable, concatMap, map, tap } from 'rxjs';
import { UserService } from 'src/app/services/user.service'; // Import UserService
import { AnalyticsService } from 'src/app/services/analytics.service'; // Import AnalyticsService
import { HttpClient } from '@angular/common/http';
import { LoggerService } from '../services/logger.service';
import { LoadingService } from 'src/app/services/loading.service';
import { PhotoStorageService } from 'src/app/services/photoProcessing.service';
import { SecureStorageService } from 'src/app/services/secure-storage.service';
import { UpdateService } from 'src/app/services/update.service';

interface BibleVerseResponse {
  // translation: {
  //   name: string;
  // };
  random_verse: {
    book_id: string;
    chapter: number;
    verse: number;
    text: string;
  };
}

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})

export class LoginPage implements OnInit, OnDestroy {
  @ViewChild('staffInput', { static: false }) staffInput!: ElementRef;
  
  houseNames$: Observable<string[]>;
  houseNames: string[] = [];
  housename: string = '';
  staffID: string = '';
  HLphone: string = '';
  maxMeetingDate: string = '';
  errorMessage: string = '';
  recordNumber: number = 0;
  savedRecordNumber: number = 0;
  userType = ''; 
  email: string = '';
  password: string = '';
  showPassword = false;
  showStaffId = false;
  isDisabled: boolean = true; // Set this to true or false based on your logic
  dailyVerse: string = '';
  staticVerse: string = 'For I was an hungred, and ye gave me meat: I was thirsty, and ye gave me drink: I was a stranger, and ye took me in. Matthew 25:35, KJV';
  rememberDevice: boolean = false;
  storageBackend: string = 'unknown';
  shortVersion = '';
  
  selectUserType(type: string) {
    this.userType = type;
  }

  onHouseSelected() {
    this.logger.log('House selected:', this.housename);
    // Focus on the Staff ID input after house selection
    setTimeout(() => {
      if (this.staffInput && this.staffInput.nativeElement) {
        this.staffInput.nativeElement.setFocus();
      }
    }, 100);
  }

constructor(
  private router: Router,
  private quickbaseService: QuickbaseService,
  private userService: UserService, // Inject UserService
  private analytics: AnalyticsService, // Inject AnalyticsService
  private http: HttpClient,
  private logger: LoggerService,
  private photoStorageService: PhotoStorageService,
  private secureStorage: SecureStorageService,
  private loadingService: LoadingService
  , private updateService: UpdateService
  , private alertCtrl: AlertController
  , private versionService: VersionService
) {
  this.houseNames$ = this.quickbaseService.getHouseNames().pipe(
    // tap(response => this.logger.log('API response:', response)),
    map(response => response.houseNames) // Extract just the house names array
  );
}

fetchRandomVerse() {
  this.http.get<BibleVerseResponse>('https://bible-api.com/data/kjv/random/MAT,MRK,LUK,JHN')
    .subscribe(
      (response: BibleVerseResponse) => {
        const { text, book_id, chapter, verse } = response.random_verse;
        // const { name } = response.translation;
        
        this.dailyVerse = `${text.trim()} ${book_id} ${chapter}:${verse} ${name}`;
      },
      (error) => {
        this.logger.error('Error fetching Bible verse', error);
        this.dailyVerse = 'Failed to load daily verse.';
      }
    );
}


navigateToHelpDesk() {
  this.router.navigate(['/help-desk']);
}

onLogin() {
  this.userService.setUserInfo(this.housename, this.staffID); // Store user info in UserService
  this.router.navigate(['/home'], { 
    state: { 
      isResident: false 
    } 
  });
}

ngOnInit() {
    this.quickbaseService.errorMessage$.subscribe((errorMessage) => {
      this.errorMessage = errorMessage;
    
    });

    this.fetchRandomVerse();

    // Initialize secure storage and prefill stored staffID if available
    this.secureStorage.init().then(() => {
      this.secureStorage.get('staffID').then(val => {
        if (val) this.staffID = val;
      });
      // Detect likely storage backend for on-screen debugging
      this.detectStorageBackend();
    });
    
    // Pre-fetch and cache Senior Staff data for participant login checks
    this.quickbaseService.getActiveStaff().subscribe(
      () => this.logger.log('Senior Staff data cached for login'),
      (error: any) => this.logger.error('Error caching Senior Staff data', error)
    );

    // get a short version to display in the header
    try {
      this.versionService.getVersion().then(v => {
        if (v) {
          const m = String(v).match(/^(\d+\.\d+\.\d+)/);
          this.shortVersion = m ? m[0] : v;
        }
      }).catch(() => {});
    } catch (e) {}

//      // console.log('Submitting form with housename:', this.housename, 'and staffID:', this.staffID);
  }

  async showVersionAlert() {
    try {
      const ver = await this.versionService.getVersion();
      const short = String(ver).match(/^(\d+\.\d+\.\d+)/)?.[0] || ver || 'unknown';
      const copyText = `App version: ${short}`;
      const messageText = `App version: ${short}\n\nProperty of House of Mercy - Copyright 2026`;
      const alert = await this.alertCtrl.create({
        header: 'About',
        message: messageText,
        cssClass: 'about-alert',
        buttons: [
          {
            text: 'Report',
            handler: async () => {
              try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  await navigator.clipboard.writeText(copyText);
                } else {
                  const ta = document.createElement('textarea');
                  ta.value = copyText;
                  document.body.appendChild(ta);
                  ta.select();
                  document.execCommand('copy');
                  document.body.removeChild(ta);
                }
              } catch (e) {
                // ignore copy errors
              }
            }
          },
          { text: 'Close', role: 'cancel' }
        ]
      });
      await alert.present();
    } catch (e) {}
  }
  
  login() {
    this.logger.log('Login attempt for house:', this.housename);
    this.loadingService.show();

    this.quickbaseService.query(this.housename, this.staffID).subscribe(
        response => {
        if (response) {
          const theHouseName = response.theHouseName?.value;
          const HouseLeaderName = response.HouseLeaderName?.value;
          const HouseLeaderRecordId = response.HouseLeaderRecordId?.value; // Get house leader record ID from login query
          const HLphone = response.HLphone?.value;
          this.recordNumber = response.recordNumber;
          this.savedRecordNumber = this.recordNumber;
          this.maxMeetingDate = response.maxMeetingDate?.value;
          this.logger.log('Login successful');
          // Persist staffID only if the user explicitly opts in via "Remember this device"
          try {
            if (this.rememberDevice) {
              this.secureStorage.set('staffID', this.staffID);
            } else {
              // Ensure we don't leave a saved value behind from previous runs
              try { this.secureStorage.remove('staffID'); } catch (e) {}
            }
          } catch (e) {}
          
          // Store the response from the first query
          this.quickbaseService.queryData = response;

          this.quickbaseService.getResidents(this.savedRecordNumber).subscribe(
            residentResponse => {
              try {
                // Coerce the response to an array for downstream consumers (handles {data:[]} or [...] shapes)
                const residents = Array.isArray(residentResponse) ? residentResponse : (residentResponse?.data || []);
                const len = Array.isArray(residents) ? residents.length : (residents ? 1 : 0);
                this.logger.log('Resident data loaded - length:', len);
                if (Array.isArray(residents) && residents.length > 0) {
                  this.logger.debug('Resident sample:', residents[0]);
                } else {
                  this.logger.debug('Resident response (non-array):', residentResponse);
                }
                this.quickbaseService.residentData.next(residents);
                // Ensure update checks run after resident data is populated to avoid
                // exporting an empty snapshot during forced updates.
                try { this.updateService.initOnLogin(); } catch (e) {}
              } catch (e) {
                this.logger.warn('Error processing residentResponse', e);
                this.quickbaseService.residentData.next([]);
              }
            },
          );
          // Persist minimal session info so pages survive a refresh or installed PWA lifecycle
          try {
            localStorage.setItem('savedRecordNumber', String(this.savedRecordNumber));
            if (theHouseName) localStorage.setItem('theHouseName', String(theHouseName));
            if (HouseLeaderName) localStorage.setItem('HouseLeaderName', String(HouseLeaderName));
            if (HLphone) localStorage.setItem('HLphone', String(HLphone));
          } catch (e) {
            this.logger.warn('Failed to persist session info to localStorage', e);
          }
          this.quickbaseService.getPendingArrivals(this.savedRecordNumber).subscribe(
            pendingArrivalsResponse => {
              // Use diagnostic wrapper to publish pending arrivals
              try { this.quickbaseService.publishPendingArrivals(pendingArrivalsResponse); } catch (e) { this.quickbaseService.pendingArrivals.next(pendingArrivalsResponse); }
              this.logger.log('Pending arrivals loaded');
            },
          );
          if (theHouseName && HouseLeaderName && HLphone) {
            this.quickbaseService.getMaxMeetingDate(theHouseName).subscribe(response => {
              this.maxMeetingDate = response.data[0]?.['40'].value;
              this.logger.log('Meeting date loaded');
              
              // Track user login in Google Analytics
              const userId = `houseleader_${theHouseName}_${this.staffID}`;
              this.analytics.setUser(userId);
              this.analytics.setUserProperty('user_type', 'house_leader');
              this.analytics.setUserProperty('house_name', theHouseName);
              this.analytics.setUserProperty('house_leader', HouseLeaderName);
              this.analytics.logEvent('login', {
                method: 'staff_credentials',
                house_name: theHouseName,
                user_type: 'house_leader'
              });
              
              this.loadingService.hide();
              this.router.navigate(['/home', { theHouseName, HouseLeaderName, HouseLeaderRecordId, HLphone, maxMeetingDate: this.maxMeetingDate }]);
            });
          }
        } else {
          this.logger.error('Login failed - no data found');
          this.loadingService.hide();
        }
        
      },
      error => {
        this.logger.error('Login API Error', error);
        this.loadingService.hide();
      }
    );
 
  }
  
  onResidentLogin() {
    this.logger.log('=== RESIDENT LOGIN ATTEMPT ===');
    this.logger.log(`Email entered: "${this.email}"`);
    this.loadingService.show();
    
    const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!emailPattern.test(this.email)) {
      this.logger.warn('Email validation failed - invalid format');
      alert('Please enter a valid email address');
      this.loadingService.hide();
      return;
    }
    this.logger.log('Email format validation passed');
  
    // Log the current state of cached activeStaff before login check
    const cachedStaff = this.quickbaseService.activeStaff.value;
    this.logger.log(`Cached activeStaff before login check:`, cachedStaff);
    this.logger.log(`Number of cached staff records: ${cachedStaff ? cachedStaff.length : 0}`);
  
    this.quickbaseService.getResidentsByEmail(this.email, this.password).subscribe(
      response => {
        this.logger.log('getResidentsByEmail response:', response);
        
        if (response && response.length > 0) {
          const resident = response[0];
          this.logger.log('Resident record found:', resident);
          this.logger.log('residentPassword field:', resident.residentPassword);
  
          // Assuming the password is stored in a property called 'value'
          const enteredPassword = String(this.password).trim();
          const residentPassword = String(resident.residentPassword?.value ?? resident.residentPassword ?? '').trim();
          
          this.logger.log(`Password comparison:`);
          this.logger.log(`  Entered password: "${enteredPassword}" (length: ${enteredPassword.length})`);
          this.logger.log(`  Stored password: "${residentPassword}" (length: ${residentPassword.length})`);
          this.logger.log(`  Match: ${residentPassword === enteredPassword}`);
    
          if (residentPassword === enteredPassword) {
            this.recordNumber = resident.residentIDnumber.value;
            this.logger.log(`Password match - Record ID: ${this.recordNumber}`);
            
            // Store participant info in UserService
            const participantEmail = this.email;
            const participantRecordId = resident.residentIDnumber.value;
            const participantFullName = resident.residentFullName?.value || 'Unknown';
            
            // Check if this resident is a Senior Staff member (by matching record ID against staff Related Participant fid 9)
            // checkIsSeniorStaff returns the staff record ID if found, or 0 if not staff
            this.logger.log(`Checking Senior Staff status for resident record ID: ${participantRecordId}`);
            const staffRecordId = this.userService.checkIsSeniorStaff(participantRecordId);
            const isStaff = staffRecordId > 0;
            this.logger.log(`checkIsSeniorStaff returned: ${staffRecordId} (type: ${typeof staffRecordId}) for participantRecordId: ${participantRecordId} -> isStaff: ${isStaff}`);
            this.userService.setParticipantInfo(participantEmail, participantRecordId, participantFullName, isStaff, staffRecordId);
            this.logger.log(`=== LOGIN SUCCESSFUL - Senior Staff: ${isStaff}, Staff Record ID: ${staffRecordId} ===`);
            
            // Track participant login in Google Analytics
            const participantId = `participant_${resident.residentIDnumber.value}`;
            const participantName = resident.residentName?.value || 'Unknown';
            const houseName = resident.houseName?.value || 'Unknown';
            
            this.analytics.setUser(participantId);
            this.analytics.setUserProperty('user_type', 'participant');
            this.analytics.setUserProperty('house_name', houseName);
            this.analytics.setUserProperty('participant_name', participantName);
            this.analytics.logEvent('login', {
              method: 'participant_email',
              house_name: houseName,
              user_type: 'participant'
            });
  
                     // Call refreshAnnouncements() after successful login
          let announcementsData: any; // Declare announcementsData outside the subscription
          this.quickbaseService.refreshAnnouncements().subscribe(
            data => {
              announcementsData = data; // Assign data to announcementsData
              this.logger.log('Announcements refreshed for resident');

              // Persist resident photo separately and avoid shipping large binary data in navigation state
              try {
                const rid = resident?.residentIDnumber?.value || resident?.recordNumber2?.value || resident?.recordNumber || '';
                const photoVal = resident?.residentPhoto;
                if (photoVal && rid) {
                  try { this.photoStorageService.setPhoto(String(rid), photoVal); } catch (e) {}
                  try { sessionStorage.setItem(`residentPhoto_${rid}`, photoVal); } catch (e) {}
                }
              } catch (e) {}

              const residentClone = Object.assign({}, resident);
              if (residentClone) residentClone.residentPhoto = undefined;

              this.loadingService.hide();
              try { this.updateService.initOnLogin(); } catch (e) {}
              this.router.navigate(['/resident-detail'], { 
                state: { 
                  residentData: residentClone,
                  theHouseName: resident.houseName.value,
                  houseLeaderName: resident.houseLeaderName.value,
                  houseLeaderPhone: resident.houseLeaderPhone.value,
                  isResident: true,
                  announcements: announcementsData.data
                } 
              });
            },
            error => {
              this.logger.error('Error refreshing announcements', error);
              alert('Login successful, but an error occurred while refreshing announcements');
              // Navigate to resident detail without announcements
              // Persist photo and navigate without embedding it in state
              try {
                const rid = resident?.residentIDnumber?.value || resident?.recordNumber2?.value || resident?.recordNumber || '';
                const photoVal = resident?.residentPhoto;
                if (photoVal && rid) {
                  try { this.photoStorageService.setPhoto(String(rid), photoVal); } catch (e) {}
                  try { sessionStorage.setItem(`residentPhoto_${rid}`, photoVal); } catch (e) {}
                }
              } catch (e) {}

              const rClone = Object.assign({}, resident);
              if (rClone) rClone.residentPhoto = undefined;
              this.loadingService.hide();
              this.router.navigate(['/resident-detail'], {
                state: {
                  residentData: rClone,
                  theHouseName: resident.houseName.value,
                  houseLeaderName: resident.houseLeaderName.value,
                  houseLeaderPhone: resident.houseLeaderPhone.value,
                  isResident: true
                }
              });
            }
          );
          } else {
            this.loadingService.hide();
            alert('Invalid password');
          }
        } else {
          this.loadingService.hide();
          alert('The email address or password cannot be found. Please check your entry and try again.');
        }
      },
      error => {
        this.logger.error('Resident login API Error', error);
        this.loadingService.hide();
        alert('An error occurred while logging in');
      }
    );
  }

  ngOnDestroy() {
    // Cleanup if needed
  }
  
  // Simple heuristic to show which storage backend will likely be used at runtime
  detectStorageBackend() {
    const win = window as any;
    try {
      if (win.Capacitor && (win.Capacitor.Plugins?.SecureStorage || win.Capacitor.Plugins?.SecureStoragePlugin || win.Capacitor.Plugins?.SecureStorageEcho)) {
        this.storageBackend = 'CapacitorSecureStorage';
        return;
      }
      if (win.cordova && (win.cordova.plugins?.SecureStorage || win.plugins?.SecureStorage || win.SecureStorage || win.cordova?.SecureStorage)) {
        this.storageBackend = 'CordovaSecureStorage';
        return;
      }
    } catch (e) {}
    // otherwise assume web fallback
    this.storageBackend = 'localStorage';
  }
  
}