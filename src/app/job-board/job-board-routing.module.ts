import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { JobBoardPage } from './job-board.page';

const routes: Routes = [
  {
    path: '',
    component: JobBoardPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class JobBoardPageRoutingModule {}
