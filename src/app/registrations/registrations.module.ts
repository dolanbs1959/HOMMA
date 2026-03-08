import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RegistrationsComponent } from './registrations.component';

@NgModule({
  declarations: [RegistrationsComponent],
  imports: [CommonModule, FormsModule, IonicModule],
  exports: [RegistrationsComponent]
})
export class RegistrationsModule {}
