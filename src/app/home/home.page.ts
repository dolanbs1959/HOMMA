// home.page.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { QuickbaseService } from '../services/quickbase.service';
import { UserService } from '../services/user.service';
import { ThemeService } from '../services/theme.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router'; // Import ActivatedRoute
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { LoggerService } from '../services/logger.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
//  showError: boolean = false;
  HouseLeaderName: string = '';
  theHouseName: string = '';
  HLphone: string = '';
  residentData: any;
  residentPhoto: string = '';
  residentFullName: string = '';
  savedRecordNumber: number = 0;
  weeklyHouseMeeting: string = '';
  maxMeetingDate: string = '';
  STAalert: string = '';
  Alert: string = '';
  pendingArrivals: any;
  activeParticipants: any;
  announcements: any[] = [];

  // House KPI data
  houseKPIs: any = null;
  isLoadingKPIs: boolean = false;
  showKPIDetails: boolean = false; // Controls expanded view
  // Transport report
  transportRequests: any[] = [];
  scheduledRequests: any[] = [];
  openRequests: any[] = [];
  isLoadingTransportRequests: boolean = false;
  showTransportReport: boolean = false; // Collapsible, collapsed by default

  // Feedback form properties
  feedbackForm: FormGroup;
  activeStaff: any[] = [];
  isSubmittingFeedback: boolean = false;
  feedbackMessage: string = '';
  houseLeaderRecordId: string = ''; // Now retrieved directly from login query field 9
 
  constructor(
    public quickbaseService: QuickbaseService, 
    private route: ActivatedRoute, 
    private router: Router,
    private formBuilder: FormBuilder,
    private userService: UserService,
    public themeService: ThemeService,
    private logger: LoggerService
  ) {
    this.residentData = [];
    this.pendingArrivals = [];

    // Initialize feedback form
    this.feedbackForm = this.formBuilder.group({
      requestType: ['', Validators.required],
      staff: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(5)]] // Reduced from 10 to 5 characters
    });

    this.quickbaseService.residentData.subscribe(data => {
        this.residentData = data;
        this.logger.debug('Resident data updated');
    });
    this.quickbaseService.pendingArrivals.subscribe(data => {
      this.pendingArrivals = data;
      this.logger.debug('Pending arrivals updated');
    });
    
    this.STAalert = this.quickbaseService.STAalert;
    this.Alert = this.quickbaseService.Alert;
  }

  payNow() {
    window.location.href = 'https://houseofmercyministries.net/payments/';
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }
  
openStaffTasks() {
  // Subscribe to cached staff tasks
  this.quickbaseService.staffTasks.subscribe(cachedTasks => {
    if (cachedTasks && cachedTasks.data) {
      const tasks = cachedTasks.data.map((task: any) => {
        return {
          id: task[3].value,
          taskName: task[8].value,
          priority: task[15].value,
          status: task[22].value,
          role: task[32].value,
          houseName: task[36].value,
          frequency: task[47].value,
          p1on1sDue: task[263].value
        };
      });
    
      this.logger.debug('Tasks transformed for navigation');
      this.router.navigate(['/staff-tasks'], { state: { 
        tasks,
        theHouseName: this.theHouseName, 
        HouseLeaderName: this.HouseLeaderName, 
        HLphone: this.HLphone,
        maxMeetingDate: this.maxMeetingDate
      } });
    }
  });

  // Trigger API call (will use cache if fresh, or fetch new data)
  this.quickbaseService.getStaffTasks().subscribe(
    () => {
      this.logger.debug('Staff tasks loaded');
    },
    (error) => {
      this.logger.error('Error fetching staff tasks', error);
    }
  );
}

    exitApp() {
      this.router.navigate(['/login']);
    }
    
    ngOnInit() {
        // Subscribe to cached announcements - will fetch if cache is stale
        this.quickbaseService.refreshAnnouncements().subscribe(
          (response) => {
            this.logger.debug('Announcements loaded');
            this.announcements = response.data || [];
          },
          (error) => {
            this.logger.error('Error fetching announcements', error);
          }
        );

        // Use cached BehaviorSubject for announcements updates
        this.quickbaseService.announcements.subscribe(
          (announcementsData) => {
            if (announcementsData) {
              this.announcements = announcementsData.data || [];
            }
          }
        );

        // Load active staff for feedback form - will use cache if fresh
        this.loadActiveStaff();

        this.residentData = this.quickbaseService.residentData;
        this.pendingArrivals = this.quickbaseService.pendingArrivals;

    this.route.params.subscribe(params => {
      this.logger.debug('Route params loaded');
      this.theHouseName = params['theHouseName'];
      this.HouseLeaderName = params['HouseLeaderName'];
      this.houseLeaderRecordId = params['HouseLeaderRecordId'] || ''; // Get house leader record ID from login
      this.HLphone = params['HLphone'];
      this.maxMeetingDate = params['maxMeetingDate'];
      
      this.logger.debug('✅ House leader record ID loaded');
      
      // Load KPI data once we have the house name
      if (this.theHouseName) {
        this.loadHouseKPIs();
      }

      // Load transport requests for all houses (global Open/Scheduled)
      this.loadTransportRequests();
      });
  }

  toggleTransportReport() {
    this.showTransportReport = !this.showTransportReport;
  }

  loadTransportRequests() {
    // Subscribe to cached transport requests first
    this.quickbaseService.transportRequests.subscribe((cached: any) => {
      if (cached && cached.data) {
        this.transportRequests = cached.data || [];
        this.splitTransportRequests();
        this.logger.debug('Transport requests loaded from cache');
      }
    });

    this.isLoadingTransportRequests = true;
      this.quickbaseService.getTransportationRequests().subscribe(
      (response: any) => {
        this.transportRequests = response.data || [];
        this.splitTransportRequests();
        this.isLoadingTransportRequests = false;
        this.logger.debug('Transport requests refreshed');
      },
      (error: HttpErrorResponse) => {
        this.logger.error('Error fetching transport requests', error);
        this.isLoadingTransportRequests = false;
      }
    );
  }

  private splitTransportRequests() {
    const list = Array.isArray(this.transportRequests) ? this.transportRequests : [];
    this.scheduledRequests = list.filter(r => (r.status || '').toString().toLowerCase() === 'scheduled')
      .sort((a, b) => new Date(a.dateRequested).getTime() - new Date(b.dateRequested).getTime());
    this.openRequests = list.filter(r => (r.status || '').toString().toLowerCase() === 'open')
      .sort((a, b) => new Date(a.dateRequested).getTime() - new Date(b.dateRequested).getTime());
  }

  loadHouseKPIs() {
    if (!this.theHouseName) {
      this.logger.warn('Cannot load KPIs: No house name available');
      return;
    }

    // Try to get KPI data for this house from cached data
    const kpiData = this.quickbaseService.getHouseKPIsByName(this.theHouseName);
    if (kpiData) {
      this.houseKPIs = kpiData;
      this.isLoadingKPIs = false;
      this.logger.debug('House KPIs loaded from cache');
    } else {
      // If no cached data, the house data should be loaded when getHouseNames() was called during login
      this.logger.debug('No KPI data available for this house');
      this.isLoadingKPIs = false;
      this.houseKPIs = null;
    }
  }

  toggleKPIDetails() {
    this.showKPIDetails = !this.showKPIDetails;
  }

  loadActiveStaff() {
    // First subscribe to cached data
    this.quickbaseService.activeStaff.subscribe(
      (cachedStaff) => {
        if (cachedStaff) {
          this.activeStaff = cachedStaff.map((staffMember: any) => {
            // If the service earlier remapped the current user to "Database Administrator",
            // show the real name "Barry Dolan" in the UI but send the mapped value when selected.
            const isDbAdminLabel = staffMember.displayName === 'Database Administrator';
            let displayName = isDbAdminLabel ? 'Barry Dolan' : staffMember.displayName;
            if (staffMember.displayName === 'Michael Lovrick') {
              displayName = 'Michael Lovrick (Prayer Requests)';
            }
            return {
              userId: staffMember.userId,
              // Display the friendly name to users; keep 'Database Administrator' sent value if applicable
              name: displayName,
              email: staffMember.email,
              sendValue: isDbAdminLabel ? 'Database Administrator' : (staffMember.email || staffMember.userId)
            };
          });
          this.logger.debug('Active staff loaded from cache');
        }
      }
    );

    // Trigger API call (will use cache if fresh, or fetch new data)
    this.quickbaseService.getActiveStaff().subscribe(
      (staff) => {
        // Data is already cached by the service, so this just ensures fresh data if needed
        this.logger.debug('Active staff data refreshed');
      },
      (error) => {
        this.logger.error('Error loading active staff', error);
      }
    );
  }

  submitFeedback() {
    if (this.feedbackForm.valid && !this.isSubmittingFeedback) {
      this.isSubmittingFeedback = true;

      const userInfo = this.userService.getUserInfo();
      const currentDate = new Date().toISOString();
      
      // Get form values
      const selectedStaffUserId = this.feedbackForm.value.staff;
      const requestType = this.feedbackForm.value.requestType;
      const message = this.feedbackForm.value.message;
      
      // Concatenate request type at the beginning of message
      // Also read the native textarea value as a fallback because in some WebView/input cases
      // the FormControl value may not include the very latest keystroke. Prefer the DOM value
      // when it's longer to avoid accidental truncation.
      let rawDomMessage = (document.querySelector('textarea[formControlName="message"]') as HTMLTextAreaElement)?.value || '';
      if (!rawDomMessage) {
        // Try Ionic ion-textarea element value as fallback
        rawDomMessage = (document.querySelector('ion-textarea[formControlName="message"]') as any)?.value || '';
      }
      const finalMessageBody = rawDomMessage && rawDomMessage.length > (message || '').length ? rawDomMessage : message || '';
      // Map short requestType codes to full display labels so the inserted record
      // shows the complete request type (e.g. "Maintenance Request") instead of just "Maintenance".
      const requestTypeMap: any = {
        request: 'Prayer Request',
        feedback: 'Feedback',
        maintenance: 'Maintenance Request',
        support: 'Support Needed',
        suggestion: 'Suggestion',
        concern: 'Concern/Issue'
      };
      const requestTypeLabel = requestTypeMap[requestType] || requestType || '';
      const messageWithType = `${requestTypeLabel.toUpperCase()}: ${finalMessageBody}`;

      // Diagnostic: log the exact string and character codes to help diagnose truncation
      try {
        this.logger.log('Home - messageWithType length:', (messageWithType || '').length, 'content:', messageWithType);
        const codes = Array.from(messageWithType || '').map((c) => c.charCodeAt(0));
        this.logger.log('Home - messageWithType charCodes (first 200):', codes.slice(0, 200).join(','));
      } catch (e) {
        this.logger.warn('Home - failed to log messageWithType diagnostics', e);
      }
      
      // If user selected the visible name 'Barry Dolan', translate that to the
      // actual Quickbase assignment value by looking up the 'Database Administrator'
      // entry in the active staff list and using its email (preferred) or id.
      let staffValueToSend = selectedStaffUserId;
      try {
        const selectedIsBarry = (String(selectedStaffUserId || '')).toLowerCase() === 'barry dolan';
        const selectedIsDbAdmin = (String(selectedStaffUserId || '')).toLowerCase() === 'database administrator';
        if (selectedIsBarry || selectedIsDbAdmin) {
          // Try service cache first
          const svcList: any = (this.quickbaseService as any).activeStaff?.value || null;
          let adminEntry: any = null;
          if (Array.isArray(svcList)) {
            adminEntry = svcList.find((s: any) => {
              const dn = (s.displayName || s.name || '').toString().toLowerCase();
              return dn === 'database administrator';
            });
          }
          // Fallback to the HomePage-local `activeStaff` mapping
          if (!adminEntry && Array.isArray(this.activeStaff)) {
            adminEntry = this.activeStaff.find((s: any) => (s.name || '').toString().toLowerCase() === 'barry dolan' || (s.name || '').toString().toLowerCase() === 'database administrator');
          }
          if (adminEntry) {
            staffValueToSend = adminEntry.email || adminEntry.userId || adminEntry.sendValue || staffValueToSend;
            this.logger.debug('Replaced selected staff with Database Administrator value for send:', staffValueToSend);
          } else {
            this.logger.warn('Could not find Database Administrator entry in active staff cache; sending original selection:', selectedStaffUserId);
          }
        }
      } catch (e) {
        this.logger.warn('Error while resolving Database Administrator email', e);
      }

      // Prepare the communication data for house leader feedback
      const communicationData = {
        6: { value: staffValueToSend }, // Staff Member field
        8: { value: messageWithType }, // Feedback/Request content with type prefix
        22: { value: currentDate }, // Date/Time sent
        26: { value: this.houseLeaderRecordId || 'Unknown House Leader' }, // House Leader's record ID
        35: { value: 'HOMMA' }, // Source/Type - hard-coded as "HOMMA"
        9: { value: 'Open' } // Status
      };

      // Debug: log message lengths and serialized payload size to detect client-side truncation
      try {
        this.logger.log('Home - raw feedback message length (form):', (message || '').length, 'content:', message);
        this.logger.log('Home - raw feedback message length (dom):', (rawDomMessage || '').length, 'content:', rawDomMessage);
        this.logger.log('Home - finalMessageBody length:', (finalMessageBody || '').length, 'content:', finalMessageBody);
        const serialized = JSON.stringify(communicationData);
        this.logger.log('Home - communicationData serialized length:', serialized.length);
        Object.keys(communicationData).forEach(k => {
          const v: any = (communicationData as any)[k];
          const str = v && typeof v.value === 'string' ? v.value : JSON.stringify(v);
          this.logger.log('Home - field ' + k + ' length:', (str || '').length);
        });
      } catch (e) {
        this.logger.warn('Home - failed to serialize communicationData for logging', e);
      }

      this.logger.debug('Submitting house leader feedback/request');

      this.quickbaseService.insertCommunication(communicationData).subscribe(
        (response) => {
          this.logger.debug('Feedback/Request sent successfully');
          this.feedbackForm.reset();
          this.isSubmittingFeedback = false;
          
          // Show success message above submit button
          const messageType = requestType === 'feedback' ? 'feedback' : 'request';
          this.feedbackMessage = `${messageType.charAt(0).toUpperCase() + messageType.slice(1)} sent successfully! The staff member will be notified and you will receive an email when they respond.`;
          
          // Clear message after 5 seconds
          setTimeout(() => {
            this.feedbackMessage = '';
          }, 5000);
        },
        (error) => {
          this.logger.error('Error sending feedback/request', error);
          this.isSubmittingFeedback = false;
          this.feedbackMessage = 'Error sending your submission. Please try again.';
          
          // Clear error message after 5 seconds
          setTimeout(() => {
            this.feedbackMessage = '';
          }, 5000);
        }
      );
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.feedbackForm.controls).forEach(key => {
        this.feedbackForm.get(key)?.markAsTouched();
      });
      
      if (this.feedbackForm.get('message')?.hasError('minlength')) {
        this.feedbackMessage = 'Please enter a message with at least 5 characters.';
      } else if (this.feedbackForm.get('staff')?.hasError('required')) {
        this.feedbackMessage = 'Please select a staff member.';
      } else if (this.feedbackForm.get('requestType')?.hasError('required')) {
        this.feedbackMessage = 'Please select a request type.';
      } else if (this.feedbackForm.get('message')?.hasError('required')) {
        this.feedbackMessage = 'Please enter your feedback or request.';
      }
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        this.feedbackMessage = '';
      }, 5000);
    }
  }

  navigateToDetail(id: string, ispendingArrival: boolean, residentName: string) {
    // Do NOT include large/base64 `residentPhoto` data in query params (causes huge analytics payloads and network errors).
    // The resident photo is cached in `PhotoStorageService`; pass only the record id and other small fields.
    const navigationExtras = {
      queryParams: {
        residentName: residentName,
        theHouseName: this.theHouseName,
        houseLeaderName: this.HouseLeaderName,
        houseLeaderRecordId: this.houseLeaderRecordId, // Pass house leader record ID from login query
        recordNumber2: id
      }
    };
    this.logger.debug('Navigating to resident detail');
  
    if (ispendingArrival) {
      this.router.navigate(['/resident-update', id], navigationExtras);
      this.logger.debug('Navigating to Resident Update');
    } else {
      this.router.navigate(['/home/resident-detail', id], navigationExtras);
      this.logger.debug('Navigating to Resident Detail');
    }
  }
}