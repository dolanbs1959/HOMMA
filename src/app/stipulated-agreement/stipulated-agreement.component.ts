import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { formatDate, Location } from '@angular/common';
import { LoadingController, AlertController, ModalController } from '@ionic/angular';
import { Functions } from '@angular/fire/functions';
import { httpsCallable } from 'firebase/functions';
import { UserService } from '../services/user.service';
import { ResidentSearchComponent } from '../resident-search/resident-search.component';
import { QuickbaseService } from '../services/quickbase.service';

interface StipulationItem {
  key: string;
  label: string;
  checked: boolean;
  hasText?: boolean;
}

@Component({
  selector: 'app-stipulated-agreement',
  templateUrl: './stipulated-agreement.component.html',
  styleUrls: ['./stipulated-agreement.component.scss']
})
export class StipulatedAgreementComponent implements OnInit {
  residentData: any = null;

  participantName = 'Unknown Participant';
  participantId = '';
  participantRecordId = 0;
  participantEmail = '';
  houseName = '';
  houseLeaderName = '';
  houseLeaderEmail = '';

  effectiveDate = '';
  specifyGuideline = '';

  violationCategories = {
    alcohol: false,
    financial: false,
    employment: false,
    program: false
  };

  alcoholStipulations: StipulationItem[] = [
    { key: 'randomUA', label: 'Complete Random UA', checked: false },
    { key: 'celebrateRecovery', label: 'Attend Celebrate Recovery at 22604 16th Ave S, Des Moines, WA 98198 at 6 PM Every Friday', checked: false },
    { key: 'curfew8pm', label: 'Curfew of 8 PM', checked: false },
    { key: 'overcomingAddiction', label: 'Attend and complete Overcoming Addiction Class', checked: false },
    { key: 'drugEvaluation', label: 'Drug Evaluation', checked: false },
    { key: 'drugTreatment', label: 'Entry into Drug Treatment', checked: false }
  ];

  financialStipulations: StipulationItem[] = [
    { key: 'financialFreedom', label: 'Attend and complete Financial Freedom Class', checked: false },
    { key: 'paymentPlan', label: 'Pay Program Fees IAW Payment Plan', checked: false }
  ];

  employmentStipulations: StipulationItem[] = [
    { key: 'workLifeReadiness', label: 'Attend and complete Work Life Readiness Class', checked: false },
    { key: 'nextStepWorkHub', label: 'Enroll and participate in Next Step Work Hub employment services', checked: false }
  ];

  programRuleStipulations: StipulationItem[] = [
    { key: 'curfew8pm', label: 'Curfew of 8 PM', checked: false },
    { key: 'abidePolicies', label: 'Abide in all HOM policies and guidelines.', checked: false },
    { key: 'personalDevelopment', label: 'Attend Personal Development Class', checked: false },
    { key: 'other', label: 'Other', checked: false, hasText: true }
  ];

  programOtherText = '';

  participantSignatureData = '';
  participantSignatureDate = '';
  refusedSignature = false;
  staffName = 'Unknown Staff';
  staffSignatureData = '';
  staffSignatureDate = '';
  fromSearch = false;

  constructor(
    private router: Router,
    private location: Location,
    private modalCtrl: ModalController,
    private userService: UserService,
    private quickbaseService: QuickbaseService,
    private functions: Functions,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) {}

  ngOnInit(): void {
    const nav = this.router.getCurrentNavigation();
    const state: any = nav?.extras?.state || window.history.state || {};
    const queryParams: any = nav?.extras?.queryParams || {};
    this.residentData = state.residentData || {};
    this.fromSearch = !!state.fromSearch;

    const r = this.residentData || {};
    this.participantName =
      queryParams.participantName ||
      r.residentFullName?.value ||
      r.residentFullName ||
      r.residentName ||
      r.name ||
      'Unknown Participant';
    this.participantId =
      queryParams.participantId ||
      r.recordNumber2?.value ||
      r.recordNumber2 ||
      r.recordNumber ||
      r.id ||
      r.recordId ||
      '';

    this.participantRecordId =
      Number(
        queryParams.participantRecordId ||
        r.recordNumber2?.value ||
        r.recordNumber2 ||
        r.recordNumber ||
        r.id ||
        r.recordId ||
        0
      ) || 0;

    this.participantEmail =
      (r.residentEmail?.value || '').trim() ||
      (r.email?.value || '').trim() ||
      '';

    if (!this.participantEmail && this.participantRecordId > 0) {
      const participantInfo = this.userService.getParticipantInfo();
      if (participantInfo && participantInfo.recordId === this.participantRecordId) {
        this.participantEmail = participantInfo.email || '';
      }
    }

    this.houseName = queryParams.theHouseName || state.theHouseName || r.houseName?.value || r.houseName || '';
    this.houseLeaderName = queryParams.houseLeaderName || state.houseLeaderName || r.houseLeaderName?.value || r.houseLeaderName || '';
    this.houseLeaderEmail = (r.houseLeaderEmail?.value || r.houseLeaderEmail || '').trim();

    this.staffName = this.userService.getDisplayName() || 'Unknown Staff';

    const today = formatDate(new Date(), 'yyyy-MM-dd', 'en-US');
    this.effectiveDate = today;
    this.participantSignatureDate = today;
    this.staffSignatureDate = today;
  }

  onParticipantSignatureChange(dataUrl: string): void {
    this.participantSignatureData = dataUrl;
  }

  onStaffSignatureChange(dataUrl: string): void {
    this.staffSignatureData = dataUrl;
  }



  get isSaveEnabled(): boolean {
    return (this.participantSignatureData !== '' || this.refusedSignature) && this.staffSignatureData !== '';
  }

  goBack(): void {
    // Preserve the originating navigation context. If the agreement was opened
    // from the participant search modal, reopen that modal with the cached query/results.
    // Otherwise, go back to the previous page (house resident listing).
    if (this.fromSearch) {
      const last = this.quickbaseService.getLastResidentSearch();
      this.modalCtrl.create({
        component: ResidentSearchComponent,
        componentProps: {
          initialQuery: last?.query || '',
          initialResults: last?.results || []
        },
        cssClass: 'resident-search-modal'
      }).then(modal => modal.present());
    } else {
      this.location.back();
    }
  }

  backToSearch(): void {
    this.resetAgreementForm();
    this.goBack();
  }

  private resetAgreementForm(): void {
    this.violationCategories = {
      alcohol: false,
      financial: false,
      employment: false,
      program: false
    };
    this.specifyGuideline = '';
    this.programOtherText = '';
    this.alcoholStipulations.forEach(item => item.checked = false);
    this.financialStipulations.forEach(item => item.checked = false);
    this.employmentStipulations.forEach(item => item.checked = false);
    this.programRuleStipulations.forEach(item => item.checked = false);
    this.participantSignatureData = '';
    this.refusedSignature = false;
    this.staffSignatureData = '';
    const today = formatDate(new Date(), 'yyyy-MM-dd', 'en-US');
    this.effectiveDate = today;
    this.participantSignatureDate = today;
    this.staffSignatureDate = today;
  }

  private buildPdfPayload(): any {
    return {
      participantName: this.participantName,
      participantId: this.participantId,
      effectiveDate: this.effectiveDate,
      violationReasons: {
        alcohol: this.violationCategories.alcohol,
        financial: this.violationCategories.financial,
        employment: this.violationCategories.employment,
        program: this.violationCategories.program
      },
      specifyGuideline: this.specifyGuideline,
      selectedStipulations: {
        alcohol: this.alcoholStipulations.filter(i => i.checked).map(i => i.key),
        financial: this.financialStipulations.filter(i => i.checked).map(i => i.key),
        employment: this.employmentStipulations.filter(i => i.checked).map(i => i.key),
        program: this.programRuleStipulations.filter(i => i.checked).map(i => i.key),
        otherText: this.programOtherText
      },
      participantSignature: this.participantSignatureData,
      participantSignatureDate: this.participantSignatureDate,
      participantRefusal: this.refusedSignature,
      staffName: this.staffName,
      staffSignature: this.staffSignatureData,
      staffSignatureDate: this.staffSignatureDate
    };
  }

  async generateAndSend(): Promise<void> {
    if (!this.isSaveEnabled) {
      const alert = await this.alertController.create({
        header: 'Missing Signatures',
        message: this.refusedSignature
          ? 'HOM Staff signature is required.'
          : 'Participant signature (or Refused signature) and HOM Staff signature are required.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    let recipient = this.participantEmail;
    let updateParticipantEmail = false;
    let emailSkipped = false;

    if (!recipient) {
      const prompted = await this.promptForEmail();
      if (!prompted) {
        emailSkipped = true;
      } else {
        recipient = prompted;
        updateParticipantEmail = true;
      }
    }

    // If the participant has no email and the prompt was skipped, send the agreement to the
    // House Leader as a fallback. If the House Leader email is also unavailable, send to the
    // fixed escalation address so the agreement is not lost.
    if (emailSkipped) {
      recipient = this.houseLeaderEmail || 'timothy.ramirez@homtransitions.org';
      updateParticipantEmail = false;
      emailSkipped = false;
    }

    const loading = await this.loadingController.create({
      message: 'Preparing agreement...'
    });
    await loading.present();

    try {
      const payload = this.buildPdfPayload();
      const generatePdfCallable = httpsCallable(this.functions, 'generateStipulatedAgreementPdf');
      const result = await generatePdfCallable(payload) as any;

      if (!result.data?.success) {
        throw new Error(result.data?.error?.message || 'PDF generation failed');
      }

      const pdfBase64 = this.extractBase64Pdf(result.data);

      let emailSent = false;
      if (!emailSkipped) {
        emailSent = await this.sendAgreement(pdfBase64, recipient, updateParticipantEmail);
      }

      const uploadSucceeded = await this.uploadAgreement(pdfBase64);
      if (!uploadSucceeded) {
        throw new Error('Unable to save the agreement to the participant record.');
      }

      const header = 'Success';
      const message = emailSent
        ? 'Agreement emailed and saved to the participant record.'
        : 'Agreement saved to the participant record.';
      const success = await this.alertController.create({
        header,
        message,
        buttons: ['OK']
      });
      await success.present();
      success.onDidDismiss().then(() => this.goBack());
    } catch (error: any) {
      console.error('Agreement error', error);
      const alert = await this.alertController.create({
        header: 'Error',
        message: error?.message || 'Unknown error',
        buttons: ['OK']
      });
      await alert.present();
    } finally {
      await loading.dismiss();
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private async promptForEmail(): Promise<string | null> {
    let enteredEmail = '';

    const prompt = await this.alertController.create({
      header: 'Participant Email',
      message: 'This participant does not have an email address. Please enter an email address to send the agreement.',
      backdropDismiss: false,
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'email@example.com'
        }
      ],
      buttons: [
        { text: 'Skip', role: 'cancel' },
        {
          text: 'Send',
          handler: (data) => {
            enteredEmail = String(data?.email || '').trim();
            return this.isValidEmail(enteredEmail);
          }
        }
      ]
    });
    await prompt.present();
    const result = await prompt.onDidDismiss();

    if (result.role === 'cancel') {
      return null;
    }

    if (!this.isValidEmail(enteredEmail)) {
      return null;
    }

    return enteredEmail;
  }

  private async sendAgreement(pdfBase64: string, recipient: string, updateParticipantEmail: boolean): Promise<boolean> {
    try {
      const sendCallable = httpsCallable(this.functions, 'sendStipulatedAgreementEmail');
      const result = await sendCallable({
        recipientEmail: recipient,
        pdfBase64,
        participantName: this.participantName,
        participantRecordId: this.participantRecordId,
        updateParticipantEmail,
        houseLeaderEmail: this.houseLeaderEmail
      }) as any;

      if (!result.data?.success) {
        throw new Error(result.data?.error?.message || 'Email sending failed');
      }

      return true;
    } catch (error: any) {
      const errAlert = await this.alertController.create({
        header: 'Unable to Send',
        message: 'Unable to send the agreement: ' + (error?.message || 'Unknown error'),
        buttons: ['OK']
      });
      await errAlert.present();
      return false;
    }
  }

  private async uploadAgreement(pdfBase64: string): Promise<boolean> {
    try {
      const uploadCallable = httpsCallable(this.functions, 'uploadStipulatedAgreementPdf');
      const result = await uploadCallable({
        pdfBase64,
        participantRecordId: this.participantRecordId,
        participantName: this.participantName
      }) as any;

      if (!result.data?.success) {
        throw new Error(result.data?.error?.message || 'QuickBase upload failed');
      }

      return true;
    } catch (error: any) {
      console.error('Upload agreement error', error);
      return false;
    }
  }

  private extractBase64Pdf(responseData: any): string {
    console.log('[PDF Debug] responseData type:', typeof responseData);
    console.log('[PDF Debug] responseData keys:', Object.keys(responseData || {}));

    let rawValue = responseData?.pdfBase64;

    if (typeof rawValue === 'string' && rawValue.startsWith('data:')) {
      rawValue = rawValue.split(',')[1];
    }

    if (rawValue === null || rawValue === undefined) {
      // Log safe response shape (no signatures) for diagnosis
      console.error('[PDF Debug] pdfBase64 missing; responseData:', JSON.stringify(responseData)?.substring(0, 200));
      throw new Error('PDF data is missing from the function response');
    }

    if (typeof rawValue !== 'string') {
      console.error('[PDF Debug] pdfBase64 is not a string; type:', typeof rawValue);
      throw new Error('PDF data is not a base64 string');
    }

    console.log('[PDF Debug] pdfBase64 length:', rawValue.length, 'starts with:', rawValue.substring(0, 30));

    return rawValue;
  }
}
