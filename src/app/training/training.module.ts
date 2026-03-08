import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TrainingComponent } from './training.component';

@NgModule({
  declarations: [TrainingComponent],
  imports: [CommonModule, IonicModule],
  exports: [TrainingComponent]
})
export class TrainingModule {}
