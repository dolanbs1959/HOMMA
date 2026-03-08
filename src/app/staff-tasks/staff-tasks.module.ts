import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { StaffTasksComponent } from './staff-tasks.component';

import { ReformatPipeModule } from '../reformat-pipe/reformat-pipe.module';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReformatPipeModule,
    RouterModule.forChild([
      {
        path: '',
        component: StaffTasksComponent
      }
    ])
  ],
  declarations: [
    StaffTasksComponent
  ]
})
export class StaffTasksModule { }
