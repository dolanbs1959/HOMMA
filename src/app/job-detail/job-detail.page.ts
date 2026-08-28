import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { QuickbaseService } from '../services/quickbase.service';

@Component({
  selector: 'app-job-detail',
  templateUrl: './job-detail.page.html',
  styleUrls: ['./job-detail.page.scss'],
})
export class JobDetailPage implements OnInit {
  job: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private sanitizer: DomSanitizer,
    private quickbaseService: QuickbaseService
  ) {}

  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state as { job: any };

    if (state?.job) {
      this.job = state.job;
      return;
    }

    // Fallback for direct URL loads or refreshes: look the job up in the cached array.
    const id = this.route.snapshot.queryParamMap.get('id') || this.route.snapshot.queryParamMap.get('jobId');
    if (id) {
      const cached = this.quickbaseService.openJobs.value || [];
      this.job = (Array.isArray(cached) ? cached : []).find((j: any) => String(j?.id) === String(id));
    }
  }

  hasValue(value: any): boolean {
    return value !== null && value !== undefined && String(value).trim() !== '';
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

  applyHere() {
    if (!this.hasValue(this.job?.employerWebsite)) {
      return;
    }
    let url = String(this.job.employerWebsite).trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    try {
      window.open(url, '_blank');
    } catch (e) {
      console.error('Failed to open employer website', e);
    }
  }

  formatPay(value: any): string {
    if (!this.hasValue(value)) {
      return '';
    }
    const numeric = parseFloat(String(value).replace(/[^0-9.]/g, ''));
    if (isNaN(numeric)) {
      return String(value);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numeric);
  }

  getSafeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html || '');
  }

  goBack() {
    this.location.back();
  }
}
