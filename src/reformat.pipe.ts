import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({name: 'reformatDate'})
export class ReformatDatePipe implements PipeTransform {
  transform(dateStr: string): string {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
      "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const month = monthNames[date.getMonth()];
    const day = ('0' + date.getDate()).slice(-2); // Pad with 0's
    return `${month}-${day}-${year}`;
  }
}

@Pipe({name: 'extractText'})
export class ExtractTextPipe implements PipeTransform {
  transform(html: string): string {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  }
}

// @Pipe({name: 'reformatDate'})
// export class ReformatObservationIntakeDatePipe implements PipeTransform {
//   transform(value: string): string {
//     return moment(value, 'MM/DD/YYYY').format('YYYY-MM-DD');
//   }
// }