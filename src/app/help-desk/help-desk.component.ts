import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { HelpDeskService } from '../help-desk.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'HOMMA-help-desk',
  templateUrl: './help-desk.component.html',
  styleUrls: ['./help-desk.component.scss'],
})
export class HelpDeskComponent  implements OnInit {
  isLoading = false;
  private helpDeskTech = environment.helpDeskTech;
  reportForm: FormGroup;
  NewHelpDeskTicketId: number = 0;
  dropdownChoices: { id: number, name: string }[] = [];

  constructor(
    private router: Router,
    private HelpDeskService: HelpDeskService,
    private formBuilder: FormBuilder,
    private datePipe: DatePipe,
  
  ) {
    this.reportForm = this.formBuilder.group({
      requestedBy: ['', Validators.required],
      preferredContactMethod: ['', Validators.required],
      requestedPriority: ['', Validators.required],
      ticketName: ['', Validators.required],
      ticketDefinition: ['', Validators.required],
      requestedDueDate: [''],      
    });

   }
  
   exitApp() {
    this.router.navigate(['/login']);
  }

  resetForm() {
    this.reportForm.reset();
    this.NewHelpDeskTicketId = 0
  }


  // submit the ticket
  async submitTicket() {
    function addField(fields: { [key: number]: { value: any } }, fieldId: number, value: any) {
      if (value === undefined || value === "") {
        fields[fieldId] = { value: null };
      } else {
        fields[fieldId] = { value: value };
      }
    }
    
      this.isLoading = true;
    const body: { [key: number]: { value: any } } = {
        47: { value: this.reportForm.value.requestedBy.id },
        12: { value: this.reportForm.value.preferredContactMethod },
        10: { value: this.reportForm.value.requestedPriority },
        11: { value: this.reportForm.value.ticketName },
        9: { value: this.reportForm.value.ticketDefinition },
        24: { value: { id: this.helpDeskTech } },
        46: { value: this.datePipe.transform(this.reportForm.value.requestedDueDate, 'yyyy-MM-dd') },
        
    };
    
    // console.log('Ticket Body:', body);
    
    this.HelpDeskService.submitTicket(body).subscribe(async (response: any) => {
      // console.log('Ticket inserted successfully', response);
      this.NewHelpDeskTicketId = response;
      // console.log('New Ticket ID:', this.NewHelpDeskTicketId);
      this.isLoading = false;
    
    }, (error: any) => {
      // console.error('Error inserting record', error);
    });
  }

  ngOnInit() {
    this.HelpDeskService.getParticipantNames().subscribe(response => {
      this.dropdownChoices = response.data.map((item: any) => ({ id: item['3'].value, name: item['72'].value }));
      this.dropdownChoices.sort((a, b) => a.name.localeCompare(b.name));
      //// console.log('Dropdown Choices:', this.dropdownChoices);
      
    },
    error => {
      // console.error('Error getting dropdown choices:', error);
    });

  }


}
