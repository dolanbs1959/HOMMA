import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReformatDatePipe, ExtractTextPipe } from '../../reformat.pipe';


@NgModule({
  declarations: [
    ReformatDatePipe,
    ExtractTextPipe
  ],
  imports: [
    CommonModule
  ],
  exports: [
    ReformatDatePipe,
    ExtractTextPipe
  ]
})
export class ReformatPipeModule { }
