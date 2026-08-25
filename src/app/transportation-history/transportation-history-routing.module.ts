import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TransportationHistoryPage } from './transportation-history.page';

const routes: Routes = [
  {
    path: '',
    component: TransportationHistoryPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TransportationHistoryPageRoutingModule {}
