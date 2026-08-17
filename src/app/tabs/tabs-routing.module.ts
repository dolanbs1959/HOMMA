import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'kpis',
        loadChildren: () => import('../home/home.module').then(m => m.HomePageModule)
      },
      {
        path: 'house-leader-tasks',
        loadChildren: () => import('../placeholder/placeholder.module').then(m => m.PlaceholderPageModule),
        data: { title: 'House Leader Tasks' }
      },
      {
        path: 'participants',
        loadChildren: () => import('../participants/participants.module').then(m => m.ParticipantsPageModule)
      },
      {
        path: 'transportation',
        loadChildren: () => import('../transportation-schedule/transportation-schedule.module').then(m => m.TransportationSchedulePageModule)
      },
      {
        path: 'requests',
        loadChildren: () => import('../placeholder/placeholder.module').then(m => m.PlaceholderPageModule),
        data: { title: 'Requests' }
      },
      {
        path: 'announcements',
        loadChildren: () => import('../placeholder/placeholder.module').then(m => m.PlaceholderPageModule),
        data: { title: 'Announcements' }
      },
      {
        path: 'payments',
        loadChildren: () => import('../placeholder/placeholder.module').then(m => m.PlaceholderPageModule),
        data: { title: 'Payments' }
      },
      {
        path: '',
        redirectTo: 'kpis',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TabsPageRoutingModule {}
