import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { QuickbaseService } from '../services/quickbase.service';
import { UserService } from '../services/user.service';
import { PhotoStorageService } from '../services/photoProcessing.service';

@Component({
  selector: 'app-participants',
  templateUrl: './participants.page.html',
  styleUrls: ['./participants.page.scss'],
})
export class ParticipantsPage implements OnInit, OnDestroy {
  theHouseName = '';
  houseLeaderRecordId = '';
  houseLeaderName = '';
  HLphone = '';
  maxMeetingDate = '';
  canShowStipulated = false;
  STAalert = '';

  selectedResident: any = null;
  selectedIsPending = false;
  panelOpen = false;
  private readonly panelTransitionMs = 400;
  private subs: any[] = [];

  constructor(
    public quickbaseService: QuickbaseService,
    private userService: UserService,
    private photoStorageService: PhotoStorageService,
    private router: Router
  ) {}

  ngOnInit() {
    const qd = this.quickbaseService.queryData;
    this.theHouseName = qd?.theHouseName?.value || '';
    this.houseLeaderName = qd?.HouseLeaderName?.value || '';
    this.houseLeaderRecordId = qd?.HouseLeaderRecordId?.value || '';
    this.HLphone = qd?.HLphone?.value || '';
    this.maxMeetingDate = qd?.maxMeetingDate?.value || '';

    const isParticipantStaff = this.userService.isStaffUser();
    const isHouseLeaderLoginStaff = !!this.quickbaseService.currentStaffRole && this.quickbaseService.currentStaffRole !== 'House Leader';
    this.canShowStipulated = isParticipantStaff || isHouseLeaderLoginStaff;

    const staSub = this.quickbaseService.STAalert$.subscribe((val: string) => {
      this.STAalert = val || 'There are 0 Staff Task Assignments Overdue';
    });
    this.subs.push(staSub);
  }

  ionViewWillLeave() {
    this.deselect();
  }

  ngOnDestroy() {
    this.subs.forEach(s => s && s.unsubscribe && s.unsubscribe());
  }

  selectResident(resident: any, isPending: boolean = false) {
    if (this.selectedResident === resident && this.selectedIsPending === isPending) {
      this.deselect();
      return;
    }

    if (this.panelOpen) {
      this.panelOpen = false;
      setTimeout(() => {
        this.selectedResident = resident;
        this.selectedIsPending = isPending;
        this.panelOpen = true;
      }, this.panelTransitionMs);
      return;
    }

    this.selectedResident = resident;
    this.selectedIsPending = isPending;
    setTimeout(() => this.panelOpen = true, 0);
  }

  deselect() {
    this.panelOpen = false;
    setTimeout(() => {
      this.selectedResident = null;
      this.selectedIsPending = false;
    }, this.panelTransitionMs);
  }

  private getResidentValue(resident: any, key: string): string {
    const value = resident?.[key];
    if (value && typeof value === 'object' && 'value' in value) {
      return String(value.value || '').trim();
    }
    return String(value || '').trim();
  }

  private resolveHouseLeaderRecordId(): string {
    const resident = this.selectedResident || {};
    const candidates = [
      this.houseLeaderRecordId,
      this.getResidentValue(resident, 'houseLeaderRecordId'),
      this.getResidentValue(resident, 'HouseLeaderRecordId'),
      this.getResidentValue(resident, 'houseLeaderRecordID'),
      this.getResidentValue(resident, 'houseLeaderRecordID2')
    ];

    for (const candidate of candidates) {
      if (candidate) {
        return candidate;
      }
    }

    return '';
  }

  get normalizedId(): string {
    const r = this.selectedResident || {};
    return (r.recordNumber2 && (r.recordNumber2.value || r.recordNumber2)) || r.recordNumber || r.id || r.recordId || '';
  }

  get normalizedName(): string {
    const r = this.selectedResident || {};
    return (r.residentFullName && (r.residentFullName.value || r.residentFullName)) || r.residentName || r.name || '';
  }

  gotoVitals() {
    if (!this.selectedResident) { return; }
    const navigationExtras: any = {
      queryParams: {
        residentName: this.normalizedName,
        theHouseName: this.theHouseName,
        houseLeaderName: '',
        houseLeaderRecordId: this.houseLeaderRecordId,
        recordNumber2: this.normalizedId
      },
      state: {
        residentData: this.selectedResident,
        theHouseName: this.theHouseName,
        houseLeaderName: this.houseLeaderName || '',
        fromSearch: false,
        isResident: false
      }
    };
    this.router.navigate(['/home/resident-detail', this.normalizedId], navigationExtras).catch(err => console.error('ParticipantsPage.gotoVitals - navigation error', err));
  }

  addObservation() {
    if (!this.selectedResident) { return; }
    this.router.navigate(['/observation-report'], { state: { residentData: this.selectedResident, fromSearch: false } }).catch(err => console.error('ParticipantsPage.addObservation - navigation error', err));
  }

  addResidentUpdate() {
    if (!this.selectedResident) { return; }
    this.router.navigate(['/resident-update', this.normalizedId], { state: { residentData: this.selectedResident, fromSearch: false } }).catch(err => console.error('ParticipantsPage.addResidentUpdate - navigation error', err));
  }

  openStipulatedAgreement() {
    if (!this.selectedResident) { return; }
    const r = this.selectedResident || {};
    const participantName = (r.residentFullName && (r.residentFullName.value || r.residentFullName)) || r.residentName || r.name || 'Unknown Participant';
    const participantId = r.recordNumber2?.value || r.recordNumber2 || r.recordNumber || this.normalizedId || '';
    const theHouseName = this.theHouseName || r.houseName?.value || r.houseName || '';

    this.router.navigate(['/stipulated-agreement'], {
      queryParams: { participantName, participantId, theHouseName, houseLeaderName: this.houseLeaderName || '' },
      state: { residentData: this.selectedResident, fromSearch: false }
    }).catch(err => console.error('ParticipantsPage.openStipulatedAgreement - navigation error', err));
  }

  addParticipantOneOnOne() {
    if (!this.selectedResident) { return; }
    const r = this.selectedResident;
    const participantName = r.residentFullName && (r.residentFullName.value || r.residentFullName) || r.residentName || r.name || 'Unknown Participant';
    const residentPhoto = r.residentPhoto || null;
    const ccoFirstName = r.residentCCOfirst?.value || '';
    const ccoLastName = r.residentCCOlast?.value || '';
    const ccoFullName = ccoFirstName && ccoLastName ? `${ccoFirstName} ${ccoLastName}` : ccoFirstName || ccoLastName || 'CCO not listed';
    const ccoPhoneNumber = r.residentCCOphone?.value || 'No Phone Number';
    const ccoMobile = r.residentCCOmobile?.value || 'No Mobile Number';
    const ccoEmail = r.residentCCOemail?.value || r.residentCCOEmail?.value || 'No CCO Email';
    const workStatus = r.WorkStatus?.value || 'Unknown Work Status';
    const docStatus = r.residentDOCstatus?.value || '';
    const participantEmail = r.residentEmail?.value || 'No Email';
    const participantPhone = r.residentPhone?.value || 'No Phone';
    const participantId = r.recordNumber2?.value || r.recordNumber || this.normalizedId || 'No ID';
    const Last1on1Date = r.Last1on1Date?.value || 'No Date';

    try {
      if (residentPhoto && participantId) {
        try { this.photoStorageService.setPhoto(String(participantId), residentPhoto); } catch (e) {}
        try { sessionStorage.setItem(`residentPhoto_${participantId}`, residentPhoto); } catch (e) {}
      }
    } catch (e) {}

    const queryParams: any = {
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
    };

    this.router.navigate(['/participant-reviews'], { queryParams, state: { residentData: this.selectedResident, fromSearch: false } }).catch(err => console.error('ParticipantsPage.addParticipantOneOnOne - navigation error', err));
  }

  addTransportRequest() {
    if (!this.selectedResident) { return; }
    const resolvedHouseLeaderRecordId = this.resolveHouseLeaderRecordId();
    const isStaff = this.userService.isStaffUser();
    const destination = isStaff ? '/transportation-history' : '/transportation';
    const queryParams: any = {
      participantName: this.normalizedName,
      participantId: this.normalizedId,
      theHouseName: this.theHouseName,
      houseLeaderName: this.houseLeaderName || '',
      houseLeaderRecordId: resolvedHouseLeaderRecordId || ''
    };
    this.router.navigate([destination], {
      queryParams,
      state: {
        residentData: this.selectedResident,
        fromSearch: false,
        houseLeaderRecordId: resolvedHouseLeaderRecordId || '',
        houseLeaderName: this.houseLeaderName || '',
        theHouseName: this.theHouseName
      }
    }).catch(err => console.error('ParticipantsPage.addTransportRequest - navigation error', err));
  }

  navigateToClassroom() {
    if (!this.selectedResident) { return; }
    const r = this.selectedResident;
    const participantId = r.recordNumber2?.value || r.recordNumber2 || r.recordNumber || '';
    const participantPhoto = r.residentPhoto || null;

    if (participantPhoto && participantId) {
      try { this.photoStorageService.setPhoto(String(participantId), participantPhoto); } catch (e) {}
      try { sessionStorage.setItem(`residentPhoto_${participantId}`, participantPhoto); } catch (e) {}
    }

    const residentClone: any = Object.assign({}, r);
    if (residentClone) residentClone.residentPhoto = undefined;

    const navState: any = {
      residentData: residentClone,
      theHouseName: this.theHouseName,
      houseLeaderName: this.houseLeaderName || '',
      houseLeaderRecordId: this.houseLeaderRecordId || '',
      fromSearch: false,
      returnUrl: this.router.url
    };

    const queryParams: any = { participantId: String(participantId) };

    this.router.navigate(['/classroom'], { state: navState, queryParams })
      .catch(err => console.error('ParticipantsPage.navigateToClassroom - navigation error', err));
  }
}
