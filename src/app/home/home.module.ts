import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HomePage } from './home.page';
import { ResidentDetailComponent } from '../resident-detail/resident.detail';
import { ResidentUpdateComponent } from '../residentupdate/residentupdate.component';
import { ObservationReportComponent } from '../observationreport/observationreport.component';
import { StripHtmlPipe } from '../pipes/strip-html.pipe';

import { HomePageRoutingModule } from './home-routing.module';
import { ReformatPipeModule } from '../reformat-pipe/reformat-pipe.module';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    ReformatPipeModule,
    HomePageRoutingModule
  ],
  declarations: [
    HomePage,
    ResidentDetailComponent,
    StripHtmlPipe,
//    ResidentUpdateComponent,
//    ObservationReportComponent,
  ]
})
export class HomePageModule {}
