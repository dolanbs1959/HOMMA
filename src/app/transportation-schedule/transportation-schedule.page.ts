import { Component, OnInit } from '@angular/core';
import { QuickbaseService } from '../services/quickbase.service';

@Component({
  selector: 'app-transportation-schedule',
  templateUrl: './transportation-schedule.page.html',
  styleUrls: ['./transportation-schedule.page.scss'],
})
export class TransportationSchedulePage implements OnInit {
  transportRequests: any[] = [];
  scheduledRequests: any[] = [];
  openRequests: any[] = [];
  isLoading = false;

  constructor(public quickbaseService: QuickbaseService) {}

  ngOnInit() {
    this.loadTransportRequests();
  }

  ionViewWillEnter() {
    this.loadTransportRequests();
  }

  loadTransportRequests() {
    this.isLoading = true;
    this.quickbaseService.getTransportationRequests().subscribe({
      next: (response: any) => {
        this.transportRequests = response?.data || [];
        this.splitTransportRequests();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error fetching transport requests', error);
        this.isLoading = false;
      }
    });
  }

  private splitTransportRequests() {
    const list = Array.isArray(this.transportRequests) ? this.transportRequests : [];
    this.scheduledRequests = list
      .filter(r => (r.status || '').toString().toLowerCase() === 'scheduled')
      .sort((a, b) => new Date(a.dateRequested).getTime() - new Date(b.dateRequested).getTime());
    this.openRequests = list
      .filter(r => (r.status || '').toString().toLowerCase() === 'open')
      .sort((a, b) => new Date(a.dateRequested).getTime() - new Date(b.dateRequested).getTime());
  }
}
