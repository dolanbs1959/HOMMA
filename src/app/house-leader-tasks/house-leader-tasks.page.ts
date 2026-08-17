import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { QuickbaseService } from '../services/quickbase.service';

@Component({
  selector: 'app-house-leader-tasks',
  templateUrl: './house-leader-tasks.page.html',
  styleUrls: ['./house-leader-tasks.page.scss'],
})
export class HouseLeaderTasksPage implements OnInit, OnDestroy {
  theHouseName = '';
  HouseLeaderName = '';
  HLphone = '';
  maxMeetingDate = '';
  tasks: any[] = [];
  isLoading = false;
  STAalert = '';
  Alert = '';

  private subs: any[] = [];

  constructor(
    public quickbaseService: QuickbaseService,
    private router: Router
  ) {}

  ngOnInit() {
    const qd = this.quickbaseService.queryData;
    this.theHouseName = qd?.theHouseName?.value || '';
    this.HouseLeaderName = qd?.HouseLeaderName?.value || '';
    this.HLphone = qd?.HLphone?.value || '';
    this.maxMeetingDate = qd?.maxMeetingDate?.value || '';
    this.Alert = this.quickbaseService.Alert;

    const staSub = this.quickbaseService.STAalert$.subscribe((val: string) => {
      this.STAalert = val || 'There are 0 Staff Task Assignments Overdue';
    });
    this.subs.push(staSub);

    if (this.theHouseName) {
      const maxMeetingSub = this.quickbaseService.getMaxMeetingDate(this.theHouseName).subscribe({
        next: (response: any) => {
          try {
            const entry = response?.data?.[0];
            const raw = entry?.['40'];
            const value = raw?.value ?? raw;
            this.maxMeetingDate = value || this.maxMeetingDate;
            this.quickbaseService.maxMeetingDate = this.maxMeetingDate;
          } catch (e) {}
        },
        error: () => {}
      });
      this.subs.push(maxMeetingSub);
    }

    this.loadTasks();
  }

  ngOnDestroy() {
    this.subs.forEach(s => s && s.unsubscribe && s.unsubscribe());
  }

  ionViewWillEnter() {
    this.loadTasks();
  }

  loadTasks() {
    this.isLoading = true;
    const tasksSub = this.quickbaseService.getStaffTasks().subscribe({
      next: (raw: any) => {
        const dataArr = Array.isArray(raw) ? raw : (raw?.data && Array.isArray(raw.data) ? raw.data : []);
        this.tasks = dataArr.map((taskRecord: any) => {
          if (taskRecord && (taskRecord.id || taskRecord.taskName)) {
            return taskRecord;
          }
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
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading house leader tasks', error);
        this.isLoading = false;
      }
    });
    this.subs.push(tasksSub);
  }

  addWeeklyHouseMeeting() {
    if (!this.maxMeetingDate) {
      this.router.navigate(['/weeklyhousemeeting'], {
        state: {
          theHouseName: this.theHouseName,
          HouseLeaderName: this.HouseLeaderName,
          HLphone: this.HLphone,
          maxMeetingDate: this.maxMeetingDate
        }
      });
      return;
    }

    const currentDate = new Date();
    const lastMeetingDate = new Date(this.maxMeetingDate);
    const diffInDays = Math.ceil((currentDate.getTime() - lastMeetingDate.getTime()) / (1000 * 60 * 60 * 24)) - 1;

    if (diffInDays < 7) {
      const confirmed = window.confirm(`Your last meeting was just ${diffInDays} day(s) ago - click OK if you're sure you want to add a new Weekly House Meeting?`);
      if (!confirmed) {
        return;
      }
    }

    this.router.navigate(['/weeklyhousemeeting'], {
      state: {
        theHouseName: this.theHouseName,
        HouseLeaderName: this.HouseLeaderName,
        HLphone: this.HLphone,
        maxMeetingDate: this.maxMeetingDate
      }
    });
  }
}
