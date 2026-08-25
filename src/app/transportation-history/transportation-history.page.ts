import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { QuickbaseService } from '../services/quickbase.service';

@Component({
  selector: 'app-transportation-history',
  templateUrl: './transportation-history.page.html',
  styleUrls: ['./transportation-history.page.scss']
})
export class TransportationHistoryPage implements OnInit {
  resident: any = null;
  residentName: string = '';
  residentPhoto: string | undefined;
  residentId: string = '';
  theHouseName: string = '';
  houseLeaderName: string = '';
  houseLeaderRecordId: string = '';
  records: any[] = [];
  isLoading = false;
  fromSearch = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private quickbaseService: QuickbaseService
  ) {}

  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras && navigation.extras.state) {
      this.resident = navigation.extras.state['residentData'];
      this.fromSearch = !!navigation.extras.state['fromSearch'];
    }

    this.route.queryParams.subscribe(params => {
      this.residentName = params['participantName'] || this.getResidentName() || '';
      this.residentId = params['participantId'] || this.getResidentId() || '';
      this.residentPhoto = this.resident?.residentPhoto;
      this.theHouseName = params['theHouseName'] || this.resident?.houseName?.value || this.resident?.houseName || '';
      this.houseLeaderName = params['houseLeaderName'] || this.resident?.houseLeaderName?.value || this.resident?.houseLeaderName || '';
      this.houseLeaderRecordId = params['houseLeaderRecordId'] || this.resident?.houseLeaderRecordId?.value || this.resident?.houseLeaderRecordId || '';
      this.loadHistory();
    });
  }

  ionViewWillEnter() {
    this.loadHistory();
  }

  private getResidentName(): string {
    const r = this.resident || {};
    return r.residentFullName?.value || r.residentFullName || r.residentName || r.name || '';
  }

  private getResidentId(): string {
    const r = this.resident || {};
    return r.recordNumber2?.value || r.recordNumber2 || r.recordNumber || r.recordId || r.id || '';
  }

  loadHistory() {
    if (!this.residentId) { return; }
    this.isLoading = true;
    this.quickbaseService.getTransportationRecordsForResident(this.residentId).subscribe({
      next: (response: any) => {
        this.records = (response?.data || []).map((r: any) => r);
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading transportation history', error);
        this.records = [];
        this.isLoading = false;
      }
    });
  }

  openRecord(record: any) {
    this.router.navigate([`/transportation-update/${record.id}`], {
      queryParams: {
        recordId: record.id,
        participantName: this.residentName,
        participantId: this.residentId,
        theHouseName: this.theHouseName,
        houseLeaderName: this.houseLeaderName,
        houseLeaderRecordId: this.houseLeaderRecordId
      },
      state: {
        record,
        residentData: this.resident,
        fromSearch: this.fromSearch,
        theHouseName: this.theHouseName,
        houseLeaderName: this.houseLeaderName,
        houseLeaderRecordId: this.houseLeaderRecordId
      }
    });
  }

  startNewRequest() {
    this.router.navigate(['/transportation'], {
      queryParams: {
        participantName: this.residentName,
        participantId: this.residentId,
        theHouseName: this.theHouseName,
        houseLeaderName: this.houseLeaderName,
        houseLeaderRecordId: this.houseLeaderRecordId
      },
      state: {
        residentData: this.resident,
        fromSearch: this.fromSearch,
        theHouseName: this.theHouseName,
        houseLeaderName: this.houseLeaderName,
        houseLeaderRecordId: this.houseLeaderRecordId
      }
    });
  }

  goBack() {
    this.location.back();
  }
}
