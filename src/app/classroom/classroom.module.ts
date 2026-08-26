import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ClassroomComponent } from './classroom.component';

@NgModule({
  declarations: [ClassroomComponent],
  imports: [CommonModule, IonicModule],
  exports: [ClassroomComponent]
})
export class ClassroomModule {}
