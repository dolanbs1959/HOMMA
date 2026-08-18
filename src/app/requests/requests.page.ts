import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { QuickbaseService } from '../services/quickbase.service';
import { UserService } from '../services/user.service';
import { LoggerService } from '../services/logger.service';

@Component({
  selector: 'app-requests',
  templateUrl: './requests.page.html',
  styleUrls: ['./requests.page.scss'],
})
export class RequestsPage implements OnInit {
  feedbackForm: FormGroup;
  activeStaff: any[] = [];
  isSubmittingFeedback: boolean = false;
  feedbackMessage: string = '';
  houseLeaderRecordId: string = '';

  constructor(
    public quickbaseService: QuickbaseService,
    private formBuilder: FormBuilder,
    private userService: UserService,
    private logger: LoggerService
  ) {
    this.feedbackForm = this.formBuilder.group({
      requestType: ['', Validators.required],
      staff: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(5)]],
    });
  }

  ngOnInit() {
    const qd = this.quickbaseService.queryData;
    this.houseLeaderRecordId = qd?.HouseLeaderRecordId?.value || '';
    this.loadActiveStaff();
  }

  loadActiveStaff() {
    this.quickbaseService.activeStaff.subscribe(
      (cachedStaff) => {
        if (cachedStaff) {
          this.activeStaff = cachedStaff.map((staffMember: any) => {
            const isDbAdminLabel = staffMember.displayName === 'Database Administrator';
            const baseName = isDbAdminLabel ? 'Barry Dolan' : staffMember.displayName;
            const fid = staffMember.feedbackRole ? String(staffMember.feedbackRole).trim() : null;
            const displayNamePlain = fid ? `${baseName} (${fid})` : baseName;
            const displayNameHtml = fid ? `${baseName} (<em>${fid}</em>)` : baseName;
            return {
              userId: staffMember.userId,
              name: displayNamePlain,
              nameHtml: displayNameHtml,
              email: staffMember.email,
              sendValue: isDbAdminLabel ? 'Database Administrator' : (staffMember.email || staffMember.userId),
            };
          });
        }
      }
    );

    this.quickbaseService.getActiveStaff().subscribe(
      () => this.logger.debug('Active staff data refreshed'),
      (error) => this.logger.error('Error loading active staff', error)
    );
  }

  submitFeedback() {
    if (this.feedbackForm.valid && !this.isSubmittingFeedback) {
      this.isSubmittingFeedback = true;

      const userInfo = this.userService.getUserInfo();
      const currentDate = new Date().toISOString();

      const selectedStaffUserId = this.feedbackForm.value.staff;
      const requestType = this.feedbackForm.value.requestType;
      const message = this.feedbackForm.value.message;

      let rawDomMessage = (document.querySelector('textarea[formControlName="message"]') as HTMLTextAreaElement)?.value || '';
      if (!rawDomMessage) {
        rawDomMessage = (document.querySelector('ion-textarea[formControlName="message"]') as any)?.value || '';
      }
      const finalMessageBody = rawDomMessage && rawDomMessage.length > (message || '').length ? rawDomMessage : message || '';

      const requestTypeMap: any = {
        request: 'Prayer Request',
        feedback: 'Feedback',
        maintenance: 'Maintenance Request',
        support: 'Support Needed',
        suggestion: 'Suggestion',
        concern: 'Concern/Issue',
      };
      const requestTypeLabel = requestTypeMap[requestType] || requestType || '';
      const messageWithType = `${requestTypeLabel.toUpperCase()}: ${finalMessageBody}`;

      let staffValueToSend = selectedStaffUserId;
      try {
        const selLower = (String(selectedStaffUserId || '')).toLowerCase();
        const selectedIsBarry = selLower.includes('barry dolan');
        const selectedIsDbAdmin = selLower.includes('database administrator');
        if (selectedIsBarry || selectedIsDbAdmin) {
          const svcList: any = (this.quickbaseService as any).activeStaff?.value || null;
          let adminEntry: any = null;
          if (Array.isArray(svcList)) {
            adminEntry = svcList.find((s: any) => {
              const dn = (s.displayName || s.name || '').toString().toLowerCase();
              return dn === 'database administrator';
            });
          }
          if (!adminEntry && Array.isArray(this.activeStaff)) {
            adminEntry = this.activeStaff.find((s: any) => {
              const n = (s.name || '').toString().toLowerCase();
              const sv = (s.sendValue || '').toString().toLowerCase();
              return n.includes('barry dolan') || n.includes('database administrator') || sv.includes('database administrator');
            });
          }
          if (adminEntry) {
            staffValueToSend = adminEntry.email || adminEntry.userId || adminEntry.sendValue || staffValueToSend;
          }
        }
      } catch (e) {
        this.logger.warn('Error while resolving Database Administrator email', e);
      }

      let houseLeaderStaffId: any = '';
      try {
        const svcList: any = (this.quickbaseService as any).activeStaff?.value || null;
        if (Array.isArray(svcList)) {
          const match = svcList.find((s: any) => {
            const rel = (s.relatedParticipantId || '')?.toString();
            return rel === (this.houseLeaderRecordId || '').toString();
          });
          if (match) {
            houseLeaderStaffId = match.userId || '';
          }
        }
      } catch (e) {
        this.logger.warn('Error resolving House Leader Staff Record ID', e);
      }

      const communicationData = {
        6: { value: staffValueToSend },
        8: { value: messageWithType },
        22: { value: currentDate },
        26: { value: this.houseLeaderRecordId || 'Unknown House Leader' },
        36: { value: houseLeaderStaffId || '' },
        35: { value: 'HOMMA' },
        9: { value: 'Open' },
      };

      this.logger.debug('Submitting request/feedback');

      this.quickbaseService.insertCommunication(communicationData).subscribe(
        (response) => {
          this.logger.debug('Request/Feedback sent successfully');
          this.feedbackForm.reset();
          this.isSubmittingFeedback = false;
          const messageType = requestType === 'feedback' ? 'feedback' : 'request';
          this.feedbackMessage = `${messageType.charAt(0).toUpperCase() + messageType.slice(1)} sent successfully! The staff member will be notified and you will receive an email when they respond.`;
          setTimeout(() => (this.feedbackMessage = ''), 5000);
        },
        (error) => {
          this.logger.error('Error sending request/feedback', error);
          this.isSubmittingFeedback = false;
          this.feedbackMessage = 'Error sending your submission. Please try again.';
          setTimeout(() => (this.feedbackMessage = ''), 5000);
        }
      );
    } else {
      Object.keys(this.feedbackForm.controls).forEach((key) => {
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

      setTimeout(() => (this.feedbackMessage = ''), 5000);
    }
  }
}
