import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog'; // Add this line

import { ObservationReportComponent } from './observationreport.component';
import { SelectPhotoDialogComponent } from '../select-photo-dialog/select-photo-dialog.component';

const routes: Routes = [
  {
    path: '',
    component: ObservationReportComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReactiveFormsModule,
    MatDialogModule, // Add this line
    RouterModule.forChild(routes)
  ],
  declarations: [
    ObservationReportComponent,
    SelectPhotoDialogComponent  ],
})
export class ObservationReportPageModule { }