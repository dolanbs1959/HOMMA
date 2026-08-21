import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { logOutOutline, moon, sunny } from 'ionicons/icons';
import { QuickbaseService } from '../services/quickbase.service';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
})
export class TabsPage implements OnInit {
  theHouseName = '';
  HouseLeaderName = '';
  HLphone = '';
  pageTitle = 'HOM Mobile Assistant - KPIs';

  private readonly titleMap: { [tab: string]: string } = {
    kpis: 'HOM Mobile Assistant - KPIs',
    'house-leader-tasks': 'HOM Mobile Assistant - Tasks',
    participants: 'HOM Mobile Assistant - Participants',
    transportation: 'HOM Mobile Assistant - Transport',
    requests: 'HOM Mobile Assistant - Requests',
    announcements: 'HOM Mobile Assistant - Announcements',
    payments: 'HOM Mobile Assistant - Payments',
  };

  constructor(
    public quickbaseService: QuickbaseService,
    public themeService: ThemeService,
    private router: Router
  ) {
    // Register the header icons before the view (and ion-icon elements) are created,
    // so the icon map is populated when <ion-icon> first tries to resolve the SVG.
    addIcons({ logOutOutline, moon, sunny });
  }

  ngOnInit() {
    const qd = this.quickbaseService.queryData;
    this.theHouseName = qd?.theHouseName?.value || '';
    this.HouseLeaderName = qd?.HouseLeaderName?.value || '';
    this.HLphone = qd?.HLphone?.value || '';

    // Default title until an ionTabsDidChange event fires
    this.setPageTitle('participants');
  }

  setPageTitle(tab: string) {
    this.pageTitle = this.titleMap[tab] || 'HOM Mobile Assistant';
  }

  onTabChange(event: any) {
    const tab = (event?.tab ?? event?.detail?.tab) || '';
    this.setPageTitle(tab);
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  exitApp() {
    this.router.navigate(['/login']);
  }
}
