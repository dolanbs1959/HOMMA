import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RequestsPageRoutingModule } from './requests-routing.module';
import { RequestsPage } from './requests.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RequestsPageRoutingModule,
  ],
  declarations: [RequestsPage],
})
export class RequestsPageModule {}
