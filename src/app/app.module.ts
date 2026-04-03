import { NgModule, CUSTOM_ELEMENTS_SCHEMA, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // Import FormsModule

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { VersionFooterComponent } from './components/version-footer/version-footer.component';
import { DatePipe } from '@angular/common';
import { AppRoutingModule } from './app-routing.module';
import { LocationComponent } from 'src/app/components/location/location.component';
import { ResidentActionsComponent } from 'src/app/resident-actions/resident-actions.component';
import { QuickbaseService } from 'src/app/services/quickbase.service';
import { UserService } from 'src/app/services/user.service'; // Import UserService
import { ThemeService } from 'src/app/services/theme.service'; // Import ThemeService
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from 'src/environments/environment';

import { MatDialogModule } from '@angular/material/dialog';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAnalytics, getAnalytics, ScreenTrackingService } from '@angular/fire/analytics';
import { AnalyticsService } from './services/analytics.service';
import { TransportationModule } from './transportation/transportation.module';
import { participantReviewsModule } from './participant-reviews/participant-reviews.module';
import { MeetingsClassesModule } from './meetings-classes/meetings-classes.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { TrainingModule } from './training/training.module';
import { LoginPageModule } from './login/login.module';
import { MessageCenterComponent } from './message.center/message.center.component';

@NgModule({
  declarations: [AppComponent, LocationComponent, MessageCenterComponent, ResidentActionsComponent, VersionFooterComponent],
  imports: [MatDialogModule, 
    BrowserModule, 
    IonicModule.forRoot(), 
    AppRoutingModule, 
    HttpClientModule, 
    FormsModule, 
    ReactiveFormsModule, 
    TransportationModule,
    participantReviewsModule,
    TrainingModule,
    LoginPageModule,
    MeetingsClassesModule,
    RegistrationsModule,
    IonicModule.forRoot({}), 
    ServiceWorkerModule.register('ngsw-worker.js', {
  enabled: environment.production,
  // Register the ServiceWorker as soon as the application is stable
  // or after 30 seconds (whichever comes first).
  registrationStrategy: 'registerWhenStable:30000'
}),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAnalytics(() => getAnalytics())],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy},
    QuickbaseService, 
    UserService, 
    ThemeService, 
    DatePipe,
    AnalyticsService,
    ScreenTrackingService
  ],
//providers: [{ provide: LocationStrategy, useClass: HashLocationStrategy}, QuickbaseService],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {}
