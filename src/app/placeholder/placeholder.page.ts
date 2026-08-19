import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { QuickbaseService } from '../services/quickbase.service';

@Component({
  selector: 'app-placeholder',
  templateUrl: './placeholder.page.html',
  styleUrls: ['./placeholder.page.scss'],
})
export class PlaceholderPage implements OnInit {
  residents$ = this.quickbaseService.residentData.asObservable();
  selectedResident: any = null;
  filteredPayments: any[] = [];
  title = 'Payments';

  constructor(
    private quickbaseService: QuickbaseService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.quickbaseService.invoicePayments.asObservable().subscribe(() => {
      this.filterPayments();
    });
  }

  payNow() {
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
