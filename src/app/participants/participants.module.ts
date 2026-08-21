import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ParticipantsPage } from './participants.page';
import { ParticipantDetailPage } from './participant-detail/participant-detail.page';
import { ParticipantsPageRoutingModule } from './participants-routing.module';
import { ReformatPipeModule } from '../reformat-pipe/reformat-pipe.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReformatPipeModule,
    ParticipantsPageRoutingModule
  ],
  declarations: [ParticipantsPage, ParticipantDetailPage]
})
export class ParticipantsPageModule {}
