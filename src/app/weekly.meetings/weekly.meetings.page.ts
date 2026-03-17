import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router'; // Import ActivatedRoute
import { QuickbaseService } from '../services/quickbase.service';
import { ReactiveFormsModule } from '@angular/forms';
import { Subscription, map, mergeMap } from 'rxjs';
import { Location } from '@angular/common';
import { FormGroup, FormControl, FormBuilder, FormArray } from '@angular/forms';


@Component({
  selector: 'HOMMA-weekly.meetings',
  templateUrl: './weekly.meetings.page.html',
  styleUrls: ['./weekly.meetings.page.scss'],
})

export class WeeklyMeetingsPage implements OnInit {
  HouseLeaderName: string = '';
  theHouseName: string = '';
  HLphone: string = '';
  residentData: any;
  residentFullName: string = '';
  AttendanceStatus: string = '';
  attendanceUpdated = false;
  formGroup: FormGroup;
  residentForm: FormGroup;
  isActivityAdded = false;
  allResidentsSelected = false;
  isLoading = false;
  isActivityAddedOnce = false;
  activityId: number = 0;
  public message: string = '';

  private residentDataSubscription!: Subscription;

  get residentsArray() {
    return this.residentForm.get('residents') as FormArray;
  }

  constructor(
    public quickbaseService: QuickbaseService, 
    private route: ActivatedRoute, 
    private router: Router, 
    private location: Location,
    private formBuilder: FormBuilder,
    ) {
      // console.log('WeeklyMeetingsPage constructor called');

    this.quickbaseService.residentData.subscribe(data => {
      // console.log('Resident data received:', data);
      this.residentData = data;
    });

    this.formGroup = new FormGroup({
      Comments: new FormControl(''),
      ActivityDesc: new FormControl(''),
      // add other form controls if needed
    });
      // Initialize residentForm here
  this.residentForm = this.formBuilder.group({
    residents: this.formBuilder.array([])
  });
    
  const navigation = this.router.getCurrentNavigation();
  const state = navigation?.extras.state as {theHouseName: string, HouseLeaderName: string, HLphone: string};

  if (state) {
    // console.log('State from router:', state);
    this.theHouseName = state.theHouseName;
    this.HouseLeaderName = state.HouseLeaderName;
    this.HLphone = state.HLphone;
  } else {
    // console.warn('No state found in router navigation');
  }

}

addWeeklyHouseMeeting() {
  this.isLoading = true;
  const TaskRecordId = this.quickbaseService.TaskRecordId; // Get TaskRecordId directly from the service
// console.log('Task Record ID:', TaskRecordId);
  const newActivityData = this.formGroup.value; // Get the new data from the form
  // console.log('New Activity Data', newActivityData);
    
  const activityBody = {
    6: { value: newActivityData.ActivityDesc }, // Activity Description
    89: { value: new Date().toISOString().split('T')[0] }, // Current Date
    43: { value: TaskRecordId }
    // Add other fields if needed
  };
  // console.log('Activity Body', activityBody);

  this.quickbaseService.insertActivity(activityBody).subscribe(response => {
      // console.log('Activity inserted successfully', response);
    this.activityId = response; // Store the new record ID in the activityId variable
      // console.log('New activity ID:', this.activityId);
    this.isActivityAdded = true;
      // console.log('Added?', this.isActivityAdded);
    this.quickbaseService.isActivityAddedOnce = true;
      // console.log('Added Once?', this.quickbaseService.isActivityAddedOnce);
    }, error => {
      // console.error('Error inserting activity:', error);
  });

  this.isLoading = false;
}

updateAttendanceRecords(newActivityId?: any) {
     // Check if any residents are skipped
  const skippedResidents = this.residentData.filter((resident: any) => !resident.AttendanceStatus);
      if (skippedResidents.length > 0) {
        // Show a message to the user
        this.message = 'Please select an attendance status for all participants.';
        return;
  }
  // All residents have an AttendanceStatus, so set allResidentsSelected to true
  this.allResidentsSelected = true;

  // Loop through the residents and update an attendance record for each one
  this.residentData.forEach((resident: any, index: number) => {
        // console.log('Resident:', resident);
        // console.log('AttendanceStatus:', resident.AttendanceStatus);
        const commentsControl = this.residentForm.get('residents')?.get(index.toString())?.get('Comments');
        // console.log('Comments:', commentsControl?.value);

    const participantId = resident.recordNumber2.value; // related participant
    const activityId = newActivityId; // related Activity

    // Fetch the attendance record
    if (this.activityId) {
    this.quickbaseService.getAttendance(participantId, this.activityId).pipe(
      map((response: any) => {
        const attendanceId = response.data[0]?.['3']; // Assuming the attendanceId is in the '3' field of the first record in the data array
        // console.log('Attendance record ID:', attendanceId);
          return attendanceId;
      }),  
      mergeMap(attendanceId => {
// console.log('mergeMap check for attendanceID:', attendanceId);
        const attendanceIdValue = attendanceId.value;
        const body = {
          11: { value: resident.AttendanceStatus ? resident.AttendanceStatus : null }, // Attendance Status
          7: { value: commentsControl?.value ? commentsControl?.value : null } // Attendance Comments
        };
        // console.log('updated Attendance record with Body', activityId, attendanceIdValue, body);
        // Update the attendance record
        return this.quickbaseService.updateAttendance(attendanceIdValue, body);
      })
    ).subscribe(response => {
      // console.log('Attendance record updated successfully for resident', participantId, ':', response);
    }, error => {
      // console.error('Error updating attendance record for resident', participantId, ':', error);
    });
} else {
  // console.log('Activity ID is not set');
}

  });
  this.attendanceUpdated = true;
  
}

  // resetForm() {
  //   this.reportForm.reset();
  //   this.weeklyHouseMeetingRecordId = 0
  //  }
    
  goBack() {
    this.location.back();
  }

  ngOnInit() {
    this.quickbaseService.isActivityAddedOnce = false;
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as {theHouseName: string, HouseLeaderName: string, HLphone: string};
  
    if (state) {
      this.theHouseName = state.theHouseName;
      this.HouseLeaderName = state.HouseLeaderName;
      this.HLphone = state.HLphone;
    }
    this.residentDataSubscription = this.quickbaseService.residentData.subscribe(data => {
      if (data && Array.isArray(data)) {
        this.residentForm = this.formBuilder.group({
          residents: this.formBuilder.array(
            data.map((resident: any) => this.formBuilder.group({
              ...resident,
              AttendanceStatus: '',
              Comments: ['']
            }))
          )
        });
      }
    });
  }
 
ngOnDestroy() {
    if (this.residentDataSubscription) {
      this.residentDataSubscription.unsubscribe();
    }
}
}
