import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { QuickbaseService } from '../services/quickbase.service';
import { UserService } from '../services/user.service';
import { LoggerService } from '../services/logger.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-message-center',
  templateUrl: './message.center.component.html',
  styleUrls: ['./message.center.component.scss']
})
export class MessageCenterComponent implements OnInit, OnDestroy {
  messageForm: FormGroup;
  activeStaff: any[] = [];
  isSubmitting: boolean = false;
  residentData: any;
  residentName: string = '';
  theHouseName: string = '';
  private subscriptions: Subscription = new Subscription();

  constructor(
    private formBuilder: FormBuilder,
    private quickbaseService: QuickbaseService,
    private userService: UserService,
    private logger: LoggerService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location
  ) {
    this.messageForm = this.formBuilder.group({
      staff: ['', Validators.required],
      Comment: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit() {
    this.loadActiveStaff();
    this.loadRouteParams();
    this.subscribeToResidentData();
  }

  loadRouteParams() {
    // Handle data from both queryParams and router state
    this.route.queryParams.subscribe(params => {
      this.residentName = params['residentName'] || '';
      this.theHouseName = params['theHouseName'] || '';
      
      // Get recordNumber2 from queryParams if available
      const recordNumber2FromQuery = params['recordNumber2'];
      if (recordNumber2FromQuery) {
        this.residentData = {
          recordNumber2: { value: recordNumber2FromQuery }
        };
      }
    });

    // Also check for data passed via router state
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history?.state;
    
    if (state && state.residentIDnumber) {
      // Handle the current navigation pattern from resident detail
      this.residentData = {
        recordNumber2: { value: state.residentIDnumber }
      };
    } else if (state && state.residentData) {
      // Handle full residentData object if passed
      this.residentData = state.residentData;
      this.residentName = state.residentData.residentFullName?.value || this.residentName;
    }

    // console.log('Message Center - Resident Data:', this.residentData);
    // console.log('Message Center - Record Number:', this.residentData?.recordNumber2?.value);
  }

  loadActiveStaff() {
    // Exclude any Faulk entries and apply specific renames (case-insensitive)
    const exclusions = ['faulk'];
    const renameMap: Record<string, string> = {
      'barry dolan': 'Database Administrator'
    };

    const userInfo = this.userService.getUserInfo();
    const myStaffId = userInfo?.staffId ?? null;

    this.quickbaseService.getActiveStaff().subscribe(
      (staff) => {
        this.activeStaff = (staff || []).map((s: any) => {
          const displayName = s.displayName || '';
          const isDbAdmin = displayName.toString().toLowerCase() === 'database administrator';
          // keep the base display name for special-case checks
          let baseName = isDbAdmin ? 'Barry Dolan' : displayName;

          // Append feedbackRole in parentheses; provide both plain and HTML variants for rendering
          const fid = s.feedbackRole ? String(s.feedbackRole).trim() : null;
          const namePlain = fid ? `${baseName} (${fid})` : baseName;
          const nameHtml = fid ? `${baseName} (<em>${fid}</em>)` : baseName;
          const value = s.email || s.staffRecordId || s.userId || '';
          const sendValue = isDbAdmin ? 'Database Administrator' : (s.email || s.userId || value);
          return { userId: value, name: namePlain, nameHtml, email: s.email, sendValue };
        });

      },
      (error) => {
        // console.error('Error loading active staff:', error);
      }
    );
  }

  subscribeToResidentData() {
    // Subscribe to the shared resident data from QuickbaseService
    // This ensures we have the most up-to-date resident information
    const residentDataSub = this.quickbaseService.residentData.subscribe(data => {
      if (data && Array.isArray(data) && data.length > 0) {
        // If we don't have resident data yet, try to find it from the shared data
        if (!this.residentData?.recordNumber2?.value) {
          // Use the first resident in the array if only one, or find by current route params
          this.residentData = data[0];
          this.residentName = this.residentData.residentFullName?.value || this.residentName;
          // console.log('Message Center - Resident data from service:', this.residentData);
        }
      } else if (data && typeof data === 'object' && !Array.isArray(data)) {
        // Single resident object
        this.residentData = data;
        this.residentName = this.residentData.residentFullName?.value || this.residentName;
        // console.log('Message Center - Single resident data from service:', this.residentData);
      }
    });
    this.subscriptions.add(residentDataSub);
  }

  submitMessage() {
    if (this.messageForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      const userInfo = this.userService.getUserInfo();
      const currentDate = new Date().toISOString();
      
      // Get the selected staff member's user ID (value set on the select)
      const selectedStaffUserId = this.messageForm.value.staff;
      // Trim any accidental whitespace from the selected value (handles names with extra spaces)
      const selectedStaffUserIdTrimmed = typeof selectedStaffUserId === 'string' ? selectedStaffUserId.trim() : selectedStaffUserId;
      // Find the matching staff object in the current list for debug/verification
      const selectedStaffObj = this.activeStaff.find(s => String(s.email || s.userId || s.sendValue) === String(selectedStaffUserIdTrimmed));
      // If the user selected 'Barry Dolan' (display) or 'Database Administrator' (sendValue),
      // resolve to the actual admin entry and send its email or id instead.
      let staffValueToSend = selectedStaffUserIdTrimmed;
      try {
        const selLower = String(selectedStaffUserIdTrimmed || '').toLowerCase();
        if (selLower.includes('barry dolan') || selLower.includes('database administrator')) {
          const svcList: any = (this.quickbaseService as any).activeStaff?.value || null;
          let adminEntry: any = null;
          if (Array.isArray(svcList)) {
            adminEntry = svcList.find((s: any) => ((s.displayName || s.name || '').toString().toLowerCase()) === 'database administrator');
          }
          if (!adminEntry && Array.isArray(this.activeStaff)) {
            adminEntry = this.activeStaff.find((s: any) => {
              const n = (s.name || '').toString().toLowerCase();
              const sv = (s.sendValue || '').toString().toLowerCase();
              return n.includes('barry dolan') || n.includes('database administrator') || sv.includes('database administrator');
            });
          }
          if (adminEntry) {
            staffValueToSend = adminEntry.email || adminEntry.userId || adminEntry.staffRecordId || (adminEntry.staffRecordId && adminEntry.staffRecordId.value) || adminEntry.sendValue || staffValueToSend;
            this.logger.debug('MessageCenter - replaced selected staff with Database Administrator value for send:', staffValueToSend);
          } else {
            this.logger.warn('MessageCenter - could not find Database Administrator entry; sending original selection', selectedStaffUserIdTrimmed);
          }
        }
      } catch (e) {
        this.logger.warn('MessageCenter - error while resolving Database Administrator email', e);
      }
      this.logger.log('MessageCenter - raw form value:', this.messageForm.value);
      this.logger.log('MessageCenter: selectedStaffUserId=', selectedStaffUserIdTrimmed, 'selectedStaffObj=', selectedStaffObj);
      // Add detailed debug info: lengths and types to detect truncation issues
      const rawComment = this.messageForm.value.Comment || '';
      this.logger.log('MessageCenter - Comment length:', rawComment.length, 'content:', rawComment);
      this.logger.log('MessageCenter - selectedStaffUserId type:', typeof selectedStaffUserIdTrimmed);
      
      // Prepare the communication data
      const residentRecordNumber = this.residentData?.recordNumber2?.value || '';
      // console.log('Resident Record Number for message:', residentRecordNumber);
      // console.log('Full Resident Data:', this.residentData);
      
      const communicationData = {
        6: { value: staffValueToSend }, // Staff Member field (resolved)
        8: { value: this.messageForm.value.Comment }, // Message content
        22: { value: currentDate }, // Date/Time sent
        // 6: { value: userInfo.userId || 'Unknown' }, // Sender ID
        26: { value: residentRecordNumber }, // Related resident record
        35: { value: 'HOMMA' }, // Source/Type
        9: { value: 'Open' } // Status
      };

      // Log the communicationData details (field lengths and JSON size)
      try {
        const serialized = JSON.stringify(communicationData);
        this.logger.log('MessageCenter - communicationData serialized length:', serialized.length);
        // show individual field lengths for easier debugging on Quickbase truncation
        Object.keys(communicationData).forEach(k => {
          const v: any = (communicationData as any)[k];
          const str = v && typeof v.value === 'string' ? v.value : JSON.stringify(v);
          this.logger.log('MessageCenter - field ' + k + ' length:', (str || '').length);
        });
      } catch (e) {
        this.logger.warn('Failed to serialize communicationData for logging', e);
      }
      // console.log('Submitting message:', communicationData);

      this.quickbaseService.insertCommunication(communicationData).subscribe(
        (response) => {
          // console.log('Message sent successfully:', response);
          this.messageForm.reset();
          this.isSubmitting = false;
          
          // Show success message or navigate back
          alert('Message sent successfully! The staff member will be notified and you will receive an email when they respond.');
          this.goBack();
        },
        (error) => {
          // console.error('Error sending message:', error);
          this.isSubmitting = false;
          alert('Error sending message. Please try again.');
        }
      );
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.messageForm.controls).forEach(key => {
        this.messageForm.get(key)?.markAsTouched();
      });
      
      if (this.messageForm.get('Comment')?.hasError('minlength')) {
        alert('Please enter a message with at least 10 characters.');
      } else if (this.messageForm.get('staff')?.hasError('required')) {
        alert('Please select a staff member.');
      } else if (this.messageForm.get('Comment')?.hasError('required')) {
        alert('Please enter a message.');
      }
    }
  }

  goBack() {
    this.location.back();
  }

  exitApp() {
    // Navigate to login or home page
    this.router.navigate(['/login']);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}