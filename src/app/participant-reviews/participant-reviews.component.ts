import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { QuickbaseService } from 'src/app/services/quickbase.service';
import { UserService } from 'src/app/services/user.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AlertController } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { PhotoStorageService } from 'src/app/services/photoProcessing.service';

@Component({
  selector: 'HOMMA-participant-reviews',
  templateUrl: './participant-reviews.component.html',
  styleUrls: ['./participant-reviews.component.scss'],
})
export class ParticipantReviewsComponent implements OnInit {
  private baseUrl = environment.baseUrl;
  private realm = environment.realm;
  private participantReviewsTableId = environment.participantReviewsTableID;

  fieldProperties: { [key: number]: any } = {};
  reportForm!: FormGroup;
  participantName!: string;
  // participantPhoto: string | undefined;
  participantEmail!: string;
  participantPhone!: string;
  ccoFullName!: string;
  ccoPhoneNumber!: string;
  ccoMobile!: string;
  ccoEmail: string | null = null;
  docStatus!: string;
  showCCOSection: boolean = true;
  ccoInfoRequired: boolean = false;
  workStatus!: SafeHtml;
  submissionMessage!: string;
  submissionErrorMessage: string = ''; // Add this property to store the submission error message
  participantId!: string;
  residentPhoto: string | undefined;
  last1on1Date!: Date;
  // track if a review was already submitted in this page instance
  submittedReviewRecordId: string | null = null;
  submissionInProgress: boolean = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private location: Location,
    private route: ActivatedRoute,
    private userService: UserService,
    private quickbaseService: QuickbaseService,
    private sanitizer: DomSanitizer,
    private photoStorageService: PhotoStorageService
    , private alertController: AlertController
  ) {
    this.reportForm = this.fb.group({
      status: ['Complete', Validators.required],
      updatePhoneNumber: [false],
      newPhoneNumber: [''],
      updateEmail: [false],
      newEmail: [''],
      onSupervision: ['', Validators.required],
      inSOTP: ['', Validators.required],
      inDATP: ['', Validators.required],
      inMentalHealthCounseling: ['', Validators.required],
      updateCCOName: [false],
      newCCOname: [''],
      updateCCOPhone: [false],
      newCCOphone: [''],
      updateCCOMobile: [false],
      newCCOmobile: [''],
      updateCCOEmail: [false],
      newCCOemail: [''],
      choreAssignment: [[], Validators.required],
      choreCompliance: [[], Validators.required],
      houseCurfew: [[], Validators.required],
      meeting_ProgrammingCompliance: [[], Validators.required],
      financialCompliance: [[], Validators.required],
      disclosedElectronicDevices: [[], Validators.required],
      meetingAdministrator: ['', Validators.required],
      howAdministered: ['', Validators.required],
      meetingNotes: ['', Validators.required],
      workStatus: [''],
      currentEmploymentStatus: [[], Validators.required],
      Goals: [[], Validators.required],
      hygieneIssues: [[], Validators.required],
      socialSkills: [[], Validators.required],
      behavioralObservations: [[], Validators.required],
      temperament: [[], Validators.required],
      leadershipPotential: [[], Validators.required]
    });
  }

  private updateReviewRecord(formData: any, recordId: string) {
    if (!recordId) {
      // fallback to create
      this.createReviewRecord(formData);
      return;
    }
    this.submissionInProgress = true;
    
    // Additional safeguard: If not on supervision, ensure CCO fields are cleared
    const isOnSupervision = formData.onSupervision === 'Yes';
    const ccoNameValue = isOnSupervision ? (formData.updateCCOName ? formData.newCCOname : '') : '';
    const ccoPhoneValue = isOnSupervision ? (formData.updateCCOPhone ? formData.newCCOphone : '') : '';
    const ccoMobileValue = isOnSupervision ? (formData.updateCCOMobile ? formData.newCCOmobile : '') : '';
    const ccoEmailValue = isOnSupervision ? (formData.updateCCOEmail ? formData.newCCOemail : '') : '';
    
    // Quickbase records update requires including the record ID in the payload
    const body = {
      to: this.participantReviewsTableId,
      data: [
        {
          3: { value: Number(recordId) },
          276: { value: formData.status },
          104: { value: formData.updatePhoneNumber ? formData.newPhoneNumber : '' },
          105: { value: formData.updateEmail ? formData.newEmail : '' },
          159: { value: formData.onSupervision },
          170: { value: formData.inSOTP },
          175: { value: formData.inDATP },
          174: { value: formData.inMentalHealthCounseling },
          287: { value: ccoNameValue },
          288: { value: ccoPhoneValue },
          112: { value: ccoMobileValue },
          113: { value: ccoEmailValue },
          282: { value: formData.choreAssignment },
          281: { value: formData.choreCompliance },
          283: { value: formData.houseCurfew },
          162: { value: formData.meeting_ProgrammingCompliance },
          214: { value: formData.financialCompliance },
          169: { value: formData.disclosedElectronicDevices },
          154: { value: formData.meetingAdministrator },
          298: { value: formData.howAdministered },
          178: { value: formData.meetingNotes },
          280: { value: formData.currentEmploymentStatus },
          216: { value: formData.Goals },
          161: { value: formData.hygieneIssues },
          163: { value: formData.socialSkills },
          167: { value: formData.behavioralObservations },
          165: { value: formData.temperament },
          213: { value: formData.leadershipPotential },
          147: { value: this.participantId }
        }
      ]
    };

    this.quickbaseService.callQuickbaseProxy('POST', 'records', body).subscribe({
      next: async (response: any) => {
        // console.log('Record updated:', response);
        this.submissionInProgress = false;
        const alert = await this.alertController.create({
          header: 'Review Updated',
          message: `Participant Review #${recordId} updated successfully.`,
          buttons: ['OK']
        });
        await alert.present();
      },
      error: (err) => {
        // console.error('Error updating record:', err);
        this.submissionInProgress = false;
      }
    });
  }

  ngOnInit() {
    // console.log('ngOnInit called');
    this.route.queryParams.subscribe(params => {
      this.participantName = params['participantName'];
      const workStatus = params['workStatus']; // Retrieve workStatus from query parameters
      this.reportForm.controls['workStatus'].setValue(workStatus); // Set workStatus in form control
      this.workStatus = this.sanitizer.bypassSecurityTrustHtml(workStatus); // Sanitize workStatus
      this.ccoFullName = params['ccoFullName'];
      this.ccoPhoneNumber = params['ccoPhoneNumber'];
      this.ccoMobile = params['ccoMobile'];
  // Read ccoEmail if passed from the resident detail navigation
  this.ccoEmail = params['ccoEmail'] || null;
      this.docStatus = params['docStatus'] || '';
      
      // console.log('CCO Data received:', {
      //   ccoFullName: this.ccoFullName,
      //   ccoPhoneNumber: this.ccoPhoneNumber,
      //   ccoMobile: this.ccoMobile,
      //   ccoEmail: this.ccoEmail,
      //   docStatus: this.docStatus
      // });
      
      // Process DOC status logic
      this.processDOCStatus();
      // console.log('DEBUG: Participant reviews loaded with animated controls');
      this.participantEmail = params['participantEmail'];
      this.participantPhone = params['participantPhone'];
      this.participantId = params['participantId'];
      // Prefer photo passed in params, but fall back to in-memory cache or sessionStorage
      this.residentPhoto = params['residentPhoto'];
      if ((!this.residentPhoto || this.residentPhoto === 'undefined') && this.participantId) {
        const cached = this.photoStorageService.getPhoto(String(this.participantId));
        if (cached) {
          this.residentPhoto = this.photoStorageService.getSafeSrc(cached, String(this.participantId)) || cached;
        } else {
          try {
            const fromSess = sessionStorage.getItem(`residentPhoto_${this.participantId}`);
            if (fromSess) {
              this.residentPhoto = this.photoStorageService.getSafeSrc(fromSess, String(this.participantId)) || fromSess;
              // also populate in-memory cache for future navigations
              try { this.photoStorageService.setPhoto(String(this.participantId), fromSess); } catch (e) {}
            }
          } catch (e) {
            // ignore sessionStorage errors
          }
        }
      }
      this.last1on1Date = params['Last1on1Date'];
      
      // console.log('Participant data:', {
      //   participantName: this.participantName,
      //   residentPhoto: this.residentPhoto,
      //   workStatus: this.workStatus,
      //   ccoFullName: this.ccoFullName,
      //   ccoPhoneNumber: this.ccoPhoneNumber,
      //   ccoMobile: this.ccoMobile,
      //   ccoEmail: this.ccoEmail,
      //   participantEmail: this.participantEmail,
      //   participantPhone: this.participantPhone,
      //   participantId: this.participantId
      // });
      // Check for recent reviews once we have the participantId from the navigation
      if (this.participantId) {
        this.checkRecentReviewsAndWarn(this.participantId);
      }
    });
    this.fetchFieldProperties();
  }

  private async checkRecentReviewsAndWarn(participantId: string) {
    if (!participantId) return;
    try {
      const recent = await this.queryRecentReviews(participantId, 5);
      if (recent) {
        const { recordId, daysAgo } = recent;
        const when = daysAgo === 0 ? 'today' : daysAgo === 1 ? 'yesterday' : `${daysAgo} days ago`;
        const alert = await this.alertController.create({
          header: 'Recent 1-on-1 Found',
          message: `A 1-on-1 for ${this.participantName} was recently completed (${when}). Do you wish to proceed?`,
          backdropDismiss: false,
          buttons: [
            {
              text: 'No',
              role: 'cancel',
              cssClass: 'secondary',
              handler: () => {
                // take them back to the previous page
                this.location.back();
              }
            },
            {
              text: 'Yes',
              handler: () => {
                // proceed -- do nothing
                // console.log('User chose to proceed despite recent review', recordId);
              }
            }
          ]
        });
        await alert.present();
      }
    } catch (err) {
      // console.error('Error checking recent reviews:', err);
      // don't block the user on errors
    }
  }

  private async queryRecentReviews(participantId: string, daysWindow: number): Promise<{recordId: string, daysAgo: number} | null> {
    // Build initial query for this participant
    const body: any = {
      from: this.participantReviewsTableId,
      select: [3],
      where: `{147.EX.'${participantId}'}`,
      options: {
        skip: 0,
        top: 50,
        sortBy: [{ fieldId: 3, order: 'DESC' }],
        compareWithAppLocalTime: false
      }
    };

    try {
  // compute cutoff date (UTC date-only) for daysWindow and format as MM-DD-YYYY for Quickbase
  const now = new Date();
  const cutoff = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  cutoff.setUTCDate(cutoff.getUTCDate() - daysWindow);
  const mm = String(cutoff.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(cutoff.getUTCDate()).padStart(2, '0');
  const yyyy = String(cutoff.getUTCFullYear());
  const cutoffQB = `${mm}-${dd}-${yyyy}`; // Quickbase uses MM-DD-YYYY in this instance

  // Ensure we select the review date field (fid 279)
  body.select = Array.from(new Set([...(body.select || []), 279]));

  // Add date filter to where clause: field 279 >= cutoff in MM-DD-YYYY
  const dateWhere = `{279.OAF.'${cutoffQB}'}`;
      if (body.where && body.where.length) {
        body.where = `(${body.where}) AND (${dateWhere})`;
      } else {
        body.where = dateWhere;
      }

  // console.log('queryRecentReviews cutoffQB:', cutoffQB, 'where:', body.where);
      // console.log('queryRecentReviews request body:', body);
      const resp: any = await this.quickbaseService.callQuickbaseProxy('POST', 'query', body).toPromise();
      // console.log('queryRecentReviews response raw:', resp);
      const records = resp?.data || [];
      // console.log(`queryRecentReviews found ${records.length} records`);
      if (!records.length) return null;

      // Find the most recent record that has a review date (prefer fid 279)
      let candidates: Array<{id: string, date: Date}> = [];
      for (const rec of records) {
        // console.log('record raw:', rec);
        // Prefer reading the review date from field 279 if present
        let createdRaw: any = null;
        try {
          if (rec?.fields && Array.isArray(rec.fields)) {
            for (const f of rec.fields) {
              // Quickbase may return field objects with id or fieldId
              const fid = f?.id ?? f?.fieldId ?? null;
              if (fid === 279 || fid === '279') {
                createdRaw = f.value ?? f?.valueDisplay ?? f;
                break;
              }
            }
          }
        } catch (e) {
          // console.warn('error checking rec.fields for 279', e);
        }

        // Fallback to top-level keyed field or metadata/createdTime
        if (!createdRaw) {
          createdRaw = rec?.['279']?.value ?? rec?.['279'] ?? null;
        }
        if (!createdRaw) {
          if (rec?.metadata) {
            createdRaw = rec.metadata?.createdTime || rec.metadata?.recordCreateTime || rec.metadata?.createTime || null;
          }
        }
        if (!createdRaw) createdRaw = rec?.createdTime || rec?.recordCreateTime || rec?.created || null;

        if (!createdRaw) continue; // can't determine a date for this record

        // createdRaw is often in MM-DD-YYYY format; handle that explicitly
        let createdDate: Date | null = null;
        if (typeof createdRaw === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(createdRaw)) {
          // parse MM-DD-YYYY
          const parts = createdRaw.split('-');
          const m = parseInt(parts[0], 10) - 1;
          const d = parseInt(parts[1], 10);
          const y = parseInt(parts[2], 10);
          createdDate = new Date(Date.UTC(y, m, d));
        } else {
          // fall back to Date constructor for ISO or other formats
          const tmp = new Date(createdRaw as any);
          if (!isNaN(tmp.getTime())) createdDate = tmp;
        }
        if (!createdDate) continue;

        // determine the record id (fid 3) from common locations
        const rid = rec['3']?.value ?? rec['3'] ?? (rec?.metadata && rec.metadata.recordId) ?? null;
        if (!rid) continue;
        candidates.push({ id: rid.toString(), date: createdDate });
      }

      if (!candidates.length) return null;
      // pick most recent by date
      candidates.sort((a,b) => b.date.getTime() - a.date.getTime());
      const top = candidates[0];

      // compute days difference ignoring time
      const now2 = new Date();
      const then = new Date(Date.UTC(top.date.getUTCFullYear(), top.date.getUTCMonth(), top.date.getUTCDate()));
      const today = new Date(Date.UTC(now2.getUTCFullYear(), now2.getUTCMonth(), now2.getUTCDate()));
      const msPerDay = 24 * 60 * 60 * 1000;
      const daysAgo = Math.floor((today.getTime() - then.getTime()) / msPerDay);
      if (daysAgo <= daysWindow) {
        return { recordId: top.id, daysAgo };
      }
      return null;
    } catch (err) {
      // console.error('queryRecentReviews error', err);
      throw err;
    }
  }

  fetchFieldProperties() {
    // console.log('Request URL:', `https://api.quickbase.com/v1/fields?tableId=${this.participantReviewsTableId}`);

    this.quickbaseService.callQuickbaseProxy('GET', `https://api.quickbase.com/v1/fields?tableId=${this.participantReviewsTableId}`, null)
      .subscribe({
        next: (response: any) => {
          // // console.log('Response:', response); // Log the entire response
          if (Array.isArray(response)) {
            response.forEach((field: any) => {
              this.fieldProperties[field.id] = field.properties;
              // If this is the CCO email field (fid 311) and has a label 'Email', capture it
              try {
                if (field.id === 311) {
                  const lbl = field?.properties?.label || field?.properties?.label?.value || '';
                  if (typeof lbl === 'string' && lbl.toLowerCase().includes('email')) {
                    // Try to extract a default or example value if present in properties (fallback null)
                    const defaultVal = field?.properties?.defaultValue || null;
                    this.ccoEmail = defaultVal || null;
                    // console.log('Detected CCO Email field (311). Set ccoEmail to:', this.ccoEmail);
                  }
                }
              } catch (err) {
                // console.warn('Error inspecting field 311 properties:', err);
              }
            });
            // console.log('Field Properties:', this.fieldProperties); // Log the field properties map
          } else {
            // console.log('No fields found in response.');
          }
        },
        error: (error: any) => {
          // console.error('Error fetching field properties:', error);
        },
        complete: () => {
          // console.log('fetchFieldProperties completed');
        }
      });
  }

  private async processDOCStatus() {
    // console.log('Processing DOC Status:', this.docStatus);
    
    // Check if DOC status contains "non" or "off" or is empty
    const docStatusLower = (this.docStatus || '').toLowerCase();
    const hideCCO = !this.docStatus || docStatusLower.includes('non') || docStatusLower.includes('off');
    
    this.showCCOSection = !hideCCO;
    // console.log('DOC Status Lower:', docStatusLower);
    // console.log('Hide CCO:', hideCCO);
    // console.log('Show CCO Section:', this.showCCOSection);
    
    if (this.showCCOSection) {
      // CCO section should be shown - check if CCO info is required but missing
      if (!this.ccoFullName || this.ccoFullName.trim() === '' || this.ccoFullName === 'CCO not listed') {
        this.ccoInfoRequired = true;
        
        // Alert user that CCO info is required
        const alert = await this.alertController.create({
          header: 'CCO Information Required',
          message: 'We show this participant as being on supervision and it requires CCO contact information before continuing. If not on supervision, please proceed and update the Supervision Requirements section. Otherwise you will need to enter the contact info. Do you wish to proceed?',
          backdropDismiss: false,
          buttons: [
            {
              text: 'No',
              role: 'cancel',
              cssClass: 'secondary',
              handler: () => {
                this.location.back();
              }
            },
            {
              text: 'Yes',
              handler: () => {
                // Note: CCO name requirement will be validated dynamically based on supervision status
                this.ccoInfoRequired = true;
                // console.log('User chose to proceed with missing CCO info - will validate based on supervision status');
              }
            }
          ]
        });
        await alert.present();
      } else {
        this.ccoInfoRequired = false;
      }
    } else {
      // CCO section is hidden - remove validators from CCO fields
      this.reportForm.get('newCCOname')?.clearValidators();
      this.reportForm.get('newCCOphone')?.clearValidators();
      this.reportForm.get('newCCOmobile')?.clearValidators();
      this.reportForm.get('newCCOemail')?.clearValidators();
      this.reportForm.get('newCCOname')?.updateValueAndValidity();
      this.reportForm.get('newCCOphone')?.updateValueAndValidity();
      this.reportForm.get('newCCOmobile')?.updateValueAndValidity();
      this.reportForm.get('newCCOemail')?.updateValueAndValidity();
      // console.log('CCO section hidden - validators removed');
    }
  }

  // Handle dynamic changes to supervision status
  onSupervisionStatusChange(event: any) {
    const supervisionStatus = event.detail.value;
    // console.log('Supervision status changed to:', supervisionStatus);
    
    if (supervisionStatus === 'No') {
      // Hide CCO section and clear all validators
      this.showCCOSection = false;
      this.ccoInfoRequired = false;
      
      // Clear all CCO field validators
      this.reportForm.get('newCCOname')?.clearValidators();
      this.reportForm.get('newCCOphone')?.clearValidators();
      this.reportForm.get('newCCOmobile')?.clearValidators();
      this.reportForm.get('newCCOemail')?.clearValidators();
      this.reportForm.get('newCCOname')?.updateValueAndValidity();
      this.reportForm.get('newCCOphone')?.updateValueAndValidity();
      this.reportForm.get('newCCOmobile')?.updateValueAndValidity();
      this.reportForm.get('newCCOemail')?.updateValueAndValidity();
      
      // Reset toggle states for CCO fields to avoid confusion
      this.reportForm.get('updateCCOName')?.setValue(false);
      this.reportForm.get('updateCCOPhone')?.setValue(false);
      this.reportForm.get('updateCCOMobile')?.setValue(false);
      this.reportForm.get('updateCCOEmail')?.setValue(false);
      
      // IMPORTANT: Clear all CCO field values to prevent Quickbase pipeline triggers
      this.reportForm.get('newCCOname')?.setValue('');
      this.reportForm.get('newCCOphone')?.setValue('');
      this.reportForm.get('newCCOmobile')?.setValue('');
      this.reportForm.get('newCCOemail')?.setValue('');
      
      // console.log('CCO section hidden and all CCO fields cleared due to supervision status change');
      // console.log('Cleared CCO fields to prevent unwanted Quickbase pipeline triggers');
    } else if (supervisionStatus === 'Yes') {
      // Show CCO section and apply appropriate validation
      this.showCCOSection = true;
      
      // Check if CCO info is required (if current CCO name is missing or placeholder)
      if (!this.ccoFullName || this.ccoFullName.trim() === '' || this.ccoFullName === 'CCO not listed') {
        this.ccoInfoRequired = true;
        // console.log('CCO info required - participant on supervision but no CCO name available');
      } else {
        this.ccoInfoRequired = false;
        // console.log('CCO info available - no additional requirements');
      }
      
      // console.log('CCO section shown due to supervision status change');
    }
    
    // Update CCO name validators based on new supervision status
    this.updateCCONameValidators();
    
    // Update overall form validity
    this.reportForm.updateValueAndValidity();
  }

  getFieldChoices(fieldId: number): string[] {
    const field = this.fieldProperties[fieldId];
    return field && field.choices ? field.choices : [];
  }
          
  onCheckboxChange(event: any, controlName: string) {
    const selectedValues = this.reportForm.controls[controlName].value as string[];
    if (event.detail.checked) {
      selectedValues.push(event.detail.value);
    } else {
      const index = selectedValues.indexOf(event.detail.value);
      if (index > -1) {
        selectedValues.splice(index, 1);
      }
    }
    this.reportForm.controls[controlName].setValue(selectedValues);
  }

  togglePhoneUpdate() {
    const currentValue = this.reportForm.get('updatePhoneNumber')?.value;
    const newValue = !currentValue;
    this.reportForm.controls['updatePhoneNumber'].setValue(newValue);
    
    // Update validators based on toggle state
    const phoneControl = this.reportForm.controls['newPhoneNumber'];
    if (newValue) {
      phoneControl.setValidators([Validators.required, this.phoneNotSameValidator.bind(this)]);
    } else {
      phoneControl.clearValidators();
      phoneControl.setValue('');
    }
    phoneControl.updateValueAndValidity();
  }

  toggleEmailUpdate() {
    const currentValue = this.reportForm.get('updateEmail')?.value;
    const newValue = !currentValue;
    this.reportForm.controls['updateEmail'].setValue(newValue);
    
    // Update validators based on toggle state
    const emailControl = this.reportForm.controls['newEmail'];
    if (newValue) {
      emailControl.setValidators([
        Validators.required, 
        Validators.email, 
        this.emailStructureValidator.bind(this),
        this.emailNotSameValidator.bind(this)
      ]);
    } else {
      emailControl.clearValidators();
      emailControl.setValue('');
    }
    emailControl.updateValueAndValidity();
  }

  toggleCCONameUpdate() {
    const currentValue = this.reportForm.get('updateCCOName')?.value;
    const newValue = !currentValue;
    this.reportForm.controls['updateCCOName'].setValue(newValue);
    
    // Clear the field value when toggling off
    if (!newValue) {
      this.reportForm.controls['newCCOname'].setValue('');
    }
    
    // Update validators using our centralized method
    this.updateCCONameValidators();
  }

  toggleCCOPhoneUpdate() {
    const currentValue = this.reportForm.get('updateCCOPhone')?.value;
    const newValue = !currentValue;
    this.reportForm.controls['updateCCOPhone'].setValue(newValue);
    
    // Update validators based on toggle state
    const ccoPhoneControl = this.reportForm.controls['newCCOphone'];
    if (newValue) {
      ccoPhoneControl.setValidators([Validators.required, this.ccoPhoneNotSameValidator.bind(this)]);
    } else {
      ccoPhoneControl.clearValidators();
      ccoPhoneControl.setValue('');
    }
    ccoPhoneControl.updateValueAndValidity();
  }

  toggleCCOMobileUpdate() {
    const currentValue = this.reportForm.get('updateCCOMobile')?.value;
    const newValue = !currentValue;
    this.reportForm.controls['updateCCOMobile'].setValue(newValue);
    
    // Update validators based on toggle state
    const ccoMobileControl = this.reportForm.controls['newCCOmobile'];
    if (newValue) {
      ccoMobileControl.setValidators([Validators.required, this.ccoMobileNotSameValidator.bind(this)]);
    } else {
      ccoMobileControl.clearValidators();
      ccoMobileControl.setValue('');
    }
    ccoMobileControl.updateValueAndValidity();
  }

  toggleCCOEmailUpdate() {
    const currentValue = this.reportForm.get('updateCCOEmail')?.value;
    const newValue = !currentValue;
    this.reportForm.controls['updateCCOEmail'].setValue(newValue);
    
    // Update validators based on toggle state
    const ccoEmailControl = this.reportForm.controls['newCCOemail'];
    if (newValue) {
      ccoEmailControl.setValidators([
        Validators.required,
        Validators.email,
        this.emailStructureValidator.bind(this),
        this.ccoEmailNotSameValidator.bind(this)
      ]);
    } else {
      ccoEmailControl.clearValidators();
      ccoEmailControl.setValue('');
    }
    ccoEmailControl.updateValueAndValidity();
  }

  // Custom validator to ensure new phone number is different from current
  phoneNotSameValidator(control: any) {
    if (!control.value || !this.participantPhone) {
      return null;
    }
    
    // Remove all non-numeric characters for comparison
    const normalizePhone = (phone: string) => phone.replace(/\D/g, '');
    const currentNormalized = normalizePhone(this.participantPhone);
    const newNormalized = normalizePhone(control.value);
    
    if (currentNormalized === newNormalized) {
      return { sameAsCurrentPhone: true };
    }
    
    return null;
  }

  // Custom validator to ensure new email is different from current
  emailNotSameValidator(control: any) {
    if (!control.value || !this.participantEmail) {
      return null;
    }
    
    // Case-insensitive email comparison
    const currentEmail = this.participantEmail.toLowerCase().trim();
    const newEmail = control.value.toLowerCase().trim();
    
    if (currentEmail === newEmail) {
      return { sameAsCurrentEmail: true };
    }
    
    return null;
  }

  // Enhanced email structure validator
  emailStructureValidator(control: any) {
    if (!control.value) {
      return null;
    }

    const email = control.value;
    
    // Check for spaces around @ symbol
    if (email.includes(' @') || email.includes('@ ')) {
      return { invalidEmailSpaces: true };
    }
    
    // Check for multiple @ symbols
    const atCount = (email.match(/@/g) || []).length;
    if (atCount !== 1) {
      return { invalidEmailStructure: true };
    }
    
    // Check for spaces within the email
    if (email.includes(' ')) {
      return { invalidEmailSpaces: true };
    }
    
    // Check for consecutive dots
    if (email.includes('..')) {
      return { invalidEmailStructure: true };
    }
    
    // Check if @ is at the beginning or end
    if (email.startsWith('@') || email.endsWith('@')) {
      return { invalidEmailStructure: true };
    }
    
    // Check for valid characters after @
    const parts = email.split('@');
    const domain = parts[1];
    if (domain) {
      // Domain must contain at least one dot and not start/end with dot or dash
      if (!domain.includes('.') || domain.startsWith('.') || domain.endsWith('.') || 
          domain.startsWith('-') || domain.endsWith('-')) {
        return { invalidEmailStructure: true };
      }
    }
    
    return null;
  }

  // CCO validation methods
  ccoNameNotSameValidator(control: any) {
    if (!control.value || !this.ccoFullName) {
      return null;
    }
    
    // Case-insensitive name comparison
    const currentName = this.ccoFullName.toLowerCase().trim();
    const newName = control.value.toLowerCase().trim();
    
    if (currentName === newName) {
      return { sameAsCurrentCCOName: true };
    }
    
    return null;
  }

  ccoPhoneNotSameValidator(control: any) {
    if (!control.value || !this.ccoPhoneNumber) {
      return null;
    }
    
    // Remove all non-numeric characters for comparison
    const normalizePhone = (phone: string) => phone.replace(/\D/g, '');
    const currentNormalized = normalizePhone(this.ccoPhoneNumber);
    const newNormalized = normalizePhone(control.value);
    
    if (currentNormalized === newNormalized) {
      return { sameAsCurrentCCOPhone: true };
    }
    
    return null;
  }

  ccoMobileNotSameValidator(control: any) {
    if (!control.value || !this.ccoMobile) {
      return null;
    }
    
    // Remove all non-numeric characters for comparison
    const normalizePhone = (phone: string) => phone.replace(/\D/g, '');
    const currentNormalized = normalizePhone(this.ccoMobile);
    const newNormalized = normalizePhone(control.value);
    
    if (currentNormalized === newNormalized) {
      return { sameAsCurrentCCOMobile: true };
    }
    
    return null;
  }

  ccoEmailNotSameValidator(control: any) {
    if (!control.value || !this.ccoEmail) {
      return null;
    }
    
    // Case-insensitive email comparison
    const currentEmail = this.ccoEmail.toLowerCase().trim();
    const newEmail = control.value.toLowerCase().trim();
    
    if (currentEmail === newEmail) {
      return { sameAsCurrentCCOEmail: true };
    }
    
    return null;
  }

  // Helper methods to check validation status for template
  isPhoneDuplicate(): boolean {
    const phoneControl = this.reportForm.get('newPhoneNumber');
    const updatePhoneControl = this.reportForm.get('updatePhoneNumber');
    
    // Only check for duplicates if the user is trying to update the phone
    if (!updatePhoneControl?.value) {
      return false;
    }
    
    // Check if the phone values are actually the same (regardless of touched state)
    if (phoneControl?.value && this.participantPhone) {
      const normalizePhone = (phone: string) => phone.replace(/\D/g, '');
      const currentNormalized = normalizePhone(this.participantPhone);
      const newNormalized = normalizePhone(phoneControl.value);
      return currentNormalized === newNormalized;
    }
    
    return false;
  }

  isEmailDuplicate(): boolean {
    const emailControl = this.reportForm.get('newEmail');
    const updateEmailControl = this.reportForm.get('updateEmail');
    
    // Only check for duplicates if the user is trying to update the email
    if (!updateEmailControl?.value) {
      return false;
    }
    
    // Check if the email values are actually the same (regardless of touched state)
    if (emailControl?.value && this.participantEmail) {
      const currentEmail = this.participantEmail.toLowerCase().trim();
      const newEmail = emailControl.value.toLowerCase().trim();
      return currentEmail === newEmail;
    }
    
    return false;
  }

  isEmailStructureInvalid(): boolean {
    const emailControl = this.reportForm.get('newEmail');
    return (emailControl?.hasError('invalidEmailSpaces') || emailControl?.hasError('invalidEmailStructure')) && emailControl?.touched || false;
  }

  getEmailStructureError(): string {
    const emailControl = this.reportForm.get('newEmail');
    if (emailControl?.hasError('invalidEmailSpaces')) {
      return 'Email must be entered in the proper format structure.';
    }
    if (emailControl?.hasError('invalidEmailStructure')) {
      return 'Please enter a valid email format (e.g., user@domain.com)';
    }
    return '';
  }

  // Check if there are any duplicates or validation issues that should block submission
  hasValidationBlockers(): boolean {
    return this.isPhoneDuplicate() || this.isEmailDuplicate() || this.isEmailStructureInvalid() ||
           this.isCCONameDuplicate() || this.isCCOPhoneDuplicate() || this.isCCOMobileDuplicate() || 
           this.isCCOEmailDuplicate() || this.isCCOEmailStructureInvalid();
  }

  // Get a summary of current validation issues
  getValidationIssuesSummary(): string {
    const issues: string[] = [];
    
    if (this.isPhoneDuplicate()) {
      issues.push('Resident\'s phone number must be different');
    }
    if (this.isEmailDuplicate()) {
      issues.push('Resident\'s email address must be different');
    }
    if (this.isEmailStructureInvalid()) {
      issues.push('Resident\'s email format is invalid');
    }
    if (this.isCCONameDuplicate()) {
      issues.push('CCO name must be different');
    }
    if (this.isCCOPhoneDuplicate()) {
      issues.push('CCO phone must be different');
    }
    if (this.isCCOMobileDuplicate()) {
      issues.push('CCO mobile must be different');
    }
    if (this.isCCOEmailDuplicate()) {
      issues.push('CCO email must be different');
    }
    if (this.isCCOEmailStructureInvalid()) {
      issues.push('CCO email format is invalid');
    }
    
    // Return a concise message for multiple issues
    if (issues.length > 2) {
      return `${issues.length} validation issues found`;
    } else {
      return issues.join(' and ');
    }
  }

  // Method to properly manage CCO name validators based on current state
  private updateCCONameValidators() {
    const onSupervision = this.reportForm.get('onSupervision')?.value;
    const updateCCOName = this.reportForm.get('updateCCOName')?.value;
    const ccoNameControl = this.reportForm.get('newCCOname');
    
    if (!ccoNameControl) return;
    
    // Determine what validators should be active
    let requiredValidators: any[] = [];
    
    if (this.showCCOSection && onSupervision === 'Yes' && updateCCOName) {
      // Only require if user is updating CCO name and no current CCO exists
      const hasCCOName = (this.ccoFullName && this.ccoFullName !== 'CCO not listed');
      if (!hasCCOName) {
        requiredValidators = [Validators.required, this.ccoNameNotSameValidator.bind(this)];
      } else {
        requiredValidators = [this.ccoNameNotSameValidator.bind(this)];
      }
    }
    
    // Only update validators if they've actually changed to prevent recursion
    const currentValidators = ccoNameControl.validator;
    ccoNameControl.setValidators(requiredValidators.length > 0 ? requiredValidators : null);
    
    // Only trigger update if validators actually changed
    if (currentValidators !== ccoNameControl.validator) {
      ccoNameControl.updateValueAndValidity({ emitEvent: false });
    }
  }

  // CCO validation helper methods
  isCCONameDuplicate(): boolean {
    const ccoNameControl = this.reportForm.get('newCCOname');
    const updateCCONameControl = this.reportForm.get('updateCCOName');
    
    // Only check for duplicates if the user is trying to update CCO name
    if (!updateCCONameControl?.value) {
      return false;
    }
    
    // Check if the CCO name values are actually the same (regardless of touched state)
    if (ccoNameControl?.value && this.ccoFullName) {
      const currentName = this.ccoFullName.toLowerCase().trim();
      const newName = ccoNameControl.value.toLowerCase().trim();
      return currentName === newName;
    }
    
    return false;
  }

  isCCOPhoneDuplicate(): boolean {
    const ccoPhoneControl = this.reportForm.get('newCCOphone');
    const updateCCOPhoneControl = this.reportForm.get('updateCCOPhone');
    
    // Only check for duplicates if the user is trying to update CCO phone
    if (!updateCCOPhoneControl?.value) {
      return false;
    }
    
    // Check if the CCO phone values are actually the same (regardless of touched state)
    if (ccoPhoneControl?.value && this.ccoPhoneNumber) {
      const normalizePhone = (phone: string) => phone.replace(/\D/g, '');
      const currentNormalized = normalizePhone(this.ccoPhoneNumber);
      const newNormalized = normalizePhone(ccoPhoneControl.value);
      return currentNormalized === newNormalized;
    }
    
    return false;
  }

  isCCOMobileDuplicate(): boolean {
    const ccoMobileControl = this.reportForm.get('newCCOmobile');
    const updateCCOMobileControl = this.reportForm.get('updateCCOMobile');
    
    // Only check for duplicates if the user is trying to update CCO mobile
    if (!updateCCOMobileControl?.value) {
      return false;
    }
    
    // Check if the CCO mobile values are actually the same (regardless of touched state)
    if (ccoMobileControl?.value && this.ccoMobile) {
      const normalizePhone = (phone: string) => phone.replace(/\D/g, '');
      const currentNormalized = normalizePhone(this.ccoMobile);
      const newNormalized = normalizePhone(ccoMobileControl.value);
      return currentNormalized === newNormalized;
    }
    
    return false;
  }

  isCCOEmailDuplicate(): boolean {
    const ccoEmailControl = this.reportForm.get('newCCOemail');
    const updateCCOEmailControl = this.reportForm.get('updateCCOEmail');
    
    // Only check for duplicates if the user is trying to update CCO email
    if (!updateCCOEmailControl?.value) {
      return false;
    }
    
    // Check if the CCO email values are actually the same (regardless of touched state)
    if (ccoEmailControl?.value && this.ccoEmail) {
      const currentEmail = this.ccoEmail.toLowerCase().trim();
      const newEmail = ccoEmailControl.value.toLowerCase().trim();
      return currentEmail === newEmail;
    }
    
    return false;
  }

  isCCOEmailStructureInvalid(): boolean {
    const ccoEmailControl = this.reportForm.get('newCCOemail');
    return (ccoEmailControl?.hasError('invalidEmailSpaces') || ccoEmailControl?.hasError('invalidEmailStructure')) && ccoEmailControl?.touched || false;
  }

  getCCOEmailStructureError(): string {
    const ccoEmailControl = this.reportForm.get('newCCOemail');
    if (ccoEmailControl?.hasError('invalidEmailSpaces')) {
      return 'Email cannot contain spaces, especially around the @ symbol';
    }
    if (ccoEmailControl?.hasError('invalidEmailStructure')) {
      return 'Please enter a valid email format (e.g., user@domain.com)';
    }
    return '';
  }

  // Check if CCO name is required based on supervision status
  private isCCONameRequiredForSupervision(): boolean {
    const onSupervision = this.reportForm.get('onSupervision')?.value;
    const updateCCOName = this.reportForm.get('updateCCOName')?.value;
    const newCCOname = this.reportForm.get('newCCOname')?.value;
    
    if (this.showCCOSection && onSupervision === 'Yes') {
      // If on supervision, check if we have either current or new CCO name
      const hasCCOName = (this.ccoFullName && this.ccoFullName !== 'CCO not listed') || 
                        (updateCCOName && newCCOname && newCCOname.trim() !== '');
      return !hasCCOName;
    }
    return false;
  }

  // Keep the old methods for backward compatibility (if needed elsewhere)
  onUpdatePhoneToggle(event: any) {
    const shouldUpdate = event.detail.checked;
    this.reportForm.controls['updatePhoneNumber'].setValue(shouldUpdate);
    
    // Update validators based on toggle state
    const phoneControl = this.reportForm.controls['newPhoneNumber'];
    if (shouldUpdate) {
      phoneControl.setValidators([Validators.required, this.phoneNotSameValidator.bind(this)]);
    } else {
      phoneControl.clearValidators();
      phoneControl.setValue('');
    }
    phoneControl.updateValueAndValidity();
  }

  onUpdateEmailToggle(event: any) {
    const shouldUpdate = event.detail.checked;
    this.reportForm.controls['updateEmail'].setValue(shouldUpdate);
    
    // Update validators based on toggle state
    const emailControl = this.reportForm.controls['newEmail'];
    if (shouldUpdate) {
      emailControl.setValidators([
        Validators.required, 
        Validators.email, 
        this.emailStructureValidator.bind(this),
        this.emailNotSameValidator.bind(this)
      ]);
    } else {
      emailControl.clearValidators();
      emailControl.setValue('');
    }
    emailControl.updateValueAndValidity();
  }

 async onSubmit() {
    // console.log('onSubmit called');
    
    // Early exit if validation blockers exist (double safety)
    if (this.hasValidationBlockers()) {
      // console.log('Submit blocked due to validation issues');
      return;
    }
    
    // Enhanced debugging for duplicate validation
    const phoneDupe = this.isPhoneDuplicate();
    const emailDupe = this.isEmailDuplicate();
    
    // console.log('Validation check:', {
    //   phoneDupe,
    //   emailDupe,
    //   currentPhone: this.participantPhone,
    //   newPhone: this.reportForm.get('newPhoneNumber')?.value,
    //   updatePhone: this.reportForm.get('updatePhoneNumber')?.value,
    //   currentEmail: this.participantEmail,
    //   newEmail: this.reportForm.get('newEmail')?.value,
    //   updateEmail: this.reportForm.get('updateEmail')?.value
    // });
    
    // Check for duplicate phone/email/CCO validation errors
    if (this.isPhoneDuplicate() || this.isEmailDuplicate() || this.isEmailStructureInvalid() ||
        this.isCCONameDuplicate() || this.isCCOPhoneDuplicate() || this.isCCOMobileDuplicate() || 
        this.isCCOEmailDuplicate() || this.isCCOEmailStructureInvalid()) {
      
      let message = 'Cannot submit form due to validation errors:\n\n';
      
      if (this.isPhoneDuplicate()) {
        message += '• Phone number: New phone number must be different from current phone number\n';
      }
      
      if (this.isEmailDuplicate()) {
        message += '• Email address: New email address must be different from current email address\n';
      }
      
      if (this.isCCONameDuplicate() || this.isCCOPhoneDuplicate() || this.isCCOMobileDuplicate() || this.isCCOEmailDuplicate()) {
        message += '• CCO Information: New CCO information must be different from current values\n';
      }
      
      if (this.isEmailStructureInvalid() || this.isCCOEmailStructureInvalid()) {
        message += '• Email format: Please ensure email addresses are properly formatted\n';
      }
      
      message += '\nPlease correct these issues and try again.';
      
      const alert = await this.alertController.create({
        header: 'Form Submission Blocked',
        message: message,
        buttons: ['OK']
      });
      await alert.present();
      
      // Mark relevant fields as touched to show visual validation errors
      if (this.isPhoneDuplicate()) {
        this.reportForm.get('newPhoneNumber')?.markAsTouched();
        this.reportForm.get('newPhoneNumber')?.updateValueAndValidity();
      }
      if (this.isEmailDuplicate()) {
        this.reportForm.get('newEmail')?.markAsTouched();
        this.reportForm.get('newEmail')?.updateValueAndValidity();
      }
      if (this.isCCONameDuplicate()) {
        this.reportForm.get('newCCOname')?.markAsTouched();
        this.reportForm.get('newCCOname')?.updateValueAndValidity();
      }
      if (this.isCCOPhoneDuplicate()) {
        this.reportForm.get('newCCOphone')?.markAsTouched();
        this.reportForm.get('newCCOphone')?.updateValueAndValidity();
      }
      if (this.isCCOMobileDuplicate()) {
        this.reportForm.get('newCCOmobile')?.markAsTouched();
        this.reportForm.get('newCCOmobile')?.updateValueAndValidity();
      }
      if (this.isCCOEmailDuplicate()) {
        this.reportForm.get('newCCOemail')?.markAsTouched();
        this.reportForm.get('newCCOemail')?.updateValueAndValidity();
      }
      
      // console.log('Form submission blocked due to validation errors');
      return;
    }
    
    // Additional validation: Check "On Supervision" + CCO Name requirement
    const onSupervision = this.reportForm.get('onSupervision')?.value;
    const updateCCOName = this.reportForm.get('updateCCOName')?.value;
    const newCCOname = this.reportForm.get('newCCOname')?.value;
    
    if (this.showCCOSection && onSupervision === 'Yes') {
      // If on supervision, CCO name is required (either current or new)
      const hasCCOName = (this.ccoFullName && this.ccoFullName !== 'CCO not listed') || 
                        (updateCCOName && newCCOname && newCCOname.trim() !== '');
      
      if (!hasCCOName) {
        const alert = await this.alertController.create({
          header: 'CCO Name Required',
          message: 'When a participant is on supervision, CCO contact information is required. Please provide the CCO name.',
          buttons: ['OK']
        });
        await alert.present();
        
        // Update validators using our centralized method
        this.updateCCONameValidators();
        return;
      }
    } else if (onSupervision === 'No') {
      // If not on supervision, CCO fields are not required - clear validators
      this.updateCCONameValidators(); // This will clear validators for 'No' supervision
      this.reportForm.get('newCCOphone')?.clearValidators();
      this.reportForm.get('newCCOmobile')?.clearValidators();
      this.reportForm.get('newCCOemail')?.clearValidators();
      this.reportForm.get('newCCOphone')?.updateValueAndValidity();
      this.reportForm.get('newCCOmobile')?.updateValueAndValidity();
      this.reportForm.get('newCCOemail')?.updateValueAndValidity();
    }
    
    if (this.reportForm.valid) {
      const formData = this.reportForm.getRawValue();
      // console.log('Form Data:', formData);
      // If a review was already submitted in this page instance, warn the user
      if (this.submittedReviewRecordId) {
        const existingId = this.submittedReviewRecordId;
        const alert = await this.alertController.create({
          header: 'Review Already Submitted',
          message: `A review has already been submitted for this participant (Record #${existingId}).\nDo you want to overwrite the existing review?`,
          backdropDismiss: false,
          buttons: [
            {
              text: 'No',
              role: 'cancel',
              cssClass: 'secondary',
              handler: () => {
                // console.log('User chose not to re-submit');
              }
            },
            {
              text: 'Yes',
              handler: () => {
                // Update the existing record instead of creating a new one
                this.updateReviewRecord(formData, existingId);
              }
            }
          ]
        });
        await alert.present();
        return;
      }

      // Prevent double submissions while request is in-flight
      if (this.submissionInProgress) {
        // console.log('Submission already in progress');
        return;
      }

      // Proceed to create a new review record
      this.createReviewRecord(formData);
    } else {
      // console.log('Form is invalid');
      this.logInvalidControls();
      this.setSubmissionErrorMessage();
    }
  }

  // no remote check for existing reviews — we track submission locally in this page instance

  private createReviewRecord(formData: any) {
    this.submissionInProgress = true;
    
    // Additional safeguard: If not on supervision, ensure CCO fields are cleared
    const isOnSupervision = formData.onSupervision === 'Yes';
    const ccoNameValue = isOnSupervision ? (formData.updateCCOName ? formData.newCCOname : '') : '';
    const ccoPhoneValue = isOnSupervision ? (formData.updateCCOPhone ? formData.newCCOphone : '') : '';
    const ccoMobileValue = isOnSupervision ? (formData.updateCCOMobile ? formData.newCCOmobile : '') : '';
    const ccoEmailValue = isOnSupervision ? (formData.updateCCOEmail ? formData.newCCOemail : '') : '';
    
    const payload = {
      to: this.participantReviewsTableId,
      data: [
        {
          276: { value: formData.status },
          104: { value: formData.updatePhoneNumber ? formData.newPhoneNumber : '' },
          105: { value: formData.updateEmail ? formData.newEmail : '' },
          159: { value: formData.onSupervision },
          170: { value: formData.inSOTP },
          175: { value: formData.inDATP },
          174: { value: formData.inMentalHealthCounseling },
          287: { value: ccoNameValue },
          288: { value: ccoPhoneValue },
          112: { value: ccoMobileValue },
          113: { value: ccoEmailValue },
          282: { value: formData.choreAssignment },
          281: { value: formData.choreCompliance },
          283: { value: formData.houseCurfew },
          162: { value: formData.meeting_ProgrammingCompliance },
          214: { value: formData.financialCompliance },
          169: { value: formData.disclosedElectronicDevices },
          154: { value: formData.meetingAdministrator },
          298: { value: formData.howAdministered },
          178: { value: formData.meetingNotes },
          280: { value: formData.currentEmploymentStatus },
          216: { value: formData.Goals },
          161: { value: formData.hygieneIssues },
          163: { value: formData.socialSkills },
          167: { value: formData.behavioralObservations },
          165: { value: formData.temperament },
          213: { value: formData.leadershipPotential },
          147: { value: this.participantId }
        }
      ]
    };

    // console.log('Payload:', payload);

    this.quickbaseService.callQuickbaseProxy('POST', 'records', payload).subscribe({
      next: async (response: any) => {
        // console.log('Record created:', response);
        const newRecordId = response.metadata?.createdRecordIds?.[0];
        // console.log('New Record ID:', newRecordId);
        this.submissionMessage = `Participant Review #${newRecordId} submitted. Thank you.`;
        this.submissionErrorMessage = '';
        this.submittedReviewRecordId = newRecordId?.toString() || null;
        this.submissionInProgress = false;
        // Show a confirmation alert with the record number
        const alert = await this.alertController.create({
          header: 'Review Submitted',
          message: `Participant Review #${newRecordId} submitted successfully.`,
          buttons: ['OK']
        });
        await alert.present();
      },
      error: (error) => {
        // console.error('Error creating record:', error);
        this.submissionInProgress = false;
      }
    });
  }

  logInvalidControls() {
    Object.keys(this.reportForm.controls).forEach(key => {
      const control = this.reportForm.get(key);
      if (control && control.invalid) {
        // console.log(`Invalid Control: ${key}, Errors:`, control.errors);
      }
    });
  }

  setSubmissionErrorMessage() {
    const invalidFields = Object.keys(this.reportForm.controls).filter(key => this.reportForm.controls[key].invalid);
    
    // Check for duplicate validation errors specifically
    if (this.isPhoneDuplicate() || this.isEmailDuplicate()) {
      this.submissionErrorMessage = 'Please ensure new contact information is different from current values.';
      return;
    }
    
    // Check for email structure errors
    if (this.isEmailStructureInvalid()) {
      this.submissionErrorMessage = 'Please ensure the email address is properly formatted.';
      return;
    }
    
    this.submissionErrorMessage = `Please complete the following fields: ${invalidFields.join(', ')}`;
  }

  goBack() {
    this.location.back();
  }


}