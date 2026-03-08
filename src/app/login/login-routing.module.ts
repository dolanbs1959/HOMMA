import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginPage } from './login.page';
import { ResidentDetailComponent } from '../resident-detail/resident.detail';

const routes: Routes = [
  {
    path: '',
    component: LoginPage
  },
  {
    path: 'resident-detail',
    component: ResidentDetailComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LoginPageRoutingModule {}
