import { Component, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-resident-actions',
  templateUrl: './resident-actions.component.html',
  styleUrls: ['./resident-actions.component.scss']
})
export class ResidentActionsComponent implements OnInit {
  // Passed in via componentProps
  resident: any = null;
  residentOriginal: any = null;
  isPending: boolean = false;
  theHouseName: string = '';
  houseLeaderRecordId: string = '';
  houseLeaderName: string = '';
  HLphone: string = '';
  maxMeetingDate: string = '';

  constructor(
    private popoverCtrl: PopoverController,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Keep original object and provide normalized accessors for templates/routes
    this.residentOriginal = this.resident;
    // Coerce boolean-like values passed via componentProps
    try {
      this.isPending = !!this.isPending;
      this.theHouseName = this.theHouseName || '';
      this.houseLeaderRecordId = this.houseLeaderRecordId || '';
      this.houseLeaderName = this.houseLeaderName || '';
    } catch (e) {
      // ignore
    }
  }

  get normalizedId(): string {
    const r = this.residentOriginal || this.resident || {};
    return (r.recordNumber2 && (r.recordNumber2.value || r.recordNumber2)) || r.recordNumber || r.id || r.recordId || '';
  }

  get normalizedName(): string {
    const r = this.residentOriginal || this.resident || {};
    return (r.residentFullName && (r.residentFullName.value || r.residentFullName)) || r.residentName || r.name || '';
  }

  get normalizedPhoto(): string {
    const r = this.residentOriginal || this.resident || {};
    return (r.residentPhoto && (r.residentPhoto.value || r.residentPhoto)) || r.photo || '';
  }

  close(data?: any) {
    return this.popoverCtrl.dismiss(data);
  }

  gotoDetail() {
    const navigationExtras: any = {
      queryParams: {
        residentName: this.normalizedName,
        theHouseName: this.theHouseName,
        houseLeaderName: '',
        houseLeaderRecordId: this.houseLeaderRecordId,
        recordNumber2: this.normalizedId
      },
      state: {
        residentData: this.residentOriginal || this.resident,
        theHouseName: this.theHouseName,
        houseLeaderName: this.houseLeaderName || ''
      }
    };
    this.close();
    // Always navigate to resident detail page for Resident Vitals,
    // even for pending/new-arrival residents.
    this.router.navigate(['/home/resident-detail', this.normalizedId], navigationExtras);
  }

  addObservation() {
    this.close();
    // ObservationReportComponent expects residentData in navigation state
    this.router.navigate(['/observation-report'], { state: { residentData: this.residentOriginal || this.resident } });
  }

  addResidentUpdate() {
    this.close();
    // Pass residentData in navigation state so the Resident Update page can
    // populate name/photo when opened from an active resident.
    this.router.navigate(['/resident-update', this.normalizedId], { state: { residentData: this.residentOriginal || this.resident } });
  }

  addParticipantOneOnOne() {
    this.close();
    // ParticipantReviews expects query params for participantId/name
    const queryParams: any = {
      participantId: this.normalizedId,
      participantName: this.normalizedName
    };
    this.router.navigate(['/participant-reviews'], { queryParams, state: { residentData: this.residentOriginal || this.resident } });
  }

  addTransportRequest() {
    this.close();
    // Navigation uses query params so TransportationComponent can read them in ngOnInit
    const queryParams: any = {
      participantName: this.normalizedName,
      participantId: this.normalizedId,
      theHouseName: this.theHouseName,
      houseLeaderName: this.houseLeaderName || '',
      houseLeaderRecordId: this.houseLeaderRecordId || ''
    };
    this.router.navigate(['/transportation'], { queryParams });
  }

  registerForMeeting() {
    this.close();
    // RegistrationsComponent reads residentData from navigation state
    this.router.navigate(['/registrations'], { state: { residentData: this.residentOriginal || this.resident } });
  }

  cancel() {
    this.close();
  }
}
