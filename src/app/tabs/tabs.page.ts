import { Component, OnInit } from '@angular/core';
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

  constructor(
    public quickbaseService: QuickbaseService,
    public themeService: ThemeService
  ) {}

  ngOnInit() {
    const qd = this.quickbaseService.queryData;
    this.theHouseName = qd?.theHouseName?.value || '';
    this.HouseLeaderName = qd?.HouseLeaderName?.value || '';
    this.HLphone = qd?.HLphone?.value || '';
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
