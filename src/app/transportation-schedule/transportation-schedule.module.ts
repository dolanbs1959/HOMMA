import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { TransportationSchedulePage } from './transportation-schedule.page';
import { TransportationSchedulePageRoutingModule } from './transportation-schedule-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TransportationSchedulePageRoutingModule
  ],
  declarations: [TransportationSchedulePage]
})
export class TransportationSchedulePageModule {}
