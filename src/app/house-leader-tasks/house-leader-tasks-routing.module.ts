import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HouseLeaderTasksPage } from './house-leader-tasks.page';

const routes: Routes = [
  {
    path: '',
    component: HouseLeaderTasksPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HouseLeaderTasksPageRoutingModule {}
