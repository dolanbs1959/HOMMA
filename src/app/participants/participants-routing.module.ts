import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ParticipantsPage } from './participants.page';
import { ParticipantDetailPage } from './participant-detail/participant-detail.page';

const routes: Routes = [
  {
    path: '',
    component: ParticipantsPage
  },
  {
    path: ':id',
    component: ParticipantDetailPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ParticipantsPageRoutingModule {}
