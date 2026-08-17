import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HouseLeaderTasksPage } from './house-leader-tasks.page';
import { HouseLeaderTasksPageRoutingModule } from './house-leader-tasks-routing.module';
import { ReformatPipeModule } from '../reformat-pipe/reformat-pipe.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReformatPipeModule,
    HouseLeaderTasksPageRoutingModule
  ],
  declarations: [HouseLeaderTasksPage]
})
export class HouseLeaderTasksPageModule {}
