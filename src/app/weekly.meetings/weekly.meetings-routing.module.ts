import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { WeeklyMeetingsPage } from './weekly.meetings.page';

const routes: Routes = [
  {
    path: '',
    component: WeeklyMeetingsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WeeklyMeetingsPageRoutingModule {}
