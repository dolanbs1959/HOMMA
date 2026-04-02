HOMMA (HOM Mobile Assistant) - Technical Documentation & Architecture Guide
1. Introduction and Purpose
This document provides a comprehensive technical overview of the HOM Mobile Assistant (HOMMA) Progressive Web Application (PWA). It is designed to serve as a roadmap and reference guide for any developer who needs to understand the app's architecture, maintain the codebase, fix bugs, or implement new features.

HOMMA serves two primary user roles for House of Mercy (HOM):

House Leaders (Staff): Manage house operations, track participant check-ins, record vitals, file observation reports, schedule transportation, and log attendance.
Program Participants (Residents): View their personal status, register for classes, request transportation, and communicate securely with staff.
2. Technology Stack
Frameworks: Angular 17, Ionic 7
Mobile/Native Integration: Capacitor 5 (Android support, native device features like secure storage, haptics, keyboard, sharing)
State Management & Reactivity: RxJS (Extensive use of BehaviorSubject for state caching)
Backend & Database: Quickbase (Primary Data Store)
Middleware/Security: Firebase Cloud Functions (Used as a secure proxy to Quickbase to hide API keys)
Analytics: Google Analytics (via Firebase ScreenTrackingService and AnalyticsService)
PWA Features: Angular Service Worker (@angular/service-worker) for offline capabilities and app updates.
3. Application Architecture
3.1. General Structure
The application follows a standard Angular modular structure, enhanced with Ionic components for a mobile-first UI.

src/app/ contains all feature modules.
Routing is defined centrally in app-routing.module.ts and heavily relies on Lazy Loading to optimize performance.
The app uses HashLocationStrategy (useHash: true in routing) which is often necessary for PWA and Cordova/Capacitor deployments.
3.2. Data Flow, Security, and Analytics
A critical architectural decision in HOMMA is the Quickbase Proxy. Instead of the Angular frontend communicating directly with Quickbase (which would expose the Quickbase API key in the client), the app makes requests to a Firebase Cloud Function (quickbaseProxy).

QuickbaseService builds the query/payload.
It calls this.callQuickbaseProxy(...) which uses Firebase's httpsCallable.
The Cloud Function securely injects the API key and forwards the request to Quickbase.
Data is returned, heavily cached in QuickbaseService using BehaviorSubjects (e.g., residentData, staffTasks, houseKPIs, activeStaff), and then consumed by components.
Further Reading on Security and Analytics: For deeper insights into how the app handles security logging, data masking, and Google Analytics tracking, please refer to the following repository documents:

CONSOLE_SECURITY_ENHANCEMENT.md: Details the implementation of the secure Firebase Cloud Function proxy, environment variable handling, and mechanisms used to scrub sensitive API keys and PII from client-side console logs.
GA4_SETUP_INSTRUCTIONS.md: Provides specific details on how Google Analytics 4 is integrated, including event tracking (like logins and view navigations) without exposing personally identifiable information.
Note for Developers: If you encounter 500 errors or CORS issues during local development, ensure the Firebase Emulator is running or the production Firebase project is correctly linked, as API calls rely on this proxy.

3.3 State Management and Caching
Because the app relies heavily on network calls, QuickbaseService implements a robust caching layer using BehaviorSubject.

When a module needs data (e.g., getStaffTasks()), it first checks if the cache is available.
If data is in the BehaviorSubject, it returns immediately.
If not, it triggers an API call, updates the BehaviorSubject, and logs a cache miss.
Important: Developers must be careful to clear specific caches (or call clearAllCaches()) on logout or when switching contexts to prevent data leakage between users.
4. Key Modules and Features
4.1. Authentication and Entry (login module)
File Location: src/app/login/
Functionality:
Handles login for both Staff and Participants.
Fetches a daily Bible verse from an external API (bible-api.com).
Staff Login: Queries Quickbase queryStaffTableId to verify the staff ID against the selected House. Resolves roles (e.g., Area Manager vs. House Leader) and determines dashboard access.
Participant Login: Validates the user's email against the queryResidentTableId. If matched, checks the password locally against the returned Quickbase record.
State Setup: Upon successful login, sets UserService context, initializes Google Analytics properties, fetches pending arrivals/residents, and routes to either /home (Staff) or /resident-detail (Participant).
4.2. House Leader Dashboard (home module)
File Location: src/app/home/
Functionality: The central hub for Staff.
House KPIs: Displays house-specific metrics (occupancy, arrivals, observation counts) fetched via getHouseNames().
Staff Tasks: Fetches overdue or pending activities (e.g., 1-on-1s) via getStaffTasks(). Routes to staff-tasks.
Transportation Report: Displays open and scheduled transport requests for the house.
Participant List: Displays active residents and pending arrivals. Clicking a resident opens the ResidentActionsComponent popover.
Feedback Form: Allows staff to send prayer requests, feedback, or maintenance requests (inserts into communicationTableId).
4.3. Resident Management & Actions
File Locations: src/app/resident-actions/, src/app/resident-detail/, src/app/residentupdate/
Functionality:
Resident Vitals: Detailed view of participant info, including care navigator contacts, financial status, and bed dates.
Add Observation Report (observationreport): Logs specific behaviors (positive/negative), safety plan requirements, and optional photos. Uploads base64 images directly to Quickbase fields.
Add Resident Update (residentupdate): Updates occupancy status, moves residents between rooms/beds.
Participant 1-on-1s (participant-reviews): Logs required check-in meetings, therapy status, and meeting notes.
Class Registration (registrations, meetings-classes, training): Allows registering a participant for available training modules.
Add Transport Request (transportation): Schedules rides (Pick-up/Destination, date/time) and saves to transportationTableId.
4.4. Participant Dashboard
File Location: src/app/resident-detail/ (reused dynamically)
Functionality:
When logged in as a participant, this view acts as their home page.
Displays contact info for their House Leader, Care Navigator, and Program Director.
Shows current status, room/bed, fees due, and active pay plans.
Provides colored action buttons to:
Add Transport Requests.
Register for Classes.
Go to Message Center (src/app/message.center/): Allows direct messaging to HOM staff.
Pay Program Fees (redirects to an external web payment portal).
4.5. Weekly Meetings & Attendance
File Location: src/app/weekly.meetings/
Functionality: Allows House Leaders to add a weekly house meeting, log what was discussed, and perform bulk updates for resident attendance (Present, Excused, Unexcused). Uses createAttendanceRecordsBulk in the QuickbaseService.
5. System Workflow Diagram
Below is a Mermaid.js diagram illustrating the high-level application flow and module interactions. (See Section 6 for instructions on how to render this).

graph TD
    %% App Entry
    A[App Launch] --> B{Role Selection}
    
    %% APIs
    API[Quickbase Service + Firebase Proxy]
    
    %% Login Flows
    B -->|Staff| C[Staff Login]
    B -->|Participant| D[Participant Login]
    
    C -->|Authenticate via API| API
    D -->|Authenticate via API| API
    
    %% Staff Flow
    C -->|Success| E[Home Dashboard]
    E --> E1[View House KPIs]
    E --> E2[Manage Staff Tasks]
    E --> E3[View Transport Requests]
    E --> E4[Send Staff Feedback]
    E --> E5[Manage Residents List]
    
    E5 -->|Select Resident| F[Resident Actions Popover]
    F --> F1[Resident Vitals / Details]
    F --> F2[Add Observation Report]
    F --> F3[Add Resident Update / Move]
    F --> F4[Add Participant 1-on-1]
    F --> F5[Class Registration]
    F --> F6[Add Transport Request]
    
    E2 --> G[Weekly Meetings & Attendance]
    
    %% Participant Flow
    D -->|Success| H[Participant Dashboard]
    H --> H1[View Personal Status & Financials]
    H --> H2[Add Transport Request]
    H --> H3[Register for Classes]
    H --> H4[Message Center]
    H --> H5[Pay Fees / Tithe Ext. Link]
    
    %% Data connections
    E1 -.-> API
    E2 -.-> API
    E3 -.-> API
    F1 -.-> API
    F2 -.-> API
    F3 -.-> API
    F4 -.-> API
    F5 -.-> API
    F6 -.-> API
    G -.-> API
    H1 -.-> API
    H2 -.-> API
    H3 -.-> API
    H4 -.-> API
