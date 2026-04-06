import { Component, OnInit, Input } from '@angular/core';
import { PopoverController, ModalController } from '@ionic/angular';
import { QuickbaseService } from '../services/quickbase.service';
import { LoggerService } from '../services/logger.service';
import { ResidentActionsComponent } from '../resident-actions/resident-actions.component';
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

  constructor(
    private quickbaseService: QuickbaseService,
    private popoverCtrl: PopoverController,
    private modalCtrl: ModalController,
    private logger: LoggerService,
    private router: Router
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
  }

  async close() {
    try { await this.modalCtrl.dismiss(); } catch (e) {}
  }

  onInput(ev: any) {
    const v = ev.target.value || ev.detail?.value || '';
    this.query = v;
    // No automatic searching on input anymore — user must press Search button
    if (this.query.trim().length < 2) {
      this.results = [];
    }
  }

  search() {
    console.log('ResidentSearch.search called', { query: this.query });
    if (!this.query || this.query.trim().length < 2) {
      console.log('ResidentSearch.search - query too short, aborting');
      this.results = [];
      return;
    }
    this.isLoading = true;
    console.log('ResidentSearch.search - calling QuickbaseService');
    this.quickbaseService.searchResidentsByName(this.query, 50).subscribe(
      (resp: any[]) => {
        this.isLoading = false;
        this.results = Array.isArray(resp) ? resp : [];
        // Cache the search so Back can restore results without another API call
        try { this.quickbaseService.setLastResidentSearch(this.query, this.results); } catch (e) {}
        console.log('ResidentSearch.search - results received', { count: this.results.length });
        this.logger.debug('Resident search results', { query: this.query, count: this.results.length });
      },
      (err) => {
        this.isLoading = false;
        console.error('ResidentSearch.search - error', err);
        this.logger.error('Resident search error', err);
        this.results = [];
      }
    );
  }

  async presentResidentActions(resident: any) {
    try {
      const pop = await this.popoverCtrl.create({
        component: ResidentActionsComponent,
        componentProps: {
          resident,
          isPending: false,
          theHouseName: resident?.houseName?.value || resident?.houseName || '',
          houseLeaderRecordId: resident?.houseLeaderRecordId?.value || resident?.houseLeaderRecordId || '',
          houseLeaderName: resident?.houseLeaderName?.value || resident?.houseLeaderName || '',
          HLphone: resident?.houseLeaderPhone?.value || resident?.houseLeaderPhone || ''
          ,fromSearchModal: true
        },
        translucent: true
      });
      await pop.present();
    } catch (e) {
      this.logger.error('Error presenting resident actions from search', e);
    }
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
