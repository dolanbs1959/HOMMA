import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { WeeklyMeetingsPageRoutingModule } from './weekly.meetings-routing.module';

import { WeeklyMeetingsPage } from './weekly.meetings.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReactiveFormsModule,
    WeeklyMeetingsPageRoutingModule
  ],
  declarations: [WeeklyMeetingsPage]
})
export class WeeklyMeetingsPageModule {}
