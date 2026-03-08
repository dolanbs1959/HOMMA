import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ExpenseReceiptService } from 'src/app/expense-receipt.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'HOMMA-expense-receipt',
  templateUrl: './expense-receipt.component.html',
  styleUrls: ['./expense-receipt.component.scss'],
})
export class ExpenseReceiptComponent implements OnInit {

  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef;
  @ViewChild('canvasElement') canvasElement!: ElementRef;
  @ViewChild('imageElement') imageElement!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('grantRadioGroup', { static: false }) grantRadioGroup!: ElementRef;

  isLoading = false;
  expenseForm: FormGroup;
  newExpenseRecordId: number = 0;
  vendorChoices: { id: number; name: string; quickbooksId: string }[] = [];
  filteredVendors: { id: number; name: string; quickbooksId: string }[] = [];
  selectedVendor: { id: number; name: string; quickbooksId: string } | null = null;
  vendorSearchText: string = '';
  showVendorList: boolean = false;
  capturedPhoto: string | null = null;
  uploadedFileExtension: string = 'png';
  uploadedFileName: string = '';
  showCamera = false;
  userEmail: string = '';
  submissionError: string | null = null;
  selectedGrantType: string = 'none';
  grantOptions: { value: string; label: string }[] = [
    { value: 'none', label: 'Not a Grant Expenditure' },
    { value: 'reentry', label: 'Reentry Grant' },
    { value: 'federal', label: 'Federal Grant' },
    { value: 'tax', label: 'Tax Grant' },
    { value: 'coalition', label: 'Coalition Grant (EEC)' }
  ];
  // Whether this is a grant expense (controls visibility of grant type options)
  isGrantExpense: boolean = false;
  // grantYesNo is stored in the reactive form control 'grantYesNo'
  private stream: MediaStream | undefined;

  constructor(
    private router: Router,
    private expenseReceiptService: ExpenseReceiptService,
    private formBuilder: FormBuilder,
    private datePipe: DatePipe,
    private userService: UserService
  ) {
    this.expenseForm = this.formBuilder.group({
      vendor: ['', Validators.required],
      expenseDate: ['', Validators.required],
      qty: [1, [Validators.required, Validators.min(1)]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      description: ['', Validators.required],
      grantYesNo: ['no']
    });
    this.isGrantExpense = false;
  }

  onGrantExpenseChange(isGrant: boolean) {
    this.isGrantExpense = !!isGrant;
    // keep reactive control in sync if needed
    try { this.expenseForm.patchValue({ grantYesNo: this.isGrantExpense ? 'yes' : 'no' }, { emitEvent: false }); } catch (e) {}
    if (!this.isGrantExpense) {
      // Reset to 'none' when user selects No
      this.selectedGrantType = 'none';
    }
  }

  ngOnInit() {
    // Get the logged-in user's email
    this.userEmail = this.userService.getParticipantEmail();
    // Ensure grant default is No via reactive control and wire up changes
    this.isGrantExpense = (this.expenseForm.get('grantYesNo')?.value === 'yes');
    this.expenseForm.get('grantYesNo')?.valueChanges.subscribe((val: string) => {
      this.isGrantExpense = val === 'yes';
      if (!this.isGrantExpense) this.selectedGrantType = 'none';
    });
    // Defensively ensure the control has the default value so Ion's radio UI reflects it.
    setTimeout(() => {
      try {
        this.expenseForm.get('grantYesNo')?.setValue('no', { emitEvent: false });
        this.isGrantExpense = false;
      } catch (e) {
        // ignore
      }
    }, 0);
    this.loadVendors();
  }

  ngAfterViewInit() {
    // Force the native ion-radio element for 'no' to have the checked attribute
    // if the reactive control has the 'no' value. This addresses platforms
    // where the visual inner circle sometimes doesn't render despite the
    // form control having the correct value.
    setTimeout(() => {
      try {
        const groupEl = this.grantRadioGroup?.nativeElement as HTMLElement | undefined;
        if (groupEl) {
          const radioNo = groupEl.querySelector('ion-radio[value="no"]') as HTMLElement | null;
          if (radioNo) {
            radioNo.setAttribute('checked', '');
          }
        }
      } catch (e) {
        // ignore
      }
    }, 50);
  }

  loadVendors() {
    this.isLoading = true;
    this.expenseReceiptService.getVendors().subscribe(
      (response: any) => {
        this.vendorChoices = response.data.map((item: any) => ({
          id: item['3'].value,
          quickbooksId: item['6'].value, // QuickBooks ID
          name: item['7'].value, // Display Name
        }));
        this.vendorChoices.sort((a, b) => a.name.localeCompare(b.name));
        this.filteredVendors = [];
        this.isLoading = false;
      },
      (error: any) => {
        console.error('Error loading vendors:', error);
        this.isLoading = false;
      }
    );
  }

  // Vendor search/autocomplete methods
  onVendorSearch(event: any) {
    const searchTerm = event.target.value?.toLowerCase() || '';
    this.vendorSearchText = event.target.value || '';

    if (searchTerm.length < 2) {
      this.filteredVendors = [];
      this.showVendorList = false;
      return;
    }

    this.filteredVendors = this.vendorChoices.filter(vendor =>
      vendor.name.toLowerCase().includes(searchTerm)
    ).slice(0, 10); // Limit to 10 results for performance

    this.showVendorList = this.filteredVendors.length > 0;
  }

  selectVendor(vendor: { id: number; name: string; quickbooksId: string }) {
    this.selectedVendor = vendor;
    this.vendorSearchText = vendor.name;
    this.showVendorList = false;
    this.expenseForm.patchValue({ vendor: vendor });
  }

  clearVendor() {
    this.selectedVendor = null;
    this.vendorSearchText = '';
    this.filteredVendors = [];
    this.showVendorList = false;
    this.expenseForm.patchValue({ vendor: '' });
  }

  onVendorInputFocus() {
    if (this.vendorSearchText.length >= 2) {
      this.showVendorList = this.filteredVendors.length > 0;
    }
  }

  onVendorInputBlur() {
    // Delay hiding to allow click on list item
    setTimeout(() => {
      this.showVendorList = false;
    }, 200);
  }

  exitApp() {
    this.router.navigate(['/login']);
  }

  resetForm() {
      this.expenseForm.reset();
      this.expenseForm.patchValue({ qty: 1 });
      // We DO NOT reset newExpenseRecordId here anymore,
      // so the success message stays on screen until they start typing again.

      this.capturedPhoto = null;
      this.uploadedFileExtension = 'png'; // Reset default
      this.stopCamera();

      this.selectedVendor = null;
      this.vendorSearchText = '';
      this.filteredVendors = [];
      this.showVendorList = false;
      this.selectedGrantType = 'none';
      this.isGrantExpense = false;
      this.submissionError = null; // Clear any old errors
    }

  // Camera functionality
  openCamera() {
    this.showCamera = true;
    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: { exact: 'environment' }, // Try to use the rear camera
        },
      })
      .catch(() => {
        // If the rear camera is not available, fall back to the default camera
        return navigator.mediaDevices.getUserMedia({ video: true });
      })
      .then((stream) => {
        this.stream = stream;
        if (this.videoElement && this.videoElement.nativeElement) {
          this.videoElement.nativeElement.srcObject = stream;
        } else {
          console.error('Video element not found!');
        }
      })
      .catch((err) => {
        console.error('Error accessing camera: ', err);
        alert('Unable to access camera: ' + err.message);
        this.showCamera = false;
      });
  }

  capturePhoto() {
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    // Set the desired dimensions
    const desiredWidth = 640;
    const desiredHeight = 480;

    canvas.width = desiredWidth;
    canvas.height = desiredHeight;

    // Draw the current frame of the video onto the canvas
    context.drawImage(
      this.videoElement.nativeElement,
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Get a data URL representing the image
    this.capturedPhoto = canvas.toDataURL('image/png');
    // Camera always takes PNGs, so force the extension back to png
    this.uploadedFileExtension = 'png';
    // Stop the video stream
    this.stopCamera();
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
    }
    this.showCamera = false;
  }

  cancelCamera() {
    this.stopCamera();
  }

  removePhoto() {
    this.capturedPhoto = null;
  }

  // File upload functionality
onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];

    // LOGIC CHANGE: Check if it is a PDF
    if (file.type === 'application/pdf') {
      this.uploadedFileExtension = 'pdf';
      this.uploadedFileName = file.name;
    } else {
      this.uploadedFileExtension = 'png';
      this.uploadedFileName = file.name;
    }

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.capturedPhoto = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
}

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  // Submit the expense receipt
    async submitExpense() {
        if (!this.expenseForm.valid) {
          return;
        }

        this.isLoading = true;
        this.submissionError = null; // Clear previous errors
        this.newExpenseRecordId = 0; // Clear previous success

        const participantInfo = this.userService.getParticipantInfo();

        // NEW FORMAT: MM-YY $##.00 (e.g., "12-25 $150.00.pdf")
        const dateStr = this.datePipe.transform(this.expenseForm.value.expenseDate, 'MM-yy');
        const amountVal = parseFloat(this.expenseForm.value.amount);
        const amountStr = amountVal.toFixed(2); // Ensures 2 decimal places (10.00)

        const staffName = participantInfo.fullName || '';
        const smartFileName = `${dateStr} $${amountStr} ${staffName}.${this.uploadedFileExtension}`;

        const expenseData: { [key: number]: { value: any } } = {
          14: { value: participantInfo.staffRecordId },
          12: { value: this.expenseForm.value.vendor.quickbooksId },
          // Note: We still send the full YYYY-MM-DD to the date field (fid 7) for Quickbase to read it correctly as a date
          7: { value: this.datePipe.transform(this.expenseForm.value.expenseDate, 'yyyy-MM-dd') },
          20: { value: parseInt(this.expenseForm.value.qty) },
          8: { value: amountVal },
          9: { value: this.buildDescription() },
        };

        if (this.capturedPhoto) {
          expenseData[10] = {
            value: {
              fileName: smartFileName, // <--- Using the new auditor-friendly name
              data: this.capturedPhoto.split(',')[1]
            }
          };
        }

        this.expenseReceiptService.submitExpenseReceipt(expenseData).subscribe(
          (recordId: number) => {
            this.isLoading = false;

            // 1. Reset the form immediately to clear input fields
            this.resetForm();

            // 2. Set the success ID *after* reset so the message appears
            this.newExpenseRecordId = recordId;
          },
          (error: any) => {
            console.error('Error submitting expense:', error);
            this.isLoading = false;
            this.submissionError = "Failed to submit expense. Please try again.";
          }
        );
      }

  // Build description with grant prefix if applicable
  private buildDescription(): string {
    const userDescription = this.expenseForm.value.description || '';

    if (this.selectedGrantType && this.selectedGrantType !== 'none') {
      const grantLabel = this.grantOptions.find(g => g.value === this.selectedGrantType)?.label || '';
      return `Grant Expense - ${grantLabel}. ${userDescription}`;
    }

    return userDescription;
  }
}
