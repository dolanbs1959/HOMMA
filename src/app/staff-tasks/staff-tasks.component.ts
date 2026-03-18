import { Component, OnInit } from '@angular/core';
import { QuickbaseService } from '../services/quickbase.service';
import { LoggerService } from '../services/logger.service';
import { ActivatedRoute, Router } from '@angular/router'; // Import ActivatedRoute
import { Location } from '@angular/common';

@Component({
  selector: 'HOMMA-staff-tasks',
  templateUrl: './staff-tasks.component.html',
  styleUrls: ['./staff-tasks.component.scss'],
})
export class StaffTasksComponent  implements OnInit {
  HouseLeaderName: string = '';
  theHouseName: string = '';
  HLphone: string = '';
  residentData: any;
  residentPhoto: string = '';
  residentFullName: string = '';
  weeklyHouseMeeting: string = '';
  maxMeetingDate: string = '';
  tasks: any[] = [];

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


    this.residentData = this.quickbaseService.residentData;

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
  }

}