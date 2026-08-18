import { Component } from '@angular/core';
import { QuickbaseService } from '../services/quickbase.service';
import { LoggerService } from '../services/logger.service';

@Component({
  selector: 'app-announcements',
  templateUrl: './announcements.page.html',
  styleUrls: ['./announcements.page.scss'],
})
export class AnnouncementsPage {
  isLoading = false;

  constructor(
    public quickbaseService: QuickbaseService,
    private logger: LoggerService
  ) {}

  ionViewWillEnter() {
    this.isLoading = true;
    this.quickbaseService.refreshAnnouncements().subscribe(
      () => {
        this.isLoading = false;
      },
      (error) => {
        this.logger.error('Error refreshing announcements', error);
        this.isLoading = false;
      }
    );
  }
}
