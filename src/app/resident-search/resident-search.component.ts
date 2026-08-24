import { Component, OnInit, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { QuickbaseService } from '../services/quickbase.service';
import { LoggerService } from '../services/logger.service';
import { UserService } from '../services/user.service';
import { PhotoStorageService } from '../services/photoProcessing.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-resident-search',
  templateUrl: './resident-search.component.html',
  styleUrls: ['./resident-search.component.scss']
})
export class ResidentSearchComponent implements OnInit {
  query: string = '';
  results: any[] = [];
  isLoading = false;
  @Input() initialQuery?: string;
  @Input() initialResults?: any[];
  @Input() initialSelectedResident?: any;
  @Input() initialPanelOpen = false;
  private search$ = new Subject<string>();

  selectedResident: any = null;
  selectedIsPending = false;
  panelOpen = false;
  canShowStipulated = false;
  theHouseName = '';
  houseLeaderName = '';
  houseLeaderRecordId = '';
  HLphone = '';
  private readonly panelTransitionMs = 400;

  constructor(
    private quickbaseService: QuickbaseService,
    private modalCtrl: ModalController,
    private logger: LoggerService,
    private router: Router,
    private userService: UserService,
    private photoStorageService: PhotoStorageService
  ) { }

  ngOnInit(): void {
    if (this.initialQuery) this.query = this.initialQuery;
    if (this.initialResults && this.initialResults.length) {
      this.results = this.initialResults;
    } else {
      const last = this.quickbaseService.getLastResidentSearch();
      if (last && last.results && last.results.length) {
        this.query = this.query || last.query || '';
        this.results = last.results;
      }
    }

    const last = this.quickbaseService.getLastResidentSearch();
    const preSelected = this.initialSelectedResident || (last?.openOnReturn ? last.selectedResident : undefined);
    if (preSelected) {
      this.selectedResident = preSelected;
      this.panelOpen = true;
    }

    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(q => q.trim().length >= 2)
    ).subscribe(q => this.performSearch(q));

    const qd = this.quickbaseService.queryData;
    this.theHouseName = qd?.theHouseName?.value || '';
    this.houseLeaderName = qd?.HouseLeaderName?.value || '';
    this.houseLeaderRecordId = qd?.HouseLeaderRecordId?.value || '';
    this.HLphone = qd?.HLphone?.value || '';

    const isParticipantStaff = this.userService.isStaffUser();
    const isHouseLeaderLoginStaff = !!this.quickbaseService.currentStaffRole && this.quickbaseService.currentStaffRole !== 'House Leader';
    this.canShowStipulated = isParticipantStaff || isHouseLeaderLoginStaff;
  }

  async close() {
    try { await this.modalCtrl.dismiss(); } catch (e) {}
  }

  onInput(ev: any) {
    const v = ev.target.value || ev.detail?.value || '';
    this.query = v;
    this.search$.next(v);
    if (this.query.trim().length < 2) {
      this.results = [];
    }
  }

  search() {
    console.log('ResidentSearch.search called', { query: this.query });
    this.performSearch(this.query);
  }

  private performSearch(query: string) {
    const trimmed = (query || '').trim();
    if (trimmed.length < 2) {
      console.log('ResidentSearch.performSearch - query too short, aborting');
      this.results = [];
      return;
    }
    this.isLoading = true;
    console.log('ResidentSearch.performSearch - calling QuickbaseService');
    this.quickbaseService.searchResidentsByName(trimmed, 50).subscribe(
      (resp: any[]) => {
        this.isLoading = false;
        this.results = Array.isArray(resp) ? resp : [];
        // Cache the search so Back can restore results without another API call
        try { this.quickbaseService.setLastResidentSearch(trimmed, this.results, this.selectedResident, false); } catch (e) {}
        console.log('ResidentSearch.performSearch - results received', { count: this.results.length });
        this.logger.debug('Resident search results', { query: trimmed, count: this.results.length });
      },
      (err) => {
        this.isLoading = false;
        console.error('ResidentSearch.performSearch - error', err);
        this.logger.error('Resident search error', err);
        this.results = [];
      }
    );
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
        this.quickbaseService.setLastResidentSearch(this.query, this.results, this.selectedResident, false);
      }, this.panelTransitionMs);
      return;
    }

    this.selectedResident = resident;
    this.selectedIsPending = isPending;
    setTimeout(() => {
      this.panelOpen = true;
      this.quickbaseService.setLastResidentSearch(this.query, this.results, this.selectedResident, false);
    }, 0);
  }

  deselect() {
    this.panelOpen = false;
    setTimeout(() => {
      this.selectedResident = null;
      this.selectedIsPending = false;
      this.quickbaseService.setLastResidentSearch(this.query, this.results, null, false);
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

  async gotoVitals() {
    if (!this.selectedResident) { return; }
    await this.viewResident(this.selectedResident);
  }

  async addObservation() {
    if (!this.selectedResident) { return; }
    try { await this.modalCtrl.dismiss(); } catch (e) {}
    this.router.navigate(['/observation-report'], { state: { residentData: this.selectedResident, fromSearch: true } }).catch(err => console.error('ResidentSearch.addObservation - navigation error', err));
  }

  async addResidentUpdate() {
    if (!this.selectedResident) { return; }
    try { await this.modalCtrl.dismiss(); } catch (e) {}
    this.router.navigate(['/resident-update', this.normalizedId], { state: { residentData: this.selectedResident, fromSearch: true } }).catch(err => console.error('ResidentSearch.addResidentUpdate - navigation error', err));
  }

  async openStipulatedAgreement() {
    if (!this.selectedResident) { return; }
    try { await this.modalCtrl.dismiss(); } catch (e) {}
    const r = this.selectedResident || {};
    const participantName = (r.residentFullName && (r.residentFullName.value || r.residentFullName)) || r.residentName || r.name || 'Unknown Participant';
    const participantId = r.recordNumber2?.value || r.recordNumber2 || r.recordNumber || this.normalizedId || '';
    const theHouseName = this.theHouseName || r.houseName?.value || r.houseName || '';
    this.router.navigate(['/stipulated-agreement'], {
      queryParams: { participantName, participantId, theHouseName, houseLeaderName: this.houseLeaderName || '' },
      state: { residentData: this.selectedResident, fromSearch: true }
    }).catch(err => console.error('ResidentSearch.openStipulatedAgreement - navigation error', err));
  }

  async addParticipantOneOnOne() {
    if (!this.selectedResident) { return; }
    try { await this.modalCtrl.dismiss(); } catch (e) {}
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

    this.router.navigate(['/participant-reviews'], { queryParams, state: { residentData: this.selectedResident, fromSearch: true } }).catch(err => console.error('ResidentSearch.addParticipantOneOnOne - navigation error', err));
  }

  async addTransportRequest() {
    if (!this.selectedResident) { return; }
    const resolvedHouseLeaderRecordId = this.resolveHouseLeaderRecordId();
    try { await this.modalCtrl.dismiss(); } catch (e) {}
    const queryParams: any = {
      participantName: this.normalizedName,
      participantId: this.normalizedId,
      theHouseName: this.theHouseName,
      houseLeaderName: this.houseLeaderName || '',
      houseLeaderRecordId: resolvedHouseLeaderRecordId || ''
    };
    this.router.navigate(['/transportation'], {
      queryParams,
      state: {
        residentData: this.selectedResident,
        fromSearch: true,
        houseLeaderRecordId: resolvedHouseLeaderRecordId || '',
        houseLeaderName: this.houseLeaderName || '',
        theHouseName: this.theHouseName
      }
    }).catch(err => console.error('ResidentSearch.addTransportRequest - navigation error', err));
  }

  async registerForMeeting() {
    if (!this.selectedResident) { return; }
    try { await this.modalCtrl.dismiss(); } catch (e) {}
    this.router.navigate(['/registrations'], { state: { residentData: this.selectedResident, fromSearch: true } }).catch(err => console.error('ResidentSearch.registerForMeeting - navigation error', err));
  }

  async viewResident(resident: any) {
    try {
      console.log('ResidentSearch.viewResident - selecting resident', { id: resident?.recordNumber2 || resident?.recordNumber });
      const residentClone: any = Object.assign({}, resident || {});
      // Remove bulky photo to keep state small (photo persisted via PhotoStorageService)
      if (residentClone) residentClone.residentPhoto = undefined;

      // Normalize common fields to { value: ... } shape so resident.detail templates work
      const ensureObjectValue = (obj: any, key: string) => {
        try {
          const v = obj[key];
          if (v === undefined || v === null) return;
          if (typeof v === 'object' && ('value' in v || Array.isArray(v))) return;
          obj[key] = { value: v };
        } catch (e) {}
      };

      const keysToNormalize = ['residentFullName','residentPhone','residentDOB','residentAge','Room','Bed','ParticipantStatus','houseName','houseLeaderName','houseLeaderPhone','recordNumber2','recordNumber','residentCCOfirst','residentCCOlast','residentCCOphone','residentCCOmobile','CareMgrName','ProgMgrName','ProgDirName'];
      keysToNormalize.forEach(k => ensureObjectValue(residentClone, k));

      await this.modalCtrl.dismiss();
      // Small delay to allow Ionic overlay dismissal and focus restoration
      await new Promise(r => setTimeout(r, 50));

      const navState: any = {
        residentData: residentClone,
        fromSearch: true,
        searchResults: this.results || [],
        searchQuery: this.query || ''
      };
      // Also pass top-level house/HL fields for convenience
      navState.theHouseName = residentClone.houseName?.value || residentClone.houseName || '';
      navState.houseLeaderName = residentClone.houseLeaderName?.value || residentClone.houseLeaderName || '';
      navState.houseLeaderRecordId = residentClone.houseLeaderRecordId?.value || residentClone.houseLeaderRecordId || '';

      // Determine normalized ID value
      const idVal = (residentClone.recordNumber2 && (residentClone.recordNumber2.value || residentClone.recordNumber2)) || residentClone.recordNumber || '';
      this.router.navigate(['/home/resident-detail', idVal], { state: navState }).then(() => {
        console.log('ResidentSearch.viewResident - navigation initiated', { state: navState.theHouseName, id: idVal });
      }).catch(err => console.error('ResidentSearch.viewResident - navigation error', err));
    } catch (e) {
      this.logger.error('Error navigating to resident detail from search', e);
    }
  }
}
