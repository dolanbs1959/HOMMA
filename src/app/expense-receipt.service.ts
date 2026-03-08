import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { QuickbaseService } from './services/quickbase.service';

@Injectable({
  providedIn: 'root'
})
export class ExpenseReceiptService {
  private vendorTableId = environment.vendorTableID; // bpqx5i336
  private expenseReceiptTableId = environment.expenseReceiptTableID; // TBD - to be configured

  constructor(private quickbaseService: QuickbaseService) { }

  /**
   * Get list of vendors from QuickBase
   * Vendor table: bpqx5i336
   * Field 6: QuickBooks ID (Text)
   * Field 7: Display Name (Text)
   */
  getVendors(): Observable<any> {
    const body = {
      from: this.vendorTableId,
      select: [3, 6, 7], // Record ID, QuickBooks ID, Display Name
      where: `{7.XEX.''}`, // Get all vendors with non-empty display names
      sortBy: [
        {
          fieldId: 7,
          order: 'ASC'
        }
      ],
      options: {
        skip: 0,
        top: 0,
        compareWithAppLocalTime: false
      }
    };

    return this.quickbaseService.callQuickbaseProxy('POST', 'query', body);
  }

  /**
   * Submit expense receipt to QuickBase
   * Field IDs:
   * - 6: User
   * - 7: Expense Date
   * - 8: Amount (Currency)
   * - 9: Description (Text - Multiline)
   * - 10: Receipt (File Attachment)
   * - 12: Related Vendor (Text Lookup)
   * - 14: Related Staff (Numeric Lookup)
   * @param data The expense receipt data
   * @returns Observable with the new record ID
   */
  submitExpenseReceipt(data: any): Observable<number> {
    const body = {
      to: this.expenseReceiptTableId,
      data: [data],
      fieldsToReturn: [3, 6, 7, 8, 9, 10, 12, 14] // Return Record ID and key fields including Receipt (10) and Related Staff (14)
    };

    return this.quickbaseService.callQuickbaseProxy('POST', 'records', body).pipe(
      map((response: any) => {
        const recordId = response.data[0]?.['3'].value;
        return recordId;
      })
    );
  }

  /**
   * Upload receipt photo to QuickBase file attachment field
   * @param recordId The record ID to attach the file to
   * @param base64String The base64 encoded image data (without data URL prefix)
   * @returns Observable for the upload operation
   */
  uploadReceiptPhoto(recordId: string, base64String: string): Observable<any> {
    // Field ID for file attachment - using the configured field or default to 10
    const fileFieldId = environment.expenseReceiptPhotoFieldID || 10;
    // Use the same endpoint format as the observation report file upload
    const endpoint = `records/${this.expenseReceiptTableId}/${recordId}/fields/${fileFieldId}/files`;
    
    const body = {
      version: 1,
      file: base64String
    };

    return this.quickbaseService.callQuickbaseProxy('POST', endpoint, body);
  }
}
