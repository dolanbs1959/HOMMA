import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { QuickbaseService } from '../services/quickbase.service';
import { MatDialog } from '@angular/material/dialog';
import { SelectPhotoDialogComponent } from '../select-photo-dialog/select-photo-dialog.component';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { environment } from 'src/environments/environment';
import { Platform } from '@ionic/angular';
import { PhotoStorageService } from '../services/photoProcessing.service';

declare var cordova: any;
declare global {
  interface Window { plugins: any; }
}
@Component({
  selector: 'HOMMA-observationreport',
  templateUrl: './observationreport.component.html',
  styleUrls: ['./observationreport.component.scss'],
})

export class ObservationReportComponent  implements OnInit {
  @Input() photo!: string;
  @Output() photoCaptured = new EventEmitter<string>();
  private apiKey = environment.apiKey;
  residentData: any;
//  dropdownChoices: any;
  reportForm: FormGroup;
  NewObservationRecordId: number = 0;
  showRipple = false;
  capturedPhoto: string = '';
  savedPhotoPath: string = '';  
  photoDataUrl: string = '';
  isLoading = false;
  submissionMessage: string = '';
  options: string[] = [];
  dropdownChoices: string[] = [];
  residentPhoto: string | undefined;

constructor(
  private router: Router, 
  private location: Location,
  private quickbaseService: QuickbaseService,
  private formBuilder: FormBuilder,  
  public dialog: MatDialog,
  private photoStorageService: PhotoStorageService
  
) {
  this.reportForm = this.formBuilder.group({
    observationType: ['', Validators.required],
    observationTone: ['', Validators.required],
    observationClass: ['', Validators.required],
    observationDescription: ['', Validators.required],
    DepartureDateTime: [''],
    ReturnDateTime: [''],
    LocationAddress: [''],
    County: [''],
    EmergencyContactName: [''],
    EmergencyContactPhone: [''],
    ccoApproved: [''],
    sotpApproved: [''],
    safetyPlan: [''],
    attendMeeting: [''],
    ReasonForRequest: [''],
    
  });
  
}

  

async savePhoto(): Promise<{ filepath: string; webviewPath: string } | null> {
  try {
    if (!this.capturedPhoto) {
      // console.error('No photo to save');
      return Promise.resolve(null);
    }

    const base64Data = this.capturedPhoto.split(',')[1];
    const fileName = new Date().getTime() + '.jpeg';

    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data
    });

    //this.savedPhotoPath = savedFile.uri;
    this.savedPhotoPath = fileName;
    // console.log('Saved Photo Path:', this.savedPhotoPath);
    // console.log('Saved Photo:', fileName);

    return {
      filepath: fileName,
      webviewPath: this.capturedPhoto
    };
  } catch (err) {
    // console.error('Failed to save photo to filesystem', err);
    return Promise.reject(err);
  }
}

onObservationTypeChange(type: any): void {
  this.showRipple = type.name === 'Dirty UA';
}

openSelectPhotoDialog(): void {
  const dialogRef = this.dialog.open(SelectPhotoDialogComponent, {
    width: '400px',
    height: '600px'
  });
  
  dialogRef.componentInstance.photoCaptured.subscribe((photo: string) => {
    this.capturedPhoto = photo;
    // Save the captured photo to the filesystem
    this.savePhoto();
    dialogRef.close();
  });
}




addObservationReport() {
  this.router.navigate(['/home/observation-report']); 
}


async insertObservationReport() {
    if (this.isLoading) return; // prevent duplicate submissions
function addField(fields: { [key: number]: { value: any } }, fieldId: number, value: any) {
  if (value === undefined || value === "") {
    fields[fieldId] = { value: null };
  } else {
    fields[fieldId] = { value: value };
  }
}

  this.isLoading = true;
  this.submissionMessage = '';
const body: { [key: number]: { value: any } } = {
    194: { value: this.residentData.recordNumber2.value },
    7: { value: this.reportForm.value.observationType },//this.reportForm.value.observationType,
    51: { value: this.reportForm.value.observationTone },//this.reportForm.value.observationTone
    94: { value: this.reportForm.value.observationClass },//this.reportForm.value.observationClass
    8: { value: this.reportForm.value.observationDescription },
    //Overnight request fields
    119: { value: this.reportForm.value.DepartureDateTime },
    120: { value: this.reportForm.value.ReturnDateTime },
    121: { value: this.reportForm.value.LocationAddress },
    131: { value: this.reportForm.value.County },
    122: { value: this.reportForm.value.EmergencyContactName },
    123: { value: this.reportForm.value.EmergencyContactPhone },
    124: { value: this.reportForm.value.ccoApproved },
    125: { value: this.reportForm.value.sotpApproved },
    126: { value: this.reportForm.value.safetyPlan },
    127: { value: this.reportForm.value.ReasonForRequest },
    128: { value: this.reportForm.value.attendMeeting },
};

if (this.capturedPhoto) {
      body[59] = {
       value: {
         'fileName': 'dirtyUA.png', // Include the filename
         'data': this.capturedPhoto.split(',')[1] // Remove the data URL scheme
          }
        };
      }
// console.log('Observation Report Body:', body);

this.quickbaseService.observationreport(body).subscribe(async (response: any) => {
  // console.log('Observation Report inserted successfully', response);
  this.NewObservationRecordId = response.data[0][3].value;
  // console.log('New Observation Record ID:', this.NewObservationRecordId);
  this.isLoading = false;
  this.submissionMessage = `Observation Report saved (Record #${this.NewObservationRecordId}).`;

}, (error: any) => {
  // console.error('Error inserting record', error);
    this.isLoading = false;
    this.submissionMessage = 'Error saving observation; please try again.';
});}


resetForm() {
  this.reportForm.reset();
  this.NewObservationRecordId = 0
    this.capturedPhoto = '';
    this.savedPhotoPath = '';
    this.photoDataUrl = '';
    // no file input on this page; popup handles uploads
}

  goBack() {
    this.location.back();
  }

  ngOnInit(): void {
    const observationTypeControl = this.reportForm.get('observationType');
    if (observationTypeControl) {
      observationTypeControl.valueChanges.subscribe(type => {
        this.onObservationTypeChange(type);
      });
      this.fetchDropdownChoices();
    }
  }

    fetchDropdownChoices() {
      this.quickbaseService.getDropdownChoices().subscribe({
        next: (response: any) => {
          // console.log('Observation table Response:', response); // Log the entire response
          if (response && Array.isArray(response)) {
            const field7 = response.find((field: any) => field.id === 7);
            if (field7 && field7.properties && field7.properties.choices) {
              this.dropdownChoices = field7.properties.choices;
              // console.log('Options for field 7:', this.dropdownChoices); // Log the options array
            } else {
              // console.log('Field 7 not found or has no choices.');
            }
          } else {
            // console.log('No fields found in response.');
          }
        },
        error: (error: any) => {
          // console.error('Error fetching field properties:', error);
        },
        complete: () => {
          // console.log('fetchDropdownChoices completed');
        }
      });

    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras.state) {
      this.residentData = navigation.extras.state['residentData'];
      // console.log('Resident Data:', this.residentData);
      if (this.residentData) {
        const id = this.residentData.recordNumber2?.value || this.residentData.recordNumber || this.residentData.id || '';
        let cached: string | undefined;
        if (id) {
          cached = this.photoStorageService.getPhoto(String(id));
          if (!cached) {
            try { cached = sessionStorage.getItem(`residentPhoto_${id}`) || undefined; } catch (e) { cached = undefined; }
          }
        }
        if (cached) {
          this.residentPhoto = this.photoStorageService.getSafeSrc(cached, String(id)) || cached;
          // ensure template binding that references residentData.residentPhoto will work
          try { if (this.residentData) this.residentData.residentPhoto = this.residentPhoto; } catch (e) {}
        } else {
          // if residentData already has residentPhoto (short URL), normalize it for template
          try {
            if (this.residentData && this.residentData.residentPhoto) {
              this.residentData.residentPhoto = this.photoStorageService.getSafeSrc(this.residentData.residentPhoto, String(id)) || this.residentData.residentPhoto;
            }
          } catch (e) {}
        }
      }
    }
  }
}
