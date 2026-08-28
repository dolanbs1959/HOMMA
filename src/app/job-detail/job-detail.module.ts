import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { JobDetailPage } from './job-detail.page';
import { JobDetailPageRoutingModule } from './job-detail-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    JobDetailPageRoutingModule
  ],
  declarations: [JobDetailPage]
})
export class JobDetailPageModule {}
