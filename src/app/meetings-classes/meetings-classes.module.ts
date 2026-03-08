import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { MeetingsClassesComponent } from './meetings-classes.component';

@NgModule({
  declarations: [MeetingsClassesComponent],
  imports: [CommonModule, IonicModule],
  exports: [MeetingsClassesComponent]
})
export class MeetingsClassesModule {}
