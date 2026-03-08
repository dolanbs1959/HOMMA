import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { QuickbaseService } from '../services/quickbase.service';

@Component({
  selector: 'app-registrations',
  templateUrl: './registrations.component.html',
  styleUrls: ['./registrations.component.scss']
})
export class RegistrationsComponent implements OnInit {
  // loading/ready state: don't render main content until essential data available
  ready = false;
  // safety timeout (ms) to avoid hanging forever if async data never arrives
  private readonly READY_TIMEOUT = 3000;
  classRecord: any = null;
  trainingRecord: any = null;
  residentData: any = null;
  transportationRequested: string = 'No';
  registering = false;
  registrationResponse: any = null;
  // Template-facing convenience properties (used by external template)
  participantName: string = '';
  participantPhoto: string | undefined;
  className: string = '';
  classDescription: string = '';
  classDate: string | null = null;
  registeredCount: number | null = null;
  confirmationMessage: string | null = null;
  isRegistered = false;

  constructor(
    private router: Router,
    private location: Location,
    private qb: QuickbaseService
  ) {}

  ngOnInit(): void {
    // Read navigation state passed from MeetingsClassesComponent or history state
    this.refreshFromState();

    // console.debug('Registrations init', { classRecord: this.classRecord, residentData: this.residentData });

    // Populate template convenience props if data present
    if (this.classRecord) {
      // Field mappings: class name often at index 45, description at 47, date at 7, registered count at 62
      this.className = this.formatField(this.classRecord[45]) || this.getField(this.classRecord, 45) || this.getField(this.classRecord, 7) || '';
      this.classDescription = this.formatField(this.classRecord[47]) || this.getField(this.classRecord, 47) || '';
      const dateObj = this.classRecord[7] || this.getFieldObj(this.classRecord, 7);
      this.classDate = dateObj ? (dateObj.value ?? dateObj) : null;
      const rc = this.classRecord[62] || this.getField(this.classRecord, 62);
      // registeredCount may be an object with .value
      this.registeredCount = typeof rc === 'object' && rc !== null ? (rc.value ?? null) : rc;
    }
    if (this.residentData) {
      this.participantName = this.residentData?.residentFullName?.value || this.residentData?.residentName || this.getField(this.residentData, 6) || '';
      this.participantPhoto = this.residentData?.residentPhoto || undefined;
    }

    // determine readiness: wait until we have at least participantName and either className or classRecord
    this.checkReadyState();
  }

  private refreshFromState() {
    const nav = this.router.getCurrentNavigation();
    if (nav && nav.extras && nav.extras.state) {
      const s = nav.extras.state as any;
      this.classRecord = s.classRecord || null;
      this.trainingRecord = s.trainingRecord || null;
      this.residentData = s.residentData || null;
    } else if (history && history.state) {
      const s = history.state as any;
      this.classRecord = s.classRecord || null;
      this.trainingRecord = s.trainingRecord || null;
      this.residentData = s.residentData || null;
    }
    // repopulate template convenience props
    if (this.classRecord) {
      this.className = this.formatField(this.classRecord[45]) || this.getField(this.classRecord, 45) || this.getField(this.classRecord, 7) || '';
      this.classDescription = this.formatField(this.classRecord[47]) || this.getField(this.classRecord, 47) || '';
      const dateObj = this.classRecord[7] || this.getFieldObj(this.classRecord, 7);
      this.classDate = dateObj ? (dateObj.value ?? dateObj) : null;
    }
    if (this.residentData) {
      this.participantName = this.residentData?.residentFullName?.value || this.residentData?.residentName || this.getField(this.residentData, 6) || '';
      this.participantPhoto = this.residentData?.residentPhoto || undefined;
    }
  }

  private checkReadyState() {
    const start = Date.now();
    const tryResolve = () => {
      const hasPhotoOrName = !!(this.participantPhoto || this.participantName);
      const hasClass = !!(this.classRecord || this.className);
      if (hasPhotoOrName && hasClass) {
        this.ready = true;
        return;
      }
      if (Date.now() - start > this.READY_TIMEOUT) {
        // timeout reached: render anyway to avoid blocking UI
        this.ready = true;
        // console.warn('Registrations: ready timeout reached, rendering with available data');
        return;
      }
      // otherwise, poll briefly until conditions met
      setTimeout(tryResolve, 100);
    };
    tryResolve();
  }

  getField(obj: any, fid: any): any {
    if (!obj) return '';
    // obj may be Quickbase record shape or a plain object
    const field = obj[fid];
    if (!field && field !== 0) return '';
    // If field is a Quickbase-like object with .value, format that
    if (field && typeof field === 'object' && field.value !== undefined) {
      return this.formatField(field.value);
    }
    // Otherwise, try to format the field itself
    return this.formatField(field);
  }

  getFieldObj(obj: any, fid: any): any {
    if (!obj) return null;
    return (obj && (obj[fid])) || null;
  }

  formatDate(fieldObj: any): string {
    if (!fieldObj) return '';
    const raw = fieldObj.value ?? fieldObj;
    if (!raw) return '';
    const s = String(raw);
    const isoDateOnly = /^\d{4}-\d{2}-\d{2}$/;
    if (isoDateOnly.test(s)) {
      const [y, m, d] = s.split('-').map(n => parseInt(n, 10));
      return new Date(y, m - 1, d).toLocaleDateString();
    }
    const dt = new Date(s);
    return isNaN(dt.getTime()) ? s : dt.toLocaleDateString();
  }

  getResidentId(): string {
    // Try a list of common shapes that Quickbase/resident producers may use.
    // Prefer explicit recordNumber2/recordNumber fields, then fall back to id/recordId or ['3'].
    if (!this.residentData) return '';
    const candidates = [
      this.residentData?.recordNumber2?.value,
      this.residentData?.recordNumber?.value,
      this.residentData?.recordNumber2,
      this.residentData?.recordNumber,
      this.residentData?.recordId,
      this.residentData?.id,
      this.residentData?.['3']?.value,
      this.residentData?.['3'],
      this.residentData?.residentIDnumber
    ];
    for (const c of candidates) {
      if (c !== undefined && c !== null && String(c) !== '') return String(c);
    }
    return '';
  }

  formatField(fieldObj: any): string {
    if (fieldObj === null || fieldObj === undefined) return '';

    // If Quickbase-like shape { value: ... }
    if (typeof fieldObj === 'object') {
      if (fieldObj.value !== undefined && (typeof fieldObj.value === 'string' || typeof fieldObj.value === 'number' || typeof fieldObj.value === 'boolean')) {
        return String(fieldObj.value);
      }

      // try common nested keys (string or primitive)
      const commonKeys = ['value', 'text', 'label'];
      for (const k of commonKeys) {
        if (fieldObj[k] !== undefined && (typeof fieldObj[k] === 'string' || typeof fieldObj[k] === 'number' || typeof fieldObj[k] === 'boolean')) {
          return String(fieldObj[k]);
        }
      }

      // Recursively search for the first string/primitive inside nested objects/arrays
      const seen = new WeakSet();
      function findFirstPrimitive(obj: any, depth = 0): string | null {
        if (obj === null || obj === undefined) return null;
        if (depth > 8) return null; // avoid too deep recursion
        if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
        if (typeof obj === 'object') {
          if (seen.has(obj)) return null;
          seen.add(obj);
          if (Array.isArray(obj)) {
            for (const item of obj) {
              const v = findFirstPrimitive(item, depth + 1);
              if (v !== null) return v;
            }
          } else {
            for (const key of Object.keys(obj)) {
              try {
                const v = findFirstPrimitive(obj[key], depth + 1);
                if (v !== null) return v;
              } catch {
                // ignore access errors
              }
            }
          }
        }
        return null;
      }

      const primitive = findFirstPrimitive(fieldObj, 0);
      if (primitive !== null) return primitive;

      // Fallback to JSON string as last resort; if JSON stringify fails (circular),
      // return empty string so template can apply a friendly fallback like 'N/A'.
      try {
        return JSON.stringify(fieldObj);
      } catch {
        return '';
      }
    }

    return String(fieldObj);
  }

  register() {
    if (!this.classRecord) {
      window.alert('No class selected');
      return;
    }
    // Support multiple shapes: Quickbase record may present id as field 3, as an id property, or as index 0/3
    const classId = this.classRecord?.['3']?.value
      || this.classRecord?.[3]?.value
      || this.classRecord?.[3]
      || this.classRecord?.[0]
      || this.classRecord?.id
      || null;
    const participantId = this.getResidentId();
    if (!classId || !participantId) {
      window.alert('Missing class id or participant id');
      // console.debug('Missing ids', { classId, participantId, classRecord: this.classRecord, residentData: this.residentData });
      return;
    }

    this.registering = true;
    this.qb.registerParticipant(String(classId), String(participantId), this.transportationRequested)
      .subscribe({
        next: res => {
          this.registrationResponse = res;
          this.registering = false;
          // Show confirmation in-app (don't use browser alert)
          this.isRegistered = true;
          // Try to extract created registration id if available
          let regId = null;
          try { regId = res?.data?.[0]?.['3']?.value ?? res?.data?.[0]?.id ?? null; } catch {}
          this.confirmationMessage = regId ? `Registration successful. Record#: ${regId}` : 'Registration successful.';
          // If transportation was requested, create a transport request record
          if (String(this.transportationRequested).toLowerCase() === 'yes') {
            try {
              const transportPayload: any = {
                // Example mapping: adjust field IDs as needed for your Quickbase Transportation table
                7: { value: 'Open' },
                // fid 6 should be an ISO date string
                // 6: { value: new Date().toISOString() },
                9: { value: participantId },
                8: { value: 'Class' },
                // Make the class name portion bold in the stored note (HTML tags included)
                23: { value: `Auto-created from registration for class <strong>${this.className}</strong>` }
              };
              this.qb.insertTransportationRequest(transportPayload).subscribe({
                next: tRes => {
                  // console.debug('Transport request created', tRes);
                  // attempt to extract transport record id
                  try {
                    const tId = tRes?.data?.[0]?.['3']?.value ?? tRes?.data?.[0]?.id ?? null;
                    if (tId) {
                      // Append transport message on a new line below the registration confirmation
                      this.confirmationMessage += `\nTransport Record#: ${tId}`;
                    }
                  } catch (e) { /* ignore */ }
                },
                error: tErr => {
                  // console.error('Transport request failed', tErr);
                  this.confirmationMessage += '\nTransport request failed. See console.';
                }
              });
            } catch (e) {
              // console.error('Error while creating transport request payload', e);
            }
          }
        },
        error: err => {
          // console.error('Register error', err);
          this.registrationResponse = { error: err };
          this.registering = false;
          window.alert('Registration failed. See console.');
        }
      });
  }

  confirmRegistration() {
    // alias for register() to support current template naming
    this.register();
  }

  exitApp() {
    // navigate back to login (same as goBack for now)
    this.router.navigate(['/home']);
  }

  goBack() {
    this.location.back();
  }
}
