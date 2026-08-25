import { Component, OnInit, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { QuickbaseService } from '../services/quickbase.service';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-placeholder',
  templateUrl: './placeholder.page.html',
  styleUrls: ['./placeholder.page.scss'],
})
export class PlaceholderPage implements OnInit, OnDestroy {
  residents$ = this.quickbaseService.residentData.asObservable();
  selectedResident: any = null;
  isParticipant = false;
  fromSearch = false;
  fromResidentDetails = false;
  theHouseName = '';
  filteredPayments: any[] = [];
  residentPayments: any[] | null = null;
  isLoadingPayments = false;
  title = 'Payments';
  isPaying = false;
  private destroyed$ = new Subject<void>();

  constructor(
    private quickbaseService: QuickbaseService,
    private sanitizer: DomSanitizer,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit() {
    const state = this.readNavigationState();
    this.applyPaymentState(state);
    this.loadPaymentData();
    this.filterPayments();

    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      filter((event: NavigationEnd) => event.urlAfterRedirects.includes('/payments')),
      takeUntil(this.destroyed$)
    ).subscribe(() => {
      const s = this.readNavigationState();
      this.applyPaymentState(s);
      this.loadPaymentData();
      this.filterPayments();
    });

    this.quickbaseService.invoicePayments.asObservable().pipe(
      takeUntil(this.destroyed$)
    ).subscribe(() => {
      this.filterPayments();
    });
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  goBack() {
    this.location.back();
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

  private loadPaymentData() {
    if (!this.fromSearch && this.isParticipant && this.theHouseName && !this.quickbaseService.invoicePayments.value) {
      this.quickbaseService.getInvoicePayments(this.theHouseName).subscribe();
    }

    if (this.fromSearch && this.selectedResident) {
      if (this.isLoadingPayments) { return; }
      this.residentPayments = null;
      this.isLoadingPayments = true;
      const residentId = this.selectedResident.recordNumber2?.value ?? this.selectedResident.residentIDnumber?.value;
      this.quickbaseService.getInvoicePaymentsForResident(residentId).subscribe({
        next: (data) => {
          this.residentPayments = data;
          this.isLoadingPayments = false;
          this.filterPayments();
        },
        error: (err) => {
          this.residentPayments = [];
          this.isLoadingPayments = false;
          this.filterPayments();
          console.error('Error loading resident payments', err);
        }
      });
    }
  }

  private readNavigationState(): any {
    const navigation = this.router.getCurrentNavigation();
    let state = navigation?.extras?.state as any;
    if (!state && typeof window !== 'undefined' && window.history?.state) {
      const hs = window.history.state;
      state = hs.selectedResident ? hs : null;
    }
    return state;
  }

  private applyPaymentState(state: any) {
    if (state?.selectedResident) {
      this.selectedResident = state.selectedResident;
    }
    this.isParticipant = !!state?.isParticipant;
    this.fromSearch = !!state?.fromSearch;
    this.fromResidentDetails = !!state?.fromResidentDetails;
    this.theHouseName = state?.theHouseName || '';
  }

  private filterPayments() {
    if (!this.selectedResident) {
      this.filteredPayments = [];
      return;
    }
    const residentId = this.selectedResident.recordNumber2?.value ?? this.selectedResident.residentIDnumber?.value;
    const payments = this.fromSearch ? (this.residentPayments || []) : (this.quickbaseService.invoicePayments.value || []);
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
