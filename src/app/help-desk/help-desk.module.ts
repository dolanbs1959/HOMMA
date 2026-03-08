import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog'; // Add this line
import { HelpDeskComponent } from './help-desk.component';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, Routes } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';

const routes: Routes = [
  {
    path: '',
    component: HelpDeskComponent
  }
];

@NgModule({
  declarations: [HelpDeskComponent],
  providers: [DatePipe],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatDialogModule, // Add this line
    RouterModule.forChild(routes)
  ],
    exports: [RouterModule]
})
export class HelpDeskModule { }