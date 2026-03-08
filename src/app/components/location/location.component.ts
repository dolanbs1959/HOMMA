// src/app/components/location/location.component.ts

import { Component, OnInit } from '@angular/core';
import { QuickbaseService } from 'src/app/services/quickbase.service';

@Component({
  selector: 'app-location',
  template: `
  
`,

})
export class LocationComponent implements OnInit {
  constructor(private quickbaseService: QuickbaseService) {
    // console.log('LocationComponent constructor');
  }

  ngOnInit() {
    // console.log('LocationComponent ngOnInit');
    // Hardcoded values for testing
    const hardcodedRecordId = '709'; // Replace with an actual record ID from your Quickbase app
    const hardcodedUpdateData = { Resolution: 'test from app' };

    //this.updateRecord(hardcodedRecordId, hardcodedUpdateData);
  }

  // updateUserLocation(recordId: string, coordinates: any, date: string) {
  //   const data = {
  //     "fields": {
  //       "Coordinates": coordinates,
  //       "Date": date,
  //     },
  //   };
  
  // updateRecord(recordId: string, data: any) {
  //   this.quickbaseService.updateRecord(recordId, data)
  //   //@ts-ignore
  //     .subscribe(
  //       (response: any) => {
  //         // console.log('API Response', response);
  //       },
  //       (error: any) => {
  //         // console.error('API Error', error);
  //       }
  //     );
  // }
}
