import { Component, OnInit, OnDestroy } from '@angular/core';
import { QuickbaseService } from '../services/quickbase.service';
import { LoggerService } from '../services/logger.service';
import { ActivatedRoute, Router } from '@angular/router'; // Import ActivatedRoute
import { Location } from '@angular/common';

@Component({
  selector: 'HOMMA-staff-tasks',
  templateUrl: './staff-tasks.component.html',
  styleUrls: ['./staff-tasks.component.scss'],
})
export class StaffTasksComponent  implements OnInit, OnDestroy {
  HouseLeaderName: string = '';
  theHouseName: string = '';
  HLphone: string = '';
  residentData: any;
  residentPhoto: string = '';
  residentFullName: string = '';
  weeklyHouseMeeting: string = '';
  maxMeetingDate: string = '';
  tasks: any[] = [];
  private _subs: any[] = [];

  constructor(
    public quickbaseService: QuickbaseService, 
    private route: ActivatedRoute,
    private location: Location, 
    private router: Router,
    private logger: LoggerService) {
      this.quickbaseService.residentData.subscribe(data => {
        this.residentData = data;
      });

    }

  addWeeklyHouseMeeting() {
    const currentDate = new Date();
    const maxMeetingDate = new Date(this.maxMeetingDate);
    const diffInDays = Math.ceil((currentDate.getTime() - maxMeetingDate.getTime()) / (1000 * 60 * 60 * 24))-1;
    // console.log("Diff in days:", diffInDays);

        if (diffInDays < 7) {
          const confirm = window.confirm(`Your last meeting was just ${diffInDays} day(s) ago - click OK if you're sure you want to add a new Weekly House Meeting?`);
          if (!confirm) {
            return;
          }
        }

    this.router.navigate(['/weeklyhousemeeting'], { state: { theHouseName: this.theHouseName, HouseLeaderName: this.HouseLeaderName, HLphone: this.HLphone, maxMeetingDate: this.maxMeetingDate } });
  }

  goBack() {
//    this.router.navigate(['/home']);
    this.location.back();
  }

  ngOnInit() {


    // keep residentData as the resolved array from the service subscription
    this.residentData = [];

    const navigation = this.router.getCurrentNavigation();

    if (navigation && navigation.extras.state) {
      // console.log("State from router:", navigation.extras.state);
      const state = navigation.extras.state as { 
        tasks: any[], 
        theHouseName: string, 
        HouseLeaderName: string, 
        HLphone: string, 
        maxMeetingDate: string 
      };

      this.tasks = state.tasks;
      this.theHouseName = state.theHouseName;
      this.HouseLeaderName = state.HouseLeaderName;
      this.HLphone = state.HLphone;
      this.maxMeetingDate = state.maxMeetingDate;
    }

    // Always try to fetch the latest max meeting date for the house currently being viewed
    if (this.theHouseName) {
      this.quickbaseService.getMaxMeetingDate(this.theHouseName).subscribe(response => {
        try {
          const entry = response?.data?.[0];
          const raw = entry?.['40'];
          const value = raw?.value ?? raw;
          this.maxMeetingDate = value || this.maxMeetingDate;
          this.quickbaseService.maxMeetingDate = this.maxMeetingDate;
          this.logger?.log?.('StaffTasks - refreshed maxMeetingDate for house', this.theHouseName, this.maxMeetingDate);
        } catch (e) {
          // ignore and keep existing value
        }
      }, error => {
        // ignore
      });
    }

    // Subscribe to service cache so the page updates if tasks refresh in background
    const sub = this.quickbaseService.staffTasks.subscribe((raw: any) => {
      try {
        // If router provided a transformed tasks array, keep it unless service provides fresh data
        if (!raw) {
          return;
        }

        // Normalize shapes: accept either an object with `.data` or an array
        const dataArr = Array.isArray(raw) ? raw : (raw.data && Array.isArray(raw.data) ? raw.data : []);
        if (!dataArr || dataArr.length === 0) {
          // If the router state previously provided tasks, do not wipe them out unless service explicitly has empty array
          if (this.tasks && this.tasks.length > 0) return;
        }

        // Transform Quickbase record shape into friendly task objects
        const mapped = dataArr.map((taskRecord: any) => {
          // If already transformed (has id/taskName), pass through
          if (taskRecord && (taskRecord.id || taskRecord.taskName)) return taskRecord;
          try {
            return {
              id: taskRecord[3]?.value || taskRecord[3],
              taskName: taskRecord[8]?.value || taskRecord[8],
              priority: taskRecord[15]?.value || taskRecord[15],
              status: taskRecord[22]?.value || taskRecord[22],
              role: taskRecord[32]?.value || taskRecord[32],
              houseName: taskRecord[36]?.value || taskRecord[36],
              frequency: taskRecord[47]?.value || taskRecord[47],
              p1on1sDue: taskRecord[263]?.value || taskRecord[263]
            };
          } catch (e) {
            return taskRecord;
          }
        });

        this.tasks = mapped;
      } catch (e) {
        this.logger.warn('staff-tasks - failed to update tasks from service', e);
      }
    });
    this._subs.push(sub);
  }

  ngOnDestroy() {
    try {
      this._subs.forEach(s => s && s.unsubscribe && s.unsubscribe());
    } catch (e) {}
  }

}