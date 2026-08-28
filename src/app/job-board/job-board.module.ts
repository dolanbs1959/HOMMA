import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { JobBoardPage } from './job-board.page';
import { JobBoardPageRoutingModule } from './job-board-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    JobBoardPageRoutingModule
  ],
  declarations: [JobBoardPage]
})
export class JobBoardPageModule {}
