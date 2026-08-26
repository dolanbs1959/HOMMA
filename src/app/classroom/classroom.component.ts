import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { QuickbaseService } from '../services/quickbase.service';
import { PhotoStorageService } from '../services/photoProcessing.service';

@Component({
  selector: 'app-classroom',
  templateUrl: './classroom.component.html',
  styleUrls: ['./classroom.component.scss']
})
export class ClassroomComponent implements OnInit {
  residentData: any = null;
  registeredClasses: any[] = [];
  isLoading = true;
  errorMessage = '';
  participantId = '';
  selectedClass: any = null;
  returnUrl = '';

  constructor(
    private router: Router,
    private location: Location,
    private quickbaseService: QuickbaseService,
    private photoStorageService: PhotoStorageService
  ) {}

  ngOnInit(): void {
    const nav = this.router.getCurrentNavigation();
    if (nav && nav.extras && nav.extras.state && nav.extras.state['residentData']) {
      this.residentData = nav.extras.state['residentData'];
    } else if (history && history.state && history.state['residentData']) {
      this.residentData = history.state['residentData'];
    }

    if (nav?.extras?.state?.['returnUrl']) {
      this.returnUrl = nav.extras.state['returnUrl'];
    } else if (history?.state?.['returnUrl']) {
      this.returnUrl = history.state['returnUrl'];
    }

    this.participantId = String(
      this.residentData?.recordNumber2?.value
      || this.residentData?.recordNumber2
      || this.residentData?.recordNumber
      || this.residentData?.recordId
      || this.residentData?.id
      || ''
    );

    // If the resident data arrived without a photo, try to recover it from storage
    if (this.residentData && this.participantId && !this.residentData.residentPhoto) {
      const stored = this.photoStorageService.getPhoto(this.participantId);
      if (stored) {
        this.residentData.residentPhoto = stored;
      } else {
        try {
          const ss = sessionStorage.getItem(`residentPhoto_${this.participantId}`);
          if (ss) {
            this.residentData.residentPhoto = ss;
          }
        } catch (e) {}
      }
    }

    this.loadRegisteredClasses();
  }

  loadRegisteredClasses() {
    if (!this.participantId) {
      this.registeredClasses = [];
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.quickbaseService.getRegisteredClasses(this.participantId).subscribe({
      next: (res: any) => {
        this.registeredClasses = (res && res.data) ? res.data : [];
        this.isLoading = false;
      },
      error: err => {
        this.errorMessage = 'Unable to load registered classes.';
        this.registeredClasses = [];
        this.isLoading = false;
      }
    });
  }

  registerForClasses() {
    if (!this.residentData) return;

    const r = this.residentData;
    const pid = this.participantId;
    const participantPhoto = r.residentPhoto || null;

    if (participantPhoto && pid) {
      try { this.photoStorageService.setPhoto(String(pid), participantPhoto); } catch (e) {}
      try { sessionStorage.setItem(`residentPhoto_${pid}`, participantPhoto); } catch (e) {}
    }

    const residentClone: any = Object.assign({}, r);
    if (residentClone) residentClone.residentPhoto = undefined;

    const navState: any = {
      residentData: residentClone,
      fromSearch: false,
      returnUrl: this.returnUrl
    };

    const queryParams: any = { participantId: String(pid) };

    this.router.navigate(['/training'], { state: navState, queryParams })
      .catch(err => console.error('ClassroomComponent.registerForClasses - navigation error', err));
  }

  goBack() {
    if (this.returnUrl) {
      this.router.navigateByUrl(this.returnUrl, { replaceUrl: false })
        .catch(err => console.error('ClassroomComponent.goBack - navigation error', err));
    } else {
      this.location.back();
    }
  }

  formatField(field: any): string {
    if (field == null) return '';
    if (typeof field === 'object') {
      if ('value' in field) return String(field.value ?? '');
      try { return JSON.stringify(field); } catch (e) { return String(field); }
    }
    return String(field);
  }

  selectClass(classItem: any) {
    this.selectedClass = classItem;
    const navState = {
      classRecord: classItem,
      residentData: this.residentData
    };
    const queryParams: any = { participantId: String(this.participantId) };
    this.router.navigate(['/classroom-detail'], { state: navState, queryParams })
      .catch(err => console.error('ClassroomComponent.selectClass - navigation error', err));
  }

  formatClassDate(field: any): string {
    return this.formatDate(field);
  }

  formatDate(fieldObj: any): string {
    if (!fieldObj) return '';
    const raw = fieldObj.value ?? fieldObj;
    if (!raw) return '';
    const s = String(raw).trim();
    const parts = s.split('-');
    if (parts.length === 3 &&
        parts[0].length === 4 &&
        parts[1].length === 2 &&
        parts[2].length === 2) {
      const y = parts[0];
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      return `${m}/${d}/${y}`;
    }
    return s;
  }

  formatCurriculum(curriculum: any): string {
    if (!curriculum) return '';
    if (curriculum.fileName) return curriculum.fileName;
    if (curriculum.attachment?.fileName) return curriculum.attachment.fileName;
    if (curriculum.attachment?.name) return curriculum.attachment.name;
    return 'Curriculum';
  }
}
