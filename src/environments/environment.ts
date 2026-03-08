// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // API key REMOVED - stored securely in Firebase Cloud Functions only
  // Legacy components must be refactored to use secure proxy
  apiKey: '', // DO NOT PUT API KEY HERE - use Firebase Cloud Function
  firebase: {
    apiKey: 'AIzaSyB5kMAGa9tswbHk8ujRxxPGvShXLBb-k00', // Firebase Web API key (safe for public)
    authDomain: 'homma-analytics.firebaseapp.com',
    projectId: 'homma-analytics',
    storageBucket: 'homma-analytics.firebasestorage.app',
    messagingSenderId: '643665726696',
    appId: '1:643665726696:web:c16c710c19ecb9f78a8d5d',
    measurementId: 'G-3ZWHFLQJDZ'
  },
  baseUrl: 'https://api.quickbase.com/v1/records',
  realm: 'bobfaulk.quickbase.com', //bobfaulk.quickbase.com
  appId: 'bjgvvyg79',//HOM app
  queryStaffTableId: 'bs8cmihpr', //Staff table
  queryResidentTableId: 'bjgvye6ni', //Participant table
  insertTableId: 'xxxxxx',//Insert records functions not yet defined.
  QUICKBASE_URL: 'https://api.quickbase.com/v1/records/query',
  ObservationsURL: 'https://api.quickbase.com/v1/fields/7?tableId=bqwfwxhsy',
  qryObservationTableID: 'bqwfwxhsy',
  ResidentUpdateTableID: 'bs9txtrtt',
  ActivityTableID: 'bjh35ky8s',
  AttendanceTableID: 'bqbn92usp',
  StaffTasksTableID: 'bs88dwtsr',
  qryMinistryHouseTableID: 'bjgvvyg85',
  HelpDeskTableID: 'btmnstttn',
  helpDeskTech: '61254956.bwt4', //Kelly, Glenn
  locationTableID: 'bsy8qh6fs',
  transportationTableID: 'bs4mg5z72',
  participantReviewsTableID: 'bp5tmhpnn',
  trainingTableID: 'bsy84i8q3',
  classesTableID: 'bsy8qh6fm',
  registrationTableID: 'bsy8qh6fj',
  communicationTableID: 'bjgvv73yz',
  announcementsTableID: 'buy4p92sm',
  vendorTableID: 'bpqx5i336', // Vendor table
  expenseReceiptTableID: 'bvnkq2hnd', // Expense Receipt table
  expenseReceiptPhotoFieldID: 10, // Receipt file attachment field ID

};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
