import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router'; // Import ActivatedRoute
import { QuickbaseService } from '../services/quickbase.service';
import { ReactiveFormsModule } from '@angular/forms';
import { Subscription, Observable, forkJoin, of } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';
import { Location } from '@angular/common';
import { FormGroup, FormControl, FormBuilder, FormArray } from '@angular/forms';
import { LoggerService } from '../services/logger.service';


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
    private logger: LoggerService,
    ) {
      // console.log('WeeklyMeetingsPage constructor called');

    // residentData subscription moved to ngOnInit to initialize the form consistently

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
    // Validate that every resident has an attendance marked before creating activity
    if (!this.residentData || !Array.isArray(this.residentData) || this.residentData.length === 0) {
      this.message = 'No residents found to submit.';
      return;
    }
    const unmarked = this.residentData.filter((r: any) => !r.AttendanceStatus || r.AttendanceStatus === '');
    if (unmarked.length > 0) {
      const names = unmarked.map((r: any) => r.residentFullName?.value ?? r.residentFullName ?? r.name ?? 'Unknown').join(', ');
      this.message = `Please mark attendance for: ${names}`;
      return;
    }

    this.isLoading = true;
    const TaskRecordId = this.quickbaseService.TaskRecordId; // Get TaskRecordId directly from the service
    const newActivityData = this.formGroup.value;

    const activityBody = {
      6: { value: newActivityData.ActivityDesc }, // Activity Description
      89: { value: new Date().toISOString().split('T')[0] }, // Current Date
      43: { value: TaskRecordId }
    };

    this.quickbaseService.insertActivity(activityBody).subscribe(response => {
      this.logger.log('Activity inserted successfully', response);
      this.activityId = response; // Store the new record ID in the activityId variable
      this.logger.log('New activityId set', this.activityId, 'activityBody', activityBody);
      this.message = 'Weekly meeting submitted successfully.';
      this.quickbaseService.isActivityAddedOnce = true;
      this.isActivityAdded = false;
      // After creating the activity, create all attendance records in a single batch call.
      this.isLoading = true;
      try {
        const records = (this.residentData || []).map((resident: any, index: number) => {
          const participantId = resident.recordNumber2?.value ?? resident.recordNumber2;
          const attendanceStatus = resident.AttendanceStatus ?? null;
          const commentsControl = this.residentForm.get('residents')?.get(index.toString())?.get('Comments');
          const comments = commentsControl?.value ?? null;
          return {
            9: { value: participantId },
            38: { value: this.activityId },
            11: { value: attendanceStatus },
            7: { value: comments }
          };
        }).filter((r: any) => r[9] && r[38]);

        if (records.length === 0) {
          this.logger.warn('No attendance records to create in batch');
          this.isLoading = false;
          this.router.navigate(['/home', { theHouseName: this.theHouseName, HouseLeaderName: this.HouseLeaderName, HLphone: this.HLphone, maxMeetingDate: this.quickbaseService.maxMeetingDate }]);
        } else {
          this.quickbaseService.createAttendanceRecordsBulk(records).subscribe(resp => {
            this.logger.log('Batch attendance records created', resp);
            this.attendanceUpdated = true;
            this.isLoading = false;
            this.router.navigate(['/home', { theHouseName: this.theHouseName, HouseLeaderName: this.HouseLeaderName, HLphone: this.HLphone, maxMeetingDate: this.quickbaseService.maxMeetingDate }]);
          }, err => {
            this.logger.error('Batch create failed', err);
            this.isLoading = false;
            this.router.navigate(['/home', { theHouseName: this.theHouseName, HouseLeaderName: this.HouseLeaderName, HLphone: this.HLphone, maxMeetingDate: this.quickbaseService.maxMeetingDate }]);
          });
        }
      } catch (e) {
        this.logger.error('Unexpected error preparing batch attendance records', e);
        this.isLoading = false;
        this.router.navigate(['/home', { theHouseName: this.theHouseName, HouseLeaderName: this.HouseLeaderName, HLphone: this.HLphone, maxMeetingDate: this.quickbaseService.maxMeetingDate }]);
      }
    }, error => {
      this.message = 'Error submitting weekly meeting. Please try again.';
      this.logger.error('Error inserting activity', error);
      this.isLoading = false;
    });
  }

updateAttendanceRecords(newActivityId?: any): Observable<any> {
  if (!this.residentData || !Array.isArray(this.residentData) || this.residentData.length === 0) {
    this.logger.warn('updateAttendanceRecords called but residentData is empty or invalid', this.residentData);
    this.message = 'No residents available to update.';
    return of([]);
  }

  const activityId = newActivityId ?? this.activityId;
  if (!activityId) {
    this.logger.error('No activityId available to update attendance records');
    this.message = 'Unable to update attendance: missing activity id.';
    return of([]);
  }

  const updates: Observable<any>[] = this.residentData.map((resident: any, index: number) => {
    const participantId = resident.recordNumber2?.value ?? resident.recordNumber2;
    if (!participantId) {
      this.logger.warn('Skipping resident without participantId', resident);
      return of(null);
    }
    const commentsControl = this.residentForm.get('residents')?.get(index.toString())?.get('Comments');

    return this.quickbaseService.getAttendance(participantId, activityId).pipe(
      map((response: any) => {
        const raw = response?.data?.[0]?.['3'];
        const attendanceIdValue = raw?.value ?? raw;
        return attendanceIdValue;
      }),
      mergeMap((attendanceIdValue: any) => {
        if (!attendanceIdValue) {
          this.logger.warn('No attendance record found to update for participant', participantId);
          return of(null);
        }
        const body = {
          11: { value: resident.AttendanceStatus ?? null },
          7: { value: commentsControl?.value ?? null }
        };
        this.logger.debug('Updating attendance record', { attendanceIdValue, body });
        return this.quickbaseService.updateAttendance(attendanceIdValue, body).pipe(
          catchError(err => {
            this.logger.error('updateAttendance error', err);
            return of(null);
          })
        );
      }),
      catchError(err => {
        this.logger.error('getAttendance error', err);
        return of(null);
      })
    );
  });

  this.attendanceUpdated = true;
  const validUpdates = updates.filter(u => !!u) as Observable<any>[];
  if (validUpdates.length === 0) return of([]);
  return forkJoin(validUpdates);
}

// Polling removed — batch create approach used instead.

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
      this.residentData = data;
      try {
        const len = Array.isArray(data) ? data.length : (data ? 1 : 0);
        console.log('WeeklyMeetingsPage - residentData received, length:', len);
        if (Array.isArray(data) && data.length > 0) console.log('WeeklyMeetingsPage - first resident sample:', data[0]);
      } catch (e) {
        console.warn('WeeklyMeetingsPage - error inspecting residentData', e);
      }
      if (data && Array.isArray(data)) {
        this.residentForm = this.formBuilder.group({
          residents: this.formBuilder.array(
            data.map((resident: any) => this.formBuilder.group({
              recordNumber2: [resident.recordNumber2],
              residentFullName: [resident.residentFullName],
              residentPhoto: [resident.residentPhoto],
              Room: [resident.Room],
              Bed: [resident.Bed],
              ParticipantStatus: [resident.ParticipantStatus],
              AttendanceStatus: [''],
              Comments: ['']
            }))
          )
        });
      } else {
        // Ensure we have an empty form array when no data
        this.residentForm = this.formBuilder.group({ residents: this.formBuilder.array([]) });
      }
    });
  }
 
ngOnDestroy() {
    if (this.residentDataSubscription) {
      this.residentDataSubscription.unsubscribe();
    }
}
}
