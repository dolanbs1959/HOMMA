import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { QuickbaseService } from '../services/quickbase.service';
import { PhotoStorageService } from '../services/photoProcessing.service';

@Component({
  selector: 'app-training',
  templateUrl: './training.component.html',
  styleUrls: ['./training.component.scss']
})
export class TrainingComponent implements OnInit {
  trainingRecords: any[] = [];
  selectedRecord: any = null;
  isLoading = true;
  residentData: any = null;
  participantId: string | null = null;
  errorMessage = '';
  // Track resident image load state so the UI can wait for it
  residentImageLoading = false;
  residentImageLoaded = false;

  constructor(
    private quickbaseService: QuickbaseService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location
    , private photoStorageService: PhotoStorageService
  ) {}

  ngOnInit(): void {
    const nav = this.router.getCurrentNavigation();
    if (nav && nav.extras && nav.extras.state && nav.extras.state['residentData']) {
      this.residentData = nav.extras.state['residentData'];
      // remember participant id from nav state so we can match updates from QuickbaseService
      this.participantId = String(this.residentData?.recordNumber2?.value || this.residentData?.recordNumber || this.participantId || '');
      if (this.residentData?.residentPhoto) {
        this.preloadResidentPhoto(this.residentData.residentPhoto);
      }
    } else {
      // router.getCurrentNavigation() can be null when navigating via history or when component is reused.
      // Fall back to the browser history state (preserves the state object from previous router.navigate calls).
      try {
        const hs: any = (window && (window.history && window.history.state)) ? window.history.state : null;
        if (hs && hs.residentData) {
          this.residentData = hs.residentData;
          this.participantId = String(this.residentData?.recordNumber2?.value || this.residentData?.recordNumber || this.participantId || '');
          if (this.residentData?.residentPhoto) this.preloadResidentPhoto(this.residentData.residentPhoto);
        }
      } catch (e) {
        // ignore history read errors
      }
    }

    this.route.queryParams.subscribe(params => {
      if (Object.keys(params).length) {
        const incomingId = String(params['participantId'] || params['recordNumber2'] || '');
        const incomingPhoto = params['participantPhoto'] || params['residentPhoto'] || null;
        const incomingName = params['participantName'] || params['residentName'] || '';

        // If this is a different participant than currently loaded, replace residentData.
        if (!this.residentData || (incomingId && incomingId !== String(this.participantId))) {
          this.residentData = {
            residentFullName: { value: incomingName },
            residentPhoto: incomingPhoto,
            recordNumber2: { value: incomingId || null }
          };
          this.participantId = incomingId || String(this.residentData?.recordNumber2?.value ?? '');
          // console.debug('Training: queryParams set new residentData', { participantId: this.participantId, incomingPhoto });
        } else {
          // If same participant but new photo passed, update photo
          if (incomingPhoto && this.residentData && incomingId === String(this.participantId)) {
            this.residentData.residentPhoto = incomingPhoto;
            // console.debug('Training: queryParams updated residentPhoto for same participant');
          }
        }

        // Now ensure photo is preloaded if available, otherwise try stored/session fallback
        if (this.residentData?.residentPhoto) {
          this.preloadResidentPhoto(this.residentData.residentPhoto);
        } else if (this.participantId) {
          // try to recover from PhotoStorageService synchronously
          const stored = this.photoStorageService.getPhoto(this.participantId);
          if (stored) {
            this.residentData.residentPhoto = stored;
            this.preloadResidentPhoto(stored);
          } else {
            // fallback: check sessionStorage (written by ResidentDetail when large data URIs exist)
            try {
              const key = `residentPhoto_${this.participantId}`;
              const ss = sessionStorage.getItem(key);
              if (ss) {
                this.residentData.residentPhoto = ss;
                this.preloadResidentPhoto(ss);
                // optional: remove after consuming
                try { sessionStorage.removeItem(key); } catch {}
              }
            } catch (e) {
              // ignore sessionStorage errors
            }
          }
        }
      }
    });

    if (this.quickbaseService && this.quickbaseService.residentData) {
      this.quickbaseService.residentData.subscribe(rd => {
        if (!rd) return;
        // rd can be an array (list) or an object (single resident). Don't blindly overwrite
        if (Array.isArray(rd)) {
          // Try to find the matching resident in the emitted list.
          const found = this.participantId ? rd.find((r: any) => String(r?.recordNumber2?.value || r?.recordNumber || '') === String(this.participantId)) : null;
          // If found and it's different than current residentData, update.
          if (found) {
            const currentId = String(this.residentData?.recordNumber2?.value || this.residentData?.recordNumber || '');
            const foundId = String(found?.recordNumber2?.value || found?.recordNumber || '');
            if (!this.residentData || (foundId && foundId !== currentId)) {
              this.residentData = found;
              // console.debug('Training: quickbase array emission updated residentData from list', { participantId: this.participantId });
            }
          }
        } else {
          // rd is likely a single resident object — replace only if it matches the participantId or we don't have residentData yet
          const incomingId = String(rd?.recordNumber2?.value || rd?.recordNumber || '');
          if (!this.residentData || (this.participantId && incomingId === String(this.participantId))) {
            this.residentData = rd;
          }
        }

        // If residentData now has a photo, preload it. Otherwise try PhotoStorageService/sessionStorage by participantId
        if (this.residentData?.residentPhoto) {
          this.preloadResidentPhoto(this.residentData.residentPhoto);
        } else if (this.participantId) {
          const stored = this.photoStorageService.getPhoto(this.participantId);
          if (stored) {
            if (!this.residentData) this.residentData = {};
            this.residentData.residentPhoto = stored;
            this.preloadResidentPhoto(stored);
          } else {
            try {
              const key = `residentPhoto_${this.participantId}`;
              const ss = sessionStorage.getItem(key);
              if (ss) {
                if (!this.residentData) this.residentData = {};
                this.residentData.residentPhoto = ss;
                this.preloadResidentPhoto(ss);
                try { sessionStorage.removeItem(key); } catch {}
              }
            } catch (e) {}
          }
        }
      });
    }
    // Load records immediately so UI (list and buttons) are available even if photo is still loading
    this.loadTrainingRecords();

  }

  // Preload an image and set loading flags. Resolves when loaded or on timeout/error.
  preloadResidentPhoto(src: string, timeout = 3000) {
    this.residentImageLoading = true;
    this.residentImageLoaded = false;
    try {
      const img = new Image();
      let settled = false;
      const done = (loaded: boolean) => {
        if (settled) return;
        settled = true;
        this.residentImageLoaded = loaded;
        this.residentImageLoading = false;
      };
      img.onload = () => done(true);
      img.onerror = () => done(false);
      img.src = src;
      // If already complete (cached), trigger done
      if ((img.complete && img.naturalWidth !== 0) || (img.complete && img.naturalHeight !== 0)) {
        done(true);
        return;
      }
      // Timeout fallback
      setTimeout(() => done(Boolean(img.complete && (img.naturalWidth !== 0 || img.naturalHeight !== 0))), timeout);
    } catch (e) {
      this.residentImageLoaded = false;
      this.residentImageLoading = false;
    }

    // NOTE: do not trigger loadTrainingRecords from here. records should be loaded in ngOnInit
  }

  loadTrainingRecords() {
    this.isLoading = true;
    this.quickbaseService.getTrainingRecords().subscribe({
      next: (res: any) => {
        this.trainingRecords = (res && res.data) ? res.data : [];
        this.isLoading = false;
      },
      error: err => {
        // console.error('Error loading training records:', err);
        this.errorMessage = 'Unable to load training modules.';
        this.trainingRecords = [];
        this.isLoading = false;
      }
    });
  }

  selectRecord(record: any) {
    this.selectedRecord = record;
    try {
      // console.debug('Training record selected:', JSON.parse(JSON.stringify(record)));
    } catch (e) {
      // console.debug('Training record (raw):', record);
    }
  }

  viewMeetingClass() {
    if (!this.selectedRecord) {
      window.alert('Please select a training module first.');
      return;
    }

    const trainingId = this.selectedRecord?.[3]?.value ?? this.selectedRecord?.[3] ?? this.selectedRecord?.id ?? this.selectedRecord?.[0];
    if (!trainingId && trainingId !== 0) {
      // console.error('No training id found on selected record:', this.selectedRecord);
      window.alert('Selected training record is missing an id.');
      return;
    }

    this.isLoading = true;
    // console.debug('viewMeetingClass called with selectedRecord:', this.selectedRecord);
    this.quickbaseService.getClassesRecords(trainingId).subscribe({
      next: (res: any) => {
        const classes = (res && res.data) ? res.data : [];
        this.isLoading = false;
        this.router.navigate(['/meetingsClasses'], {
          state: {
            classesRecords: classes,
            trainingRecord: this.selectedRecord,
            residentData: this.residentData
          }
        });
      },
      error: err => {
        // console.error('Error loading classes for training:', err);
        this.errorMessage = 'Unable to load classes for the selected training.';
        this.isLoading = false;
      }
    });
  }

  formatField(field: any): string {
    if (field == null) return '';
    if (typeof field === 'object') {
      if ('value' in field) return String(field.value ?? '');
      try { return JSON.stringify(field); } catch (e) { return String(field); }
    }
    return String(field);
  }

  goBack() { this.location.back(); }
  exitApp() { this.router.navigate(['/login']); }
}
