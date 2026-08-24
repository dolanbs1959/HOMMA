import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePage } from './home.page';
import { ResidentDetailComponent } from '../resident-detail/resident.detail';

const routes: Routes = [
    {
    path: '',
    component: HomePage,
    },
    {
      path: 'resident-detail/:id',
      component: ResidentDetailComponent,
      children: [
        {
          path: 'payments',
          loadChildren: () => import('../placeholder/placeholder.module').then(m => m.PlaceholderPageModule)
        }
      ]
    },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomePageRoutingModule {}
