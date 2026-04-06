import { Component, OnInit, NgZone, ApplicationRef } from '@angular/core';
import { PopoverController, ModalController } from '@ionic/angular';
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
  fromSearchModal: boolean = false;

  constructor(
    private popoverCtrl: PopoverController,
    private router: Router,
    private ngZone: NgZone,
    private appRef: ApplicationRef,
    private modalCtrl: ModalController
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

  async gotoDetail() {
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
        houseLeaderName: this.houseLeaderName || '',
        fromSearch: this.fromSearchModal || false
      }
    };
    console.log('ResidentActions.gotoDetail - navigating to resident-detail', { id: this.normalizedId, navigationExtras });
    await this.close();
    // If this popover was opened from the search modal, also dismiss that modal so
    // the navigation target can become visible.
    if (this.fromSearchModal) {
      try { await this.modalCtrl.dismiss(); } catch (e) {}
    }
    try { (document.activeElement as HTMLElement)?.blur(); } catch (e) {}
    console.log('ResidentActions.gotoDetail - popover closed, clearing overlays');
    await this.clearOverlays();
    // Always navigate to resident detail page for Resident Vitals,
    // even for pending/new-arrival residents.
    this.ngZone.run(() => {
      this.router.navigate(['/home/resident-detail', this.normalizedId], navigationExtras).then(() => {
        console.log('ResidentActions.gotoDetail - router.navigate resolved');
        try { this.appRef.tick(); } catch (e) {}
      }).catch(err => console.error('ResidentActions.gotoDetail - navigation error', err));
    });
  }

  async addObservation() {
    console.log('ResidentActions.addObservation - closing popover and navigating to observation-report', { id: this.normalizedId });
    await this.close();
    try { (document.activeElement as HTMLElement)?.blur(); } catch (e) {}
    await this.clearOverlays();
    // ObservationReportComponent expects residentData in navigation state
    this.ngZone.run(() => {
      this.router.navigate(['/observation-report'], { state: { residentData: this.residentOriginal || this.resident, fromSearch: this.fromSearchModal || false } }).catch(err => console.error('ResidentActions.addObservation - navigation error', err));
    });
  }

  async addResidentUpdate() {
    console.log('ResidentActions.addResidentUpdate - navigating to resident-update', { id: this.normalizedId });
    await this.close();
    try { (document.activeElement as HTMLElement)?.blur(); } catch (e) {}
    await this.clearOverlays();
    // Pass residentData in navigation state so the Resident Update page can
    // populate name/photo when opened from an active resident.
    this.ngZone.run(() => {
      this.router.navigate(['/resident-update', this.normalizedId], { state: { residentData: this.residentOriginal || this.resident, fromSearch: this.fromSearchModal || false } }).catch(err => console.error('ResidentActions.addResidentUpdate - navigation error', err));
    });
  }

  async addParticipantOneOnOne() {
    console.log('ResidentActions.addParticipantOneOnOne - navigating to participant-reviews', { id: this.normalizedId });
    await this.close();
    try { (document.activeElement as HTMLElement)?.blur(); } catch (e) {}
    await this.clearOverlays();
    // ParticipantReviews expects query params for participantId/name
    const queryParams: any = {
      participantId: this.normalizedId,
      participantName: this.normalizedName
    };
    this.ngZone.run(() => {
      this.router.navigate(['/participant-reviews'], { queryParams, state: { residentData: this.residentOriginal || this.resident, fromSearch: this.fromSearchModal || false } }).catch(err => console.error('ResidentActions.addParticipantOneOnOne - navigation error', err));
    });
  }

  async addTransportRequest() {
    console.log('ResidentActions.addTransportRequest - navigating to transportation', { id: this.normalizedId });
    await this.close();
    try { (document.activeElement as HTMLElement)?.blur(); } catch (e) {}
    await this.clearOverlays();
    // Navigation uses query params so TransportationComponent can read them in ngOnInit
    const queryParams: any = {
      participantName: this.normalizedName,
      participantId: this.normalizedId,
      theHouseName: this.theHouseName,
      houseLeaderName: this.houseLeaderName || '',
      houseLeaderRecordId: this.houseLeaderRecordId || ''
    };
    this.ngZone.run(() => {
      this.router.navigate(['/transportation'], { queryParams, state: { fromSearch: this.fromSearchModal || false } }).catch(err => console.error('ResidentActions.addTransportRequest - navigation error', err));
    });
  }

  async registerForMeeting() {
    console.log('ResidentActions.registerForMeeting - navigating to registrations', { id: this.normalizedId });
    await this.close();
    try { (document.activeElement as HTMLElement)?.blur(); } catch (e) {}
    await this.clearOverlays();
    // RegistrationsComponent reads residentData from navigation state
    this.ngZone.run(() => {
      this.router.navigate(['/registrations'], { state: { residentData: this.residentOriginal || this.resident, fromSearch: this.fromSearchModal || false } }).catch(err => console.error('ResidentActions.registerForMeeting - navigation error', err));
    });
  }

  cancel() {
    this.close();
  }

  private async clearOverlays() {
    try {
      // Dismiss top popover if still present
      const topPop = await this.popoverCtrl.getTop();
      if (topPop) {
        try { await topPop.dismiss(); } catch (e) {}
      }
      // Dismiss top modal if still present
      const topModal = await this.modalCtrl.getTop();
      if (topModal) {
        try { await topModal.dismiss(); } catch (e) {}
      }
      // Small delay to ensure overlays teardown
      await new Promise(r => setTimeout(r, 60));
      console.log('ResidentActions.clearOverlays - finished');
    } catch (e) {
      console.warn('ResidentActions.clearOverlays - error', e);
    }
  }
}
