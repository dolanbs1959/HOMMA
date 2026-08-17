import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { PlaceholderPage } from './placeholder.page';
import { PlaceholderPageRoutingModule } from './placeholder-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PlaceholderPageRoutingModule
  ],
  declarations: [PlaceholderPage]
})
export class PlaceholderPageModule {}
