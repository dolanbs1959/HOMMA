// home.page.ts
import { Component, OnInit } from '@angular/core';
import { QuickbaseService } from '../services/quickbase.service';
import { ThemeService } from '../services/theme.service';
import { ActivatedRoute, Router } from '@angular/router';
import { LoggerService } from '../services/logger.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
//  showError: boolean = false;
  HouseLeaderName: string = '';
  theHouseName: string = '';
  HLphone: string = '';
  announcements: any[] = [];

  // House KPI data
  houseKPIs: any = null;
  isLoadingKPIs: boolean = false;
  houseLeaderRecordId: string = ''; // Now retrieved directly from login query field 9

  constructor(
    public quickbaseService: QuickbaseService,
    private route: ActivatedRoute,
    private router: Router,
    public themeService: ThemeService,
    private logger: LoggerService
  ) {}

  payNow() {
    window.location.href = 'https://houseofmercyministries.net/payments/';
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  exitApp() {
    this.router.navigate(['/login']);
  }

  ngOnInit() {
    // Subscribe to cached announcements - will fetch if cache is stale
    this.quickbaseService.refreshAnnouncements().subscribe(
      (response) => {
        this.logger.debug('Announcements loaded');
        this.announcements = response.data || [];
      },
      (error) => {
        this.logger.error('Error fetching announcements', error);
      }
    );

    // Use cached BehaviorSubject for announcements updates
    this.quickbaseService.announcements.subscribe(
      (announcementsData) => {
        if (announcementsData) {
          this.announcements = announcementsData.data || [];
        }
      }
    );

    // `residentData` and `pendingArrivals` are updated via subscriptions
    // set up in the constructor — do not overwrite them with the
    // BehaviorSubject objects here (causes the UI to receive the
    // wrong shape and briefly flash then disappear).

    this.route.params.subscribe(params => {
      this.logger.debug('Route params loaded');
      const qd = this.quickbaseService.queryData;
      const value = (field: string) => qd?.[field]?.value ?? params[field];
      this.theHouseName = value('theHouseName');
      this.HouseLeaderName = value('HouseLeaderName');
      this.houseLeaderRecordId = value('HouseLeaderRecordId') || ''; // Get house leader record ID from login
      this.HLphone = value('HLphone');

      this.logger.debug('✅ House leader record ID loaded');

      // Load KPI data once we have the house name
      if (this.theHouseName) {
        this.loadHouseKPIs();
      }
    });
  }

  loadHouseKPIs() {
    if (!this.theHouseName) {
      this.logger.warn('Cannot load KPIs: No house name available');
      return;
    }

    // Try to get KPI data for this house from cached data
    const kpiData = this.quickbaseService.getHouseKPIsByName(this.theHouseName);
    if (kpiData) {
      this.houseKPIs = kpiData;
      this.isLoadingKPIs = false;
      this.logger.debug('House KPIs loaded from cache');
    } else {
      // If no cached data, the house data should be loaded when getHouseNames() was called during login
      this.logger.debug('No KPI data available for this house - preserving existing KPI view if present');
      // Do not overwrite existing `houseKPIs` with null/empty which causes a UI flash.
      // Leave `this.houseKPIs` unchanged so the restored state remains visible until
      // a successful fresh response is available.
      this.isLoadingKPIs = false;
    }
  }

  navigateToDetail(id: string, ispendingArrival: boolean, residentName: string) {
    // Do NOT include large/base64 `residentPhoto` data in query params (causes huge analytics payloads and network errors).
    // The resident photo is cached in `PhotoStorageService`; pass only the record id and other small fields.
    const navigationExtras = {
      queryParams: {
        residentName: residentName,
        theHouseName: this.theHouseName,
        houseLeaderName: this.HouseLeaderName,
        houseLeaderRecordId: this.houseLeaderRecordId, // Pass house leader record ID from login query
        recordNumber2: id
      }
    };
    this.logger.debug('Navigating to resident detail');

    if (ispendingArrival) {
      this.router.navigate(['/resident-update', id], navigationExtras);
      this.logger.debug('Navigating to Resident Update');
    } else {
      this.router.navigate(['/home/resident-detail', id], navigationExtras);
      this.logger.debug('Navigating to Resident Detail');
    }
  }
}
