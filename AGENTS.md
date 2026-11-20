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
- 1-on-1 shortcuts are hidden for House Leader-only sessions via the centralized
  `quickbaseService.isHouseLeaderSession` getter: `sessionIsHouseLeader` (Staff
  FID 71 = 1 on the finalRecord — the record the session operates as) AND NOT
  `isStaffSession`. Staff who log in as (or also are) a House Leader keep all
  house-side functions. `sessionIsHouseLeader` is persisted to localStorage at
  login, restored in the constructor, and cleared via `clearStaffRoleState()`
  on new staff logins + resident logins.
- `quickbaseService.currentStaffName` mirrors that pattern for the typed
  credential's name (staff field 304 of the requesting-user record) — differs
  from the session's `HouseLeaderName` for area managers. It drives the HOM
  Staff signature name on the Stipulated Agreement so an area manager's
  signature isn't attributed to the house's House Leader.
- `participant-reviews` header pipes `last1on1Date` only when
  `hasValidLast1on1Date` is true — guards DatePipe against 'No Date'/null
  (NG02100); displays 'No previous 1-on-1'.

### Implemented: staff profile photo from Staff table
- Staff photo now lives on the Staff table (previously reached via the
  participant table photo, FID 40): FID 307 'Photo New' is a rich text field
  that renders FID 308 'Photo' (file attachment)
- `quickbaseService.getStaffPhoto(staffRecordId)` queries the staff record
  (select [3, 307, 308]), resolves the image URL from 307's rendered `<img>`
  via `extractImageUrl`, falls back to 308's file-attachment `url`, downloads
  through the proxy, and caches in PhotoStorageService / sessionStorage under
  a `staff_<id>` key (avoids colliding with participant record IDs)
- `resident-detail` calls `loadStaffPhoto()` when `isStaff` (staffRecordId from
  `userService.getParticipantInfo()`); the staff-profile avatar binds
  `staffPhoto || residentData.residentPhoto` — participant photo is the fallback
- Only the senior-staff (participant-login) profile view uses this; the
  House Leader login flow displays no staff photo

### Authentication after Staff → Participants relationship removal (2026-11)
- Staff FIDs 9, 10, 55, 93, 223 were deleted. Login query selects
  [3, 6, 71, 102, 139, 225, 295, 304, 305, 306, 372]: 304 = name, 305 = phone,
  306 = email, 372 = house name, 71 = House Leader flag (House Leader detection only).
- Roles: Role Assignments table `bs9ueb9md` (`environment.roleAssignmentsTableID`),
  `{12.EX.<Staff FID 3>}`, active when FID 6 = 'Active', role name = FID 10.
  Multiple roles kept in `quickbaseService.currentStaffRoles`.
- Staff membership = an active Role Assignment named 'Staff'
  (`quickbaseService.hasStaffRole` / `isStaffSession`), independent of FID 71.
  Other or multiple roles grant nothing extra; lookup failure = not Staff.
- House Leader Login: Staff (or area manager FID 295) may select any house and
  operate as its House Leader record; everyone else only their own record for
  the selected house. `isStaffSession` gates Stipulated Agreement / 1-on-1 actions.
- Login payload: `HouseLeaderRecordId` = Staff Record ID (FID 3) — used by
  Transport FID 42 and Communication FID 36. `HouseLeaderParticipantId` =
  Participant Record ID resolved by Staff Email 306 ↔ Participant Email 177
  (trim + lowercase, exactly one match) — used by Communication FID 26 only.
- Senior Staff (participant login): `userService.checkIsSeniorStaff(email)` matches
  the participant email against cached active Senior Staff (`staffEmail`, FID 306).
  `userService.resolveParticipantStaffAccess(email)` additionally requires an active
  'Staff' Role Assignment for that Staff record before granting the staff profile,
  Time Clock (FID 359) and participant search; otherwise participant-only access.
  Time Clock still gated by Staff FID 359.

### Still open
- Correct FID for task house-name display (36 is unpopulated in new schema)
- `status-overdue` CSS class keys on `.includes('Due')` — 'Incomplete' won't trigger it
- Retry path `updateAttendanceRecords` observable is never subscribed (pre-existing dead code)

### Deferred (same migration, later sessions)
- Observation reports
- Resident updates
- Transport requests
