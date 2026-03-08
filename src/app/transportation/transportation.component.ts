import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { QuickbaseService } from 'src/app/services/quickbase.service';
import { UserService } from 'src/app/services/user.service';
import { environment } from 'src/environments/environment';
import { PhotoStorageService } from '../services/photoProcessing.service';


@Component({
  selector: 'HOMMA-transportation',
  templateUrl: './transportation.component.html',
  styleUrls: ['./transportation.component.scss']
})
export class TransportationComponent implements OnInit {
  private transportationTableId = environment.transportationTableID; //bs4mg5z72
  private locationTableId = environment.locationTableID; //bsy8qh6fs
  transportationForm!: FormGroup;
  locations: any[] = [];
  selectedPickupLocation: any;
  selectedDestinationLocation: any;
  participantName: string = '';
  participantPhoto: string | undefined;
  residentPhoto: string | undefined;
  houseLeaderName: string = '';
  houseName: string = '';
  participantId: string = '';
  houseLeaderRecordId: string = ''; // Add this property
  submissionMessage: string = ''; // Add this property to store the submission message
  submissionErrorMessage: string = ''; // Add this property to store the submission error message

  constructor(
    private fb: FormBuilder,
    private location: Location,
    private route: ActivatedRoute,
    private photoStorageService: PhotoStorageService,
    private userService: UserService,
    private quickbaseService: QuickbaseService
  ) {}

  ngOnInit() {
    // console.log('ngOnInit called');
    const userInfo = this.userService.getUserInfo();
    // console.log('User Info:', userInfo);

    this.route.queryParams.subscribe(params => {
      this.participantName = params['participantName'] || '';
      this.houseLeaderName = params['houseLeaderName'] || '';
      this.houseName = params['theHouseName'] || '';
      this.participantId = params['participantId'];
      // Avoid trusting photo data from query params. If not provided, try in-memory cache.
      this.participantPhoto = params['participantPhoto'];
      if ((!this.participantPhoto || this.participantPhoto === 'undefined') && this.participantId) {
        const stored = this.photoStorageService.getPhoto(String(this.participantId));
        if (stored) {
          this.participantPhoto = this.photoStorageService.getSafeSrc(stored, String(this.participantId)) || stored;
        }
      }
      this.houseLeaderRecordId = params['houseLeaderRecordId'] || ''; // Get house leader record ID directly from params
      // this.participantPhoto = this.photoStorageService.getPhoto(this.participantId);
      // console.log('Participant Name:', this.participantName, 'Participant ID:', this.participantId);
      // console.log('House Leader Name:', this.houseLeaderName);
      // console.log('House Leader Record ID:', this.houseLeaderRecordId);
      // console.log('House Name:', this.houseName);
      // console.log('Participant Photo:', this.participantPhoto);

      // console.log('Initialize form after we have all the parameters');
      this.initializeForm();
    });

    // console.log('Calling fetchLocations...');
    this.fetchLocations();
  }

  initializeForm() {
    const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format

    this.transportationForm = this.fb.group({
      purpose: ['', Validators.required],
      dateRequested: [currentDate, Validators.required],
      timeRequested: ['', Validators.required],
      status: [{ value: 'Open', disabled: true }, Validators.required],
      pickupLocation: ['', Validators.required],
      destinationLocation: ['', Validators.required],
      transportationNotes: ['', Validators.required],
      requestedBy: [this.houseLeaderRecordId, Validators.required] // Set to house leader record ID
    });

    // console.log('Form initialized with requestedBy:', this.houseLeaderRecordId);
  }

  getLocalISOString(): string {
    const now = new Date();
    const tzoffset = now.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = new Date(now.getTime() - tzoffset).toISOString().slice(0, -1);
    return localISOTime;
  }

  fetchLocations() {
    // console.log('Fetching locations...');
    const body = {
      from: this.locationTableId,
      select: [3, 7, 9, 6] // Field IDs for id, name, address, type
    };

    // console.log('Request Body:', body);

    this.quickbaseService.callQuickbaseProxy('POST', 'query', body)
      .subscribe({
        next: (response: any) => {
          // console.log('Response:', response);
          if (response.data) {
            this.locations = response.data.map((record: any) => ({
              id: record[3].value,
              name: record[7].value, // Adjust based on your table's field names
              address: record[9].value, // Adjust based on your table's field names
              type: record[6].value // Adjust based on your table's field names
            }));
            // Sort locations by name
            this.locations.sort((a, b) => a.name.localeCompare(b.name));
            // console.log('Mapped and Sorted Locations:', this.locations);
          } else {
            // console.log('No data found in response.');
          }
        },
        error: (error: any) => {
          // console.error('Error fetching locations:', error);
        },
        complete: () => {
          // console.log('fetchLocations completed');
        }
      });
  }

  onPickupLocationChange(event: any) {
    const selectedId = event.detail.value;
    this.selectedPickupLocation = this.locations.find(location => location.id === selectedId);
  }

  onDestinationLocationChange(event: any) {
    const selectedId = event.detail.value;
    this.selectedDestinationLocation = this.locations.find(location => location.id === selectedId);
  }

  onSubmit() {
    // console.log('onSubmit called');
    // console.log('Form valid:', this.transportationForm.valid);
    // console.log('Form value:', this.transportationForm.value);
    // console.log('Form raw value:', this.transportationForm.getRawValue());
    // console.log('House Leader Record ID:', this.houseLeaderRecordId);

    // Check if house leader record ID is available
    if (!this.houseLeaderRecordId) {
      // console.error('House leader record ID not found');
      this.submissionErrorMessage = 'Unable to find house leader record. Please try again or contact support.';
      return;
    }

    if (this.transportationForm.valid) {
      const formData = this.transportationForm.getRawValue();
      // console.log('Form Data:', formData);
      // console.log('Selected Pickup Location:', this.selectedPickupLocation);
      // console.log('Selected Destination Location:', this.selectedDestinationLocation);
      // console.log('House Leader Name:', this.houseLeaderName); // Log houseLeaderName
      // console.log('House Name:', this.houseName); // Log houseName
      // console.log('House Leader Record ID:', this.houseLeaderRecordId); // Log house leader record ID
      // console.log('Requested By from form:', formData.requestedBy); // Log requestedBy field
      // console.log("Date Requested:", formData.dateRequested, "Time Requested:", formData.timeRequested);

    // Ensure dateRequested and timeRequested are valid
    const dateRequested = formData.dateRequested;
    const timeRequested = formData.timeRequested;
    // Extract only the time part from timeRequested
    const timePart = new Date(timeRequested).toTimeString().split(' ')[0];

    // console.log('Date Requested:', dateRequested, 'Time Requested:', timePart);
    if (!dateRequested || !timeRequested) {
      // console.error('Invalid date or time');
      return;
    }

    // Combine date and time into ISO 8601 format
    const dateTimeRequested = new Date(`${dateRequested}T${timeRequested}`).toISOString();

      const payload = {
        to: this.transportationTableId,
        data: [
          {
            31: { value: this.selectedPickupLocation.id },
            35: { value: this.selectedDestinationLocation.id },
            8: { value: formData.purpose }, // Example field ID for purpose
            6: { value: dateTimeRequested }, // Combine date and time
            7: { value: formData.status }, // Example field ID for status
            23: { value: formData.transportationNotes }, // Example field ID for transportation notes
            51: { value: this.houseLeaderName }, // House Leader Name
            50: { value: this.houseName }, // House Name
            9: { value: this.participantId }, // Example field ID for participant ID
            42: { value: parseInt(this.houseLeaderRecordId) || null } // Requested By field - house leader record ID (numeric)
            // Field 52 (Participant Name) removed - field no longer exists in QuickBase table
          }
        ]
      };

      // console.log('Payload:', payload);

      this.quickbaseService.callQuickbaseProxy('POST', 'records', payload).subscribe({
        next: (response: any) => {
          // console.log('Record created:', response);
          const newRecordId = response.metadata?.createdRecordIds?.[0]; // Capture the new recordId from the response metadata
          // console.log('New Record ID:', newRecordId); // Log the new record ID
          this.submissionMessage = `Transportation Request #${newRecordId} submitted. Thank you.`; // Set the submission message
          this.submissionErrorMessage = ''; // Clear the submission error message
          this.resetForm(); // Reset the form after successful submission
        },
            error: (error) => {
          // console.error('Error creating record:', error);
        }
      });
    } else {
      // console.log('Form is invalid');
      this.logInvalidControls();
      this.setSubmissionErrorMessage();
    }
  }

  logInvalidControls() {
    Object.keys(this.transportationForm.controls).forEach(key => {
      const control = this.transportationForm.get(key);
      if (control && control.invalid) {
        // console.log(`Invalid Control: ${key}, Errors:`, control.errors);
      }
    });
  }

  setSubmissionErrorMessage() {
    const invalidFields = Object.keys(this.transportationForm.controls).filter(key => this.transportationForm.controls[key].invalid);
    this.submissionErrorMessage = `Please complete the following fields: ${invalidFields.join(', ')}`;
  }

  resetForm(): void {
    this.transportationForm.reset();
    // this.submissionMessage = '';
    this.submissionErrorMessage = '';
  }

  goBack() {
    this.location.back();
  }
}