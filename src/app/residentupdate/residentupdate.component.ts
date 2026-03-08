import { Component, OnInit, NgModule } from '@angular/core';
import { NgForm, FormGroup, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { Location, CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { QuickbaseService } from '../services/quickbase.service';
import { PhotoStorageService } from 'src/app/services/photoProcessing.service';

@Component({
  selector: 'HOMMA-residentupdate',
  templateUrl: './residentupdate.component.html',
  styleUrls: ['./residentupdate.component.scss'],
})
export class ResidentUpdateComponent {
currentDate: string = new Date().toISOString().split('T')[0];
residentData: any;
NewResidentUpdateId: number = 0;
reportForm: FormGroup;
dropdownChoices: any;
showRipple = false;
pendingArrival: any;
residentPhoto: string = 'assets/default-pic/defaultPhoto.png'; // Initialize with default photo
residentName: string = '';
recordNumber2: any;

  constructor(
  private router: Router, 
  private route: ActivatedRoute,
  private location: Location,
  private quickbaseService: QuickbaseService, 
  private formBuilder: FormBuilder,
  private photoStorageService: PhotoStorageService

){
  this.reportForm = this.formBuilder.group({
    RUStatus: [''],
    OccupancyStatus: [''],
    MoveDate: [this.currentDate],
    NewRoom: [''],
    NewBed: [''],
    Notes: [''],
    
  });
  const occupancyStatusControl = this.reportForm.get('OccupancyStatus');
  if (occupancyStatusControl) {
    occupancyStatusControl.valueChanges.subscribe((value) => {
      if (value && !value.toLowerCase().includes('move')) {
        const moveDateControl = this.reportForm.get('MoveDate');
        if (moveDateControl) {
          moveDateControl.setValue(null);
        }
      }
    });
  }
 }

// addResidentUpdate(form: NgForm) {
//    this.router.navigate(['/resident-update']);
//   // if (form.valid) {
//   //   this.quickbaseService.updateResident(form.value).subscribe(() => {
//   //     this.goBack();
//   //   });
//   // }
// }

insertNewResidentUpdate () {
  // // console.log('Pending arrival record ID:', this.pendingArrival.recordNumber2.value);
  // const recordNumber2Value = this.pendingArrival ? this.pendingArrival.recordNumber2.value : this.residentData.recordNumber2.value;
  let recordNumber2Value;

  if (this.pendingArrival && this.pendingArrival.recordNumber2) {
    recordNumber2Value = this.pendingArrival.recordNumber2;
  } else if (this.residentData && this.residentData.recordNumber2) {
    recordNumber2Value = this.residentData.recordNumber2.value;
  } else {
    // console.error('Error: recordNumber2 is undefined', this.pendingArrival.recordNumber2, this.residentData.recordNumber2);
    return;
  }

  const body = {
    15: { value: recordNumber2Value },
//    35: { value: this.reportForm.value.RUStatus },
    23: { value: this.reportForm.value.OccupancyStatus },
    50: { value: this.reportForm.value.MoveDate },
    33: { value: this.reportForm.value.NewRoom },
    34: { value: this.reportForm.value.NewBed },
    24: { value: this.reportForm.value.Notes },
};


this.quickbaseService.residentupdate(body).subscribe((response: any) => {
  // console.log('Resident Update response:', response);
  if (response && response.data && response.data[0] && response.data[0][3]) {
    this.NewResidentUpdateId = response.data[0][3].value;
    // console.log('New Resident Update recorID:', this.NewResidentUpdateId);
  } else {
    // console.error('Unexpected response structure:', response);
  }
}, (error: any) => {
  // console.error('Error inserting record', error);
});

}

resetForm() {
  this.reportForm.reset();
  this.NewResidentUpdateId = 0
}
  goBack() {
    this.location.back();
  }
  
  ngOnInit(): void {
    try {
      this.route.queryParams.subscribe(params => {
        // console.log('All params:', params);
        this.recordNumber2 = params['recordNumber2'];
        if (this.recordNumber2 && typeof this.recordNumber2 === 'object' && ('value' in this.recordNumber2)) {
          this.recordNumber2 = this.recordNumber2.value;
        }
        this.residentPhoto = params['residentPhoto'] || 'assets/default-pic/defaultPhoto.png';
        this.residentName = params['residentName'] || '';
        // If photo not passed in params, try in-memory cache or sessionStorage
        if ((!this.residentPhoto || this.residentPhoto === 'assets/default-pic/defaultPhoto.png' || this.residentPhoto === 'undefined') && this.recordNumber2) {
          const cached = this.photoStorageService.getPhoto(String(this.recordNumber2));
          if (cached) {
            this.residentPhoto = this.photoStorageService.getSafeSrc(cached, String(this.recordNumber2)) || cached;
          } else {
            try {
              const ss = sessionStorage.getItem(`residentPhoto_${this.recordNumber2}`);
              if (ss) this.residentPhoto = this.photoStorageService.getSafeSrc(ss, String(this.recordNumber2)) || ss;
            } catch (e) {}
          }
        }
        // this.theHouseName = params['theHouseName'];
        // this.houseLeaderName = params['houseLeaderName'];
  
        // console.log('Record Number2:', this.recordNumber2);
        // console.log('Resident Photo:', this.residentPhoto);
        // console.log('Resident Name:', this.residentName);
        // // console.log('House Name:', this.theHouseName);
        // // console.log('House Leader Name:', this.houseLeaderName);
  
        if (this.recordNumber2) {
          this.pendingArrival = {
            recordNumber2: this.recordNumber2,
            residentPhoto: this.residentPhoto,
            residentFullName: this.residentName
          };
          // console.log('Pending Arrival Data:', this.pendingArrival);
          // console.log('recordNumber2 type:', typeof this.pendingArrival.recordNumber2);
        }
      });
  
  // Check for navigation extras (for resident detail updates)
  const navigation = this.router.getCurrentNavigation();
  if (navigation && navigation.extras && navigation.extras.state) {
    const state = navigation.extras.state as {residentData: any};
    if (state.residentData) {
      this.residentData = state.residentData;
      // console.log('Resident Update Data:', this.residentData);
      this.recordNumber2 = this.residentData.recordNumber2;
      if (this.recordNumber2 && typeof this.recordNumber2 === 'object' && ('value' in this.recordNumber2)) {
        this.recordNumber2 = this.recordNumber2.value;
      }
      this.residentPhoto = this.residentData.residentPhoto || 'assets/default-pic/defaultPhoto.png';
      this.residentName = this.residentData.residentFullName || '';
      // If residentPhoto not present in state, try cache/session
      if ((!this.residentPhoto || this.residentPhoto === 'assets/default-pic/defaultPhoto.png' || this.residentPhoto === 'undefined') && this.recordNumber2) {
        const cached2 = this.photoStorageService.getPhoto(String(this.recordNumber2));
        if (cached2) {
          this.residentPhoto = this.photoStorageService.getSafeSrc(cached2, String(this.recordNumber2)) || cached2;
        } else {
          try {
            const s2 = sessionStorage.getItem(`residentPhoto_${this.recordNumber2}`);
            if (s2) this.residentPhoto = this.photoStorageService.getSafeSrc(s2, String(this.recordNumber2)) || s2;
          } catch (e) {}
        }
      }
      // console.log('Record Number2:', this.recordNumber2);
      // console.log('Resident Photo:', this.residentPhoto);
      // console.log('Resident Name:', this.residentName);
    }
  }

  // If we still don't have a recordNumber2, log an error
  if (!this.recordNumber2) {
    // console.error('No recordNumber2 available from either query params or navigation state.');
  }
  
    } catch (error) {
      // console.error('Error in ngOnInit:', error);
    }
  }
  

}
