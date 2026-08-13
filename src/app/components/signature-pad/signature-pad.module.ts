import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { SignaturePadComponent } from './signature-pad.component';

@NgModule({
  declarations: [SignaturePadComponent],
  imports: [CommonModule, IonicModule],
  exports: [SignaturePadComponent]
})
export class SignaturePadModule { }
