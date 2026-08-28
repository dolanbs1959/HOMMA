import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { QuickbaseService } from '../services/quickbase.service';

@Component({
  selector: 'app-job-board',
  templateUrl: './job-board.page.html',
  styleUrls: ['./job-board.page.scss'],
})
export class JobBoardPage implements OnInit, OnDestroy {
  jobs: any[] = [];
  private jobsSub: any;

  constructor(
    private quickbaseService: QuickbaseService,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit() {
    // Use the already-cached open jobs; this never triggers a new QuickBase query.
    this.jobsSub = this.quickbaseService.openJobs.asObservable().subscribe(jobs => {
      this.jobs = Array.isArray(jobs) ? jobs : [];
    });
  }

  ngOnDestroy() {
    if (this.jobsSub && typeof this.jobsSub.unsubscribe === 'function') {
      this.jobsSub.unsubscribe();
    }
  }

  get openCount(): number {
    return this.jobs.length;
  }

  getAged(datePosted: any): string {
    if (!datePosted) {
      return '—';
    }
    const posted = new Date(datePosted);
    if (isNaN(posted.getTime())) {
      return '—';
    }
    const now = new Date();
    const diffMs = now.getTime() - posted.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days < 0) {
      return '—';
    }
    if (days === 0) {
      return 'Today';
    }
    if (days === 1) {
      return '1 day';
    }
    return `${days} days`;
  }

  openDetail(job: any) {
    this.router.navigate(['/job-detail'], { state: { job } });
  }

  formatPay(value: any): string {
    if (value === null || value === undefined || String(value).trim() === '') {
      return '';
    }
    const numeric = parseFloat(String(value).replace(/[^0-9.]/g, ''));
    if (isNaN(numeric)) {
      return String(value);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numeric);
  }

  goBack() {
    this.location.back();
  }

  trackByJob(index: number, job: any): string {
    return job?.id || index;
  }
}
