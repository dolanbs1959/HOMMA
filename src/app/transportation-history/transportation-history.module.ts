import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { TransportationHistoryPage } from './transportation-history.page';
import { TransportationHistoryPageRoutingModule } from './transportation-history-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TransportationHistoryPageRoutingModule
  ],
  declarations: [TransportationHistoryPage]
})
export class TransportationHistoryPageModule {}
