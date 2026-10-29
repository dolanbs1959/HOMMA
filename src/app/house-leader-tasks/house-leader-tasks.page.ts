import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { QuickbaseService } from '../services/quickbase.service';
import { PhotoStorageService } from '../services/photoProcessing.service';

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
    private router: Router,
    private photoStorageService: PhotoStorageService
  ) {}

  ngOnInit() {
    const qd = this.quickbaseService.queryData;
    this.theHouseName = qd?.theHouseName?.value || '';
    this.HouseLeaderName = qd?.HouseLeaderName?.value || '';
    this.HLphone = qd?.HLphone?.value || '';
    this.maxMeetingDate = qd?.maxMeetingDate?.value || '';
    this.Alert = this.quickbaseService.Alert;

    const staSub = this.quickbaseService.STAalert$.subscribe((val: string) => {
      this.STAalert = val || 'There are 0 Staff Task Assignments Due';
    });
    this.subs.push(staSub);

    // Resident records may finish loading after the task list does; enrich
    // 1-on-1 task cards with participant names whenever resident data lands.
    const resSub = this.quickbaseService.residentData.subscribe(() => {
      this.enrichTaskParticipants();
    });
    this.subs.push(resSub);

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
    // The house data may change when a staff member logs in to a different
    // house without restarting the app. Rehydrate the header fields if the
    // selected house has changed, then reload the task list for that house.
    const qd = this.quickbaseService.queryData;
    const newHouseName = qd?.theHouseName?.value || '';
    if (newHouseName && newHouseName !== this.theHouseName) {
      this.theHouseName = newHouseName;
      this.HouseLeaderName = qd?.HouseLeaderName?.value || '';
      this.HLphone = qd?.HLphone?.value || '';
      this.Alert = this.quickbaseService.Alert || '';
      this.quickbaseService.getMaxMeetingDate(this.theHouseName).subscribe({
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
    }
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
              priority: this.quickbaseService.normalizeFieldToString(taskRecord[15]),
              status: taskRecord[326]?.value || taskRecord[326] || this.quickbaseService.normalizeFieldToString(taskRecord[22]),
              role: taskRecord[32]?.value || taskRecord[32],
              houseName: this.quickbaseService.normalizeFieldToString(taskRecord[36]) || this.theHouseName,
              frequency: taskRecord[47]?.value || taskRecord[47],
              p1on1sDue: taskRecord[263]?.value || taskRecord[263],
              participantRecordId: taskRecord[313]?.value || taskRecord[313] || null,
              resident: null,
              participantName: '',
              dueDate: this.parseQbDate(taskRecord[325])
            };
          } catch (e) {
            return taskRecord;
          }
        });
        this.enrichTaskParticipants();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading house leader tasks', error);
        this.isLoading = false;
      }
    });
    this.subs.push(tasksSub);
  }

  isReviewTask(task: any): boolean {
    return !!(task && (task.taskName || '').includes('Reviews'));
  }

  // Quickbase date fields arrive as 'YYYY-MM-DD' (or occasionally 'MM-DD-YYYY').
  // Parse them as a local date so the `date` pipe doesn't shift the day due to
  // UTC-midnight interpretation.
  private parseQbDate(value: any): any {
    const s = typeof value === 'string' ? value : (value && typeof value === 'object' ? value.value : value);
    if (typeof s === 'string') {
      let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
      if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
      m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(s);
      if (m) return new Date(+m[3], +m[1] - 1, +m[2]);
    }
    return s;
  }

  // Attach the matching resident record (from the already-cached residentData)
  // to each task that carries a Related Participant (FID 313) so the card can
  // show the participant's name and navigate to their 1-on-1 review form.
  private enrichTaskParticipants() {
    try {
      const raw = this.quickbaseService.residentData.value;
      const residents = Array.isArray(raw) ? raw : (raw?.data || []);
      if (!Array.isArray(residents) || !residents.length || !this.tasks.length) return;
      this.tasks.forEach((t: any) => {
        if (!t || t.resident || !t.participantRecordId) return;
        const pid = String(t.participantRecordId);
        const match = residents.find((r: any) => {
          const id = (r.recordNumber2 && (r.recordNumber2.value ?? r.recordNumber2)) ||
                     (r.residentIDnumber && (r.residentIDnumber.value ?? r.residentIDnumber)) ||
                     r.recordNumber || r.id || '';
          return String(id) === pid;
        });
        if (match) {
          t.resident = match;
          t.participantName = (match.residentFullName && (match.residentFullName.value || match.residentFullName)) || match.residentName || match.name || 'Unknown participant';
        }
      });
    } catch (e) {}
  }

  // Mirrors ParticipantsPage.addParticipantOneOnOne(): opens the existing
  // 1-on-1 review form for this task's participant and carries the Task
  // Assignment record ID so the submitted review can later be linked back to
  // it (Participant 1-on-1s FID 274).
  openParticipantReview(task: any) {
    const r = task?.resident;
    if (!r) return;
    const participantName = (r.residentFullName && (r.residentFullName.value || r.residentFullName)) || r.residentName || r.name || 'Unknown Participant';
    const residentPhoto = r.residentPhoto || null;
    const ccoFirstName = r.residentCCOfirst?.value || '';
    const ccoLastName = r.residentCCOlast?.value || '';
    const ccoFullName = ccoFirstName && ccoLastName ? `${ccoFirstName} ${ccoLastName}` : ccoFirstName || ccoLastName || 'CCO not listed';
    const ccoPhoneNumber = r.residentCCOphone?.value || 'No Phone Number';
    const ccoMobile = r.residentCCOmobile?.value || 'No Mobile Number';
    const ccoEmail = r.residentCCOemail?.value || r.residentCCOEmail?.value || 'No CCO Email';
    const workStatus = r.WorkStatus?.value || 'Unknown Work Status';
    const docStatus = r.residentDOCstatus?.value || '';
    const participantEmail = r.residentEmail?.value || 'No Email';
    const participantPhone = r.residentPhone?.value || 'No Phone';
    const participantId = r.recordNumber2?.value || r.recordNumber || task.participantRecordId || 'No ID';
    const Last1on1Date = r.Last1on1Date?.value || 'No Date';

    try {
      if (residentPhoto && participantId) {
        try { this.photoStorageService.setPhoto(String(participantId), residentPhoto); } catch (e) {}
        try { sessionStorage.setItem(`residentPhoto_${participantId}`, residentPhoto); } catch (e) {}
      }
    } catch (e) {}

    const queryParams: any = {
      ccoFullName,
      ccoPhoneNumber,
      ccoMobile,
      ccoEmail,
      docStatus,
      participantId,
      participantName,
      participantEmail,
      participantPhone,
      workStatus,
      Last1on1Date,
      theHouseName: this.theHouseName,
      houseLeaderName: this.HouseLeaderName,
      taskAssignmentId: task.id
    };

    this.router.navigate(['/participant-reviews'], { queryParams, state: { residentData: r, fromSearch: false } }).catch(err => console.error('HouseLeaderTasksPage.openParticipantReview - navigation error', err));
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
