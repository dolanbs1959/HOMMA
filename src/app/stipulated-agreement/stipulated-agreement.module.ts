import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SignaturePadModule } from '../components/signature-pad/signature-pad.module';
import { StipulatedAgreementComponent } from './stipulated-agreement.component';

@NgModule({
  declarations: [StipulatedAgreementComponent],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SignaturePadModule
  ],
  exports: [StipulatedAgreementComponent]
})
export class StipulatedAgreementModule { }
