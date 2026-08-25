import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TransportationUpdatePage } from './transportation-update.page';
import { TransportationUpdatePageRoutingModule } from './transportation-update-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    TransportationUpdatePageRoutingModule
  ],
  declarations: [TransportationUpdatePage]
})
export class TransportationUpdatePageModule {}
