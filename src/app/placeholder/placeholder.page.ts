import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { QuickbaseService } from '../services/quickbase.service';

@Component({
  selector: 'app-placeholder',
  templateUrl: './placeholder.page.html',
  styleUrls: ['./placeholder.page.scss'],
})
export class PlaceholderPage implements OnInit {
  residents$ = this.quickbaseService.residentData.asObservable();
  selectedResident: any = null;
  isParticipant = false;
  theHouseName = '';
  filteredPayments: any[] = [];
  title = 'Payments';
  isPaying = false;

  constructor(
    private quickbaseService: QuickbaseService,
    private sanitizer: DomSanitizer,
    private router: Router
  ) {}

  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    let state = navigation?.extras?.state as any;
    if (!state && typeof window !== 'undefined' && window.history?.state) {
      const hs = window.history.state;
      state = hs.selectedResident ? hs : null;
    }
    if (state?.selectedResident) {
      this.selectedResident = state.selectedResident;
    }
    this.isParticipant = !!state?.isParticipant;
    this.theHouseName = state?.theHouseName || '';

    if (this.isParticipant && this.theHouseName && !this.quickbaseService.invoicePayments.value) {
      this.quickbaseService.getInvoicePayments(this.theHouseName).subscribe();
    }

    this.filterPayments();

    this.quickbaseService.invoicePayments.asObservable().subscribe(() => {
      this.filterPayments();
    });
  }

  payNow() {
    if (this.isPaying) { return; }
    this.isPaying = true;
    window.setTimeout(() => { this.isPaying = false; }, 5000);
    window.location.href = 'https://www.eprocessingnetwork.com/cgi-bin/epn/secure/pfg/payment.fpl?a=1215684&f=BB7B9257-7152-1014-A022-83C928D5EAB0';
  }

  onResidentSelected() {
    this.filterPayments();
  }

  private filterPayments() {
    if (!this.selectedResident) {
      this.filteredPayments = [];
      return;
    }
    const residentId = this.selectedResident.recordNumber2?.value ?? this.selectedResident.residentIDnumber?.value;
    const payments = this.quickbaseService.invoicePayments.value || [];
    this.filteredPayments = payments
      .filter((p: any) => p && String(p['28']?.value) === String(residentId))
      .sort((a: any, b: any) => {
        const aDate = new Date(a['6']?.value || 0).getTime();
        const bDate = new Date(b['6']?.value || 0).getTime();
        return bDate - aDate;
      });
  }

  compareResidents(o1: any, o2: any): boolean {
    return o1 && o2 && o1.recordNumber2?.value === o2.recordNumber2?.value;
  }

  getSafeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html || '');
  }
}
