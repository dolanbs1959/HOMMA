import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, catchError, throwError, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { QuickbaseService } from './services/quickbase.service';

@Injectable({
  providedIn: 'root'
})
export class HelpDeskService {
  private queryResidentTableId = environment.queryResidentTableId; //Resident table
  private HelpDeskTableID = environment.HelpDeskTableID; //Help Desk table

  constructor(private quickbaseService: QuickbaseService) { }

  submitTicket(data: any): Observable<any> {
    // console.log('Inserting ticket:', JSON.stringify(data, null, 2));
    const body = {
      to: this.HelpDeskTableID, // replace with your actual table ID
      data: [data],
      fieldsToReturn: [3] // replace with your actual field IDs
    };
    // console.log('Request Body:', body);
    return this.quickbaseService.callQuickbaseProxy('POST', 'records', body).pipe(
      map((response: any) => {
        // console.log('Insert ticket Response:', response); // Log the entire response
        const ticketId = response.data[0]?.['3'].value; // Assuming the Ticket ID# is in the '3' field of the first record in the data array
        return ticketId;
      })
    );
  }

getParticipantNames(): Observable<any> {
  // console.log('Querying for active participants:'); // Log the staffRecordID
   const body = {
   from: this.queryResidentTableId, // replace with your actual table ID
   select: [3, 72], // replace with your actual field IDs
   where: `{7.EX.'Area Supervisor'}OR{7.EX.'Program Participant'}OR{7.EX.'House Leader'}OR{7.EX.'Assistant House Leader'}OR{7.EX.'Participant Staff'}OR{7.EX.'Staff'}`,
   options: {
   orderby: 72,
   skip: 0,
   top: 0,
   compareWithAppLocalTime: false
     }
 };
   // console.log('Request Body:', body);

    return this.quickbaseService.callQuickbaseProxy('POST', 'query', body);
      // .pipe(tap(response => console.log('Response from server:', response)));


}
}
