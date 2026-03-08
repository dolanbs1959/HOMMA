import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { TransportationComponent } from './transportation/transportation.component';
import { ParticipantReviewsComponent } from './participant-reviews/participant-reviews.component';
import { TrainingComponent } from './training/training.component';
import { MeetingsClassesComponent } from './meetings-classes/meetings-classes.component';
import { RegistrationsComponent } from './registrations/registrations.component';
import { MessageCenterComponent } from './message.center/message.center.component';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },

  {path: 'observation-report',
  loadChildren: () => import('./observationreport/observationreport.module').then( m => m.ObservationReportPageModule)
  },

  //navigate to residentupdate page from resident.detail page
  {path: 'resident-update',
  loadChildren: () => import('./residentupdate/residentupdate.module').then( m => m.ResidentUpdatePageModule)
  },

  //navigate to residentupdate page with id from home page
  {
    path: 'resident-update/:id',
    loadChildren: () => import('./residentupdate/residentupdate.module').then(m => m.ResidentUpdatePageModule)
  },

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'weeklyhousemeeting',
    loadChildren: () => import('./weekly.meetings/weekly.meetings.module').then( m => m.WeeklyMeetingsPageModule)
  },
  {
    path: 'staff-tasks',
    loadChildren: () => import('./staff-tasks/staff-tasks.module').then(m => m.StaffTasksModule)
  },
  {
    path: 'help-desk',
    loadChildren: () => import('./help-desk/help-desk.module').then(m => m.HelpDeskModule)
  },
  {
    path: 'expense-receipt',
    loadChildren: () => import('./expense-receipt/expense-receipt.module').then(m => m.ExpenseReceiptModule)
  },
  {
    path: 'transportation',
    component: TransportationComponent
  },
  {
    path: 'participant-reviews',
    component: ParticipantReviewsComponent
  },
  {
    path: 'training',
    component: TrainingComponent
  },
  {
    path: 'meetingsClasses',
    component: MeetingsClassesComponent
  },
  {
    path: 'registrations',
    component: RegistrationsComponent
  },
  {
    path: 'message.center',
    component: MessageCenterComponent
  }

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules, useHash: true})
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
