import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { QuickbaseService } from '../services/quickbase.service';

@Component({
  selector: 'app-meetings-classes',
  templateUrl: './meetings-classes.component.html',
  styleUrls: ['./meetings-classes.component.scss']
})
export class MeetingsClassesComponent implements OnInit {
  classesRecords: any[] = [];
  trainingRecord: any = null;
  residentData: any = null;
  selectedRecord: any = null;
  isLoading = false;

  constructor(
    private router: Router,
    private location: Location,
    private quickbaseService: QuickbaseService
  ) {}

  ngOnInit(): void {
    // Read navigation state passed from TrainingComponent
    const nav = this.router.getCurrentNavigation();
    if (nav && nav.extras && nav.extras.state) {
      const s = nav.extras.state as any;
      this.classesRecords = s.classesRecords || [];
      this.trainingRecord = s.trainingRecord || null;
      this.residentData = s.residentData || null;
    } else if (history && history.state) {
      const s = history.state as any;
      this.classesRecords = s.classesRecords || [];
      this.trainingRecord = s.trainingRecord || null;
      this.residentData = s.residentData || null;
    }

    if (!this.classesRecords.length && this.trainingRecord) {
      this.loadClassesForTraining();
    }
  }

  loadClassesForTraining() {
    if (!this.trainingRecord) return;
    this.isLoading = true;
    const title = this.formatField(this.trainingRecord[7]);
    this.quickbaseService.getClassesRecords(title).subscribe({
      next: res => {
        this.classesRecords = (res && res.data) ? res.data : [];
        this.isLoading = false;
      },
      error: err => {
        // console.error('Error loading classes:', err);
        this.classesRecords = [];
        this.isLoading = false;
      }
    });
  }

  selectClass(c: any) {
    this.selectedRecord = c;
    // console.debug('Selected class:', c);
  }

  // Template compatibility
  selectRecord(c: any) { this.selectClass(c); }

  register() {
    if (!this.selectedRecord) {
      window.alert('Please select a meeting/class first.');
      return;
    }
    this.router.navigate(['/registrations'], {
      state: {
        classRecord: this.selectedRecord,
        trainingRecord: this.trainingRecord,
        residentData: this.residentData
      }
    });
  }

  toRegister() { this.register(); }

  goBack() { this.location.back(); }

  exitApp() { this.router.navigate(['/login']); }

  formatField(fieldObj: any) {
    if (!fieldObj) return '';
    if (fieldObj.value !== undefined) return fieldObj.value;
    return fieldObj || '';
  }

  formatDate(value: any): string {
    const raw = value && value.value !== undefined ? value.value : value;
    if (!raw) return '';

    const str = String(raw);
    const isoDateOnly = /^\d{4}-\d{2}-\d{2}$/;
    if (isoDateOnly.test(str)) {
      const [y, m, d] = str.split('-').map(n => parseInt(n, 10));
      const local = new Date(y, m - 1, d);
      return local.toLocaleDateString();
    }

    try {
      const dt = typeof raw === 'number' ? new Date(raw) : new Date(str);
      if (isNaN(dt.getTime())) return String(raw);
      return dt.toLocaleDateString();
    } catch (e) {
      return String(raw);
    }
  }
}
