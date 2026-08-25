import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TransportationUpdatePage } from './transportation-update.page';

const routes: Routes = [
  {
    path: ':id',
    component: TransportationUpdatePage
  },
  {
    path: '',
    component: TransportationUpdatePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TransportationUpdatePageRoutingModule {}
