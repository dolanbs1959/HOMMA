import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ClassroomDetailComponent } from './classroom-detail.component';

@NgModule({
  declarations: [ClassroomDetailComponent],
  imports: [CommonModule, IonicModule],
  exports: [ClassroomDetailComponent]
})
export class ClassroomDetailModule {}
