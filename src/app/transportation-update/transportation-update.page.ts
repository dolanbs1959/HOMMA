import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { QuickbaseService } from '../services/quickbase.service';

@Component({
  selector: 'app-transportation-update',
  templateUrl: './transportation-update.page.html',
  styleUrls: ['./transportation-update.page.scss']
})
export class TransportationUpdatePage implements OnInit {
  record: any = null;
  resident: any = null;
  residentName: string = '';
  residentId: string = '';
  theHouseName: string = '';
  houseLeaderName: string = '';
  houseLeaderRecordId: string = '';
  updateForm!: FormGroup;
  isSaving = false;
  submissionMessage: string = '';
  submissionErrorMessage: string = '';
  locations: any[] = [];
  selectedPickupLocation: any;
  selectedDestinationLocation: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private fb: FormBuilder,
    private quickbaseService: QuickbaseService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras && navigation.extras.state) {
      this.record = navigation.extras.state['record'];
      this.resident = navigation.extras.state['residentData'];
      this.theHouseName = navigation.extras.state['theHouseName'] || this.resident?.houseName?.value || this.resident?.houseName || this.theHouseName;
      this.houseLeaderName = navigation.extras.state['houseLeaderName'] || this.houseLeaderName;
      this.houseLeaderRecordId = navigation.extras.state['houseLeaderRecordId'] || this.houseLeaderRecordId;
    }

    this.route.queryParams.subscribe(params => {
      this.residentName = this.resident?.residentFullName?.value || this.resident?.residentFullName || this.resident?.residentName || this.resident?.name || params['participantName'] || '';
      this.residentId = this.resident?.recordNumber2?.value || this.resident?.recordNumber2 || this.resident?.recordNumber || this.resident?.recordId || this.resident?.id || params['participantId'] || '';
      this.theHouseName = this.theHouseName || params['theHouseName'] || this.resident?.houseName?.value || this.resident?.houseName || '';
      this.houseLeaderName = this.houseLeaderName || params['houseLeaderName'] || '';
      this.houseLeaderRecordId = this.houseLeaderRecordId || params['houseLeaderRecordId'] || '';

      const recordId = params['recordId'] || this.record?.id;
      if (!this.record && recordId) {
        this.loadRecord(recordId);
      } else {
        this.fetchLocations();
      }
    });
  }

  private loadRecord(recordId: any) {
    this.quickbaseService.getTransportationRecordsForResident(this.residentId).subscribe({
      next: (response: any) => {
        this.record = (response?.data || []).find((r: any) => String(r.id) === String(recordId));
        this.fetchLocations();
      },
      error: (err: any) => {
        console.error('Failed to load transportation record', err);
      }
    });
  }

  fetchLocations() {
    this.quickbaseService.getLocations().subscribe({
      next: (response: any[]) => {
        this.locations = Array.isArray(response) ? response : [];
        this.locations.sort((a, b) => a.name.localeCompare(b.name));
        this.buildForm();
      },
      error: (error: any) => {
        console.error('Error fetching locations', error);
      }
    });
  }

  private buildForm() {
    const { date, time } = this.formatDateTime(this.record?.dateRequested);

    this.updateForm = this.fb.group({
      purpose: [this.record?.purpose || '', Validators.required],
      dateRequested: [date, Validators.required],
      timeRequested: [time, Validators.required],
      status: [this.record?.status || '', Validators.required],
      pickupLocation: [this.record?.pickupId, Validators.required],
      destinationLocation: [this.record?.destinationId, Validators.required],
      transportationNotes: [this.record?.notes || '', Validators.required],
      startTime: [this.formatTime(this.record?.startTime), []],
      endTime: [this.formatTime(this.record?.endTime), []],
      beginningMileage: [this.record?.beginningMileage ?? '', []],
      endingMileage: [this.record?.endingMileage ?? '', []]
    });

    this.selectedPickupLocation = this.locations.find(l => l.id === this.record?.pickupId || l.id == this.record?.pickupId);
    this.selectedDestinationLocation = this.locations.find(l => l.id === this.record?.destinationId || l.id == this.record?.destinationId);
  }

  private formatDateTime(value: any): { date: string; time: string } {
    if (!value) { return { date: '', time: '' }; }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) { return { date: '', time: '' }; }

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return {
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}`
    };
  }

  private formatTime(value: any): string {
    if (!value && value !== 0) { return ''; }
    const v = String(value);
    const match = v.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
    if (!match) { return ''; }
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = match[4] ? match[4].toUpperCase() : '';
    if (ampm) {
      if (ampm === 'PM' && hours !== 12) { hours += 12; }
      if (ampm === 'AM' && hours === 12) { hours = 0; }
    }
    const h = hours < 10 ? `0${hours}` : `${hours}`;
    return `${h}:${minutes}`;
  }

  onPickupLocationChange(event: any) {
    const selectedId = event?.detail?.value;
    this.selectedPickupLocation = this.locations.find(l => l.id === selectedId || l.id == selectedId);
  }

  onDestinationLocationChange(event: any) {
    const selectedId = event?.detail?.value;
    this.selectedDestinationLocation = this.locations.find(l => l.id === selectedId || l.id == selectedId);
  }

  get travelTimeDisplay(): string {
    const start = this.updateForm?.get('startTime')?.value;
    const end = this.updateForm?.get('endTime')?.value;
    const duration = this.calculateDuration(start, end);
    return duration ? `${duration.hours} hrs ${duration.minutes} mins` : '';
  }

  get distanceDisplay(): string {
    const begin = this.updateForm?.get('beginningMileage')?.value;
    const end = this.updateForm?.get('endingMileage')?.value;
    const distance = this.calculateDistance(begin, end);
    return distance !== null ? `${distance} miles` : '';
  }

  onSubmit() {
    if (this.isSaving || !this.record) { return; }

    this.submissionMessage = '';
    this.submissionErrorMessage = '';

    if (this.updateForm.invalid) {
      this.updateForm.markAllAsTouched();
      this.setSubmissionErrorMessage();
      return;
    }

    this.isSaving = true;
    const formData = this.updateForm.getRawValue();

    const dateTimeRequested = new Date(`${formData.dateRequested}T${formData.timeRequested}`).toISOString();

    const data: any = {
      8: { value: formData.purpose },
      6: { value: dateTimeRequested },
      7: { value: formData.status },
      31: { value: formData.pickupLocation },
      35: { value: formData.destinationLocation },
      23: { value: formData.transportationNotes }
    };

    if (formData.startTime) { data[62] = { value: `${formData.startTime}:00` }; }
    if (formData.endTime) { data[63] = { value: `${formData.endTime}:00` }; }
    if (formData.beginningMileage !== '' && formData.beginningMileage !== null && formData.beginningMileage !== undefined) {
      data[64] = { value: Number(formData.beginningMileage) };
    }
    if (formData.endingMileage !== '' && formData.endingMileage !== null && formData.endingMileage !== undefined) {
      data[65] = { value: Number(formData.endingMileage) };
    }

    this.quickbaseService.updateTransportationRecord(this.record.id, data).subscribe({
      next: async (response: any) => {
        this.isSaving = false;
        await this.showUpdateConfirmation(response, formData);
      },
      error: (err: any) => {
        this.isSaving = false;
        this.submissionErrorMessage = 'Failed to update transportation record. Please try again.';
        console.error('Failed to update transportation record', err);
      }
    });
  }

  private setSubmissionErrorMessage() {
    const invalidFields = Object.keys(this.updateForm.controls).filter(key => this.updateForm.controls[key].invalid);
    const friendly: { [key: string]: string } = {
      purpose: 'Purpose',
      dateRequested: 'Date Requested',
      timeRequested: 'Time Requested',
      status: 'Status',
      pickupLocation: 'Pick-up Location',
      destinationLocation: 'Destination Location',
      transportationNotes: 'Transportation Notes'
    };
    const labels = invalidFields.map(f => friendly[f] || f);
    this.submissionErrorMessage = `Please complete the following fields: ${labels.join(', ')}`;
  }

  private getSavedValue(response: any, fid: number, fallback: any): any {
    const record = response?.data?.[0] ?? {};
    const field = record[fid] ?? record[String(fid)];
    if (field === null || field === undefined) { return fallback; }
    if (typeof field === 'object' && 'value' in field) { return field.value; }
    return field;
  }

  private parseTimeOfDay(value: any): number | null {
    if (!value && value !== 0) { return null; }
    const v = String(value);
    const match = v.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
    if (!match) { return null; }
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[4] ? match[4].toUpperCase() : '';
    if (ampm) {
      if (ampm === 'PM' && hours !== 12) { hours += 12; }
      if (ampm === 'AM' && hours === 12) { hours = 0; }
    }
    return (hours * 60) + minutes;
  }

  private calculateDuration(startTime: any, endTime: any): { hours: number; minutes: number } | null {
    const startMinutes = this.parseTimeOfDay(startTime);
    const endMinutes = this.parseTimeOfDay(endTime);
    if (startMinutes === null || endMinutes === null) { return null; }
    let durationMinutes = endMinutes - startMinutes;
    if (durationMinutes < 0) { durationMinutes += 24 * 60; }
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    return { hours, minutes };
  }

  private calculateDistance(beginning: any, ending: any): number | null {
    const begin = Number(beginning);
    const end = Number(ending);
    if ((beginning === '' || beginning === null || beginning === undefined) ||
        (ending === '' || ending === null || ending === undefined) ||
        Number.isNaN(begin) || Number.isNaN(end)) {
      return null;
    }
    const distance = end - begin;
    return distance < 0 ? 0 : distance;
  }

  private async showUpdateConfirmation(response: any, formData: any) {
    const startTime = this.getSavedValue(response, 62, formData.startTime);
    const endTime = this.getSavedValue(response, 63, formData.endTime);
    const beginningMileage = this.getSavedValue(response, 64, formData.beginningMileage);
    const endingMileage = this.getSavedValue(response, 65, formData.endingMileage);

    const duration = this.calculateDuration(startTime, endTime);
    const distance = this.calculateDistance(beginningMileage, endingMileage);

    const durationText = duration ? `${duration.hours} hrs ${duration.minutes} mins` : '—';
    const distanceText = distance !== null ? `${distance} miles` : '—';
    const message = `Transportation updated successfully.\nTravel duration: ${durationText}\nDistance logged: ${distanceText}`;

    const alert = await this.alertController.create({
      header: 'Success',
      message,
      cssClass: 'transportation-update-alert',
      backdropDismiss: false,
      buttons: [
        {
          text: 'OK',
          handler: () => {
            this.goBack();
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  goBack() {
    this.location.back();
  }
}
