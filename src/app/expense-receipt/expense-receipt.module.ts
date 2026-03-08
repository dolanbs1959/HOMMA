import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { RouterModule, Routes } from '@angular/router';
import { ExpenseReceiptComponent } from './expense-receipt.component';

const routes: Routes = [
  {
    path: '',
    component: ExpenseReceiptComponent
  }
];

@NgModule({
  declarations: [ExpenseReceiptComponent],
  providers: [DatePipe],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatDialogModule,
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class ExpenseReceiptModule { }
