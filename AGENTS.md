# HOMMA Project Notes

## Backend migration (in progress, 2026-10)

The Quickbase backend is undergoing a workflow change: task assignments are no longer
static — a new task assignment record is generated each period when a task becomes due.
The app is being updated to match.

### Table name changes
- Activity table `bjh35ky8s` is now called **"Attendance Updates"**
- StaffTasks table `bs88dwtsr` (task assignments)
- Attendance table `bqbn92usp`

### New task-assignment field schema (StaffTasks table)
- Field 88 = related staff record (replaces 34)
- Field 32 = role ('House Leader')
- Fields 37, 41, 40 = 'Active' flags (unchanged)
- Field 326 = Task Status ('Incomplete' / 'Complete')
- Field 318 = Related Task Rule (weekly house meeting task = **4**)
- Field 22 CT 'Activity Over-Due' and staff field 247 (`TaskRecordId`) are deprecated

### Implemented: weekly meetings submit flow
1. `getWeeklyMeetingTaskAssignment()` queries StaffTasks:
   `{88.EX.<staffRecordID>} AND {32.EX.'House Leader'} AND {37.EX.'Active'} AND
   {41.EX.'Active'} AND {40.EX.'Active'} AND {326.EX.'Incomplete'} AND {318.EX.4}`,
   select [3] → taskRid (zero results → submission is blocked)
2. `submitWeeklyHouseMeeting()` inserts Attendance Updates record:
   `{6: desc, 89: current date, 43: taskRid}`
3. Bulk-create attendance records (fields 9/38/11/7, unchanged)
4. `markTaskAssignmentComplete(taskRid)` sets `{326: 'Complete', 381: current date}` —
   unconditional (submitting = complete, even with unexcused absences)
5. `clearStaffTasksCache()` clears BehaviorSubject + HOMMA__STAFFTASKS sessionStorage
   so the tasks list refreshes on return

### getStaffTasks now returns "all incomplete tasks"
Where clause: `{88.EX.<staffRecordID>} AND {32.EX.'House Leader'} AND {37/41/40.EX.'Active'}
AND {326.EX.'Incomplete'}`. Select: [3, 326, 32, 8, 36, 47, 15, 263].
- STAalert text now "N Staff Task Assignments Due"
- Status display mapped to field 326 in both task pages
- `TaskRecordId` (staff field 247) removed from login query and staffRecordID fallback
- Task house name (field 36) is `{value: null}` on new records — page falls back to
  session `theHouseName`. A debug log in getStaffTasks dumps the first raw task record
  to help identify the correct house-name FID later.

### Implemented: 1-on-1 task cards display participant
- `getStaffTasks()` also selects FID 313 (Related Participant → resident record ID)
- House Leader Tasks page maps `participantRecordId` (FID 313) and enriches cards
  from the cached `residentData` BehaviorSubject (`enrichTaskParticipants()`)
- Review tasks (taskName contains 'Reviews') show `Participant: <name>` instead of
  the legacy FID 263 `1 on 1's Due` counter; unresolved participants show
  "Unknown participant" (non-clickable)
- Tapping the name navigates to `/participant-reviews` using the same
  queryParams/state shape as `ParticipantsPage.addParticipantOneOnOne()`, plus
  `taskAssignmentId` = Task Assignment record ID (FID 3)
- `participant-reviews.component.ts` stores `taskAssignmentId` from queryParams
- 1-on-1 cards are simplified: Participant (clickable), Status, Due Date only
  (Role/House/Frequency removed for Reviews tasks; other task types unchanged).
  Due Date = StaffTasks FID 325, parsed as a local date (`parseQbDate`) to avoid
  the YYYY-MM-DD UTC-midnight off-by-one, rendered via `| date:'MMM d, y'`
- On successful review create: `recordData[274] = taskAssignmentId` (FID 147
  preserved), then `markTaskAssignmentComplete(taskAssignmentId)` →
  `clearStaffTasksCache()` → `getStaffTasks()` refresh (updates list + STAalert
  count). Completion is guarded by `taskCompletionAttempted` (once per page
  instance); a completion failure shows a warning appended to the success alert,
  never a review failure. Independent submissions (no taskAssignmentId) are
  unaffected. Quickbase pipeline creates the Activity — HOMMA does not.
- `goBack()` (Back/Start Over) uses explicit `router.navigate(['/tabs','participants'])`
  (with `navigateByUrl` fallback) whenever the review was task-launched
  (`taskAssignmentId` set) — never `location.back()`, which walks history to login.
  Independent reviews keep `location.back()`.
- 1-on-1 shortcuts are hidden for House Leader sessions via the centralized
  `quickbaseService.isHouseLeaderSession` getter, which reads `sessionStaffRole`
  (the finalRecord's field-93 role — i.e., the record the session operates as)
  falling back to `currentStaffRole` (the typed credential's role). The
  distinction matters for area managers, whose credential role is 'Staff' but
  whose session record is the house's House Leader record. `sessionStaffRole`
  is persisted to localStorage at login, restored in the constructor, and
  cleared on new staff logins + resident logins.
- `participant-reviews` header pipes `last1on1Date` only when
  `hasValidLast1on1Date` is true — guards DatePipe against 'No Date'/null
  (NG02100); displays 'No previous 1-on-1'.

### Still open
- Correct FID for task house-name display (36 is unpopulated in new schema)
- `status-overdue` CSS class keys on `.includes('Due')` — 'Incomplete' won't trigger it
- Retry path `updateAttendanceRecords` observable is never subscribed (pre-existing dead code)

### Deferred (same migration, later sessions)
- Observation reports
- Resident updates
- Transport requests
