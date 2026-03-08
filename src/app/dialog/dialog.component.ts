import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'dialog-component',
  template: `
    <div class="dialog-container">
      <h1>Call or Text?</h1>   
      <h2>How would you like to contact {{data.name}}</h2>
      <button mat-raised-button color="primary" (click)="call()">Call {{data.phoneNumber}}</button><br>
      <button mat-raised-button color="primary" (click)="text()">Text {{data.phoneNumber}}</button>
    </div>
  `,
  styles: [`
    .dialog-container {
      border: 3px solid #4194ab;
      padding: 20px;
      border-radius: 5px;
    }
    h1 {
      font-size: 1.5em;
      text-align: center;
      font-weight: bold;
      margin-top: 0;
      background-color: #4194ab;
      color: #fff;
    }
    h2 {
      font-size: 1.2em;
      margin-top: 0;
    }
    button {
      margin-top: 1em;
      font-size: 1.2em;
      width: 100%;
      padding: 10px;
      border-radius: 5px;
      color: #fff;
      background-color: #4194ab;
      border: none;
      cursor: pointer;
      text-align: center;
      transition: background-color 0.3s ease;
    }
    button:hover {
      background-color: #31707a;
    }
  `]
})
export class DialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {}

  call(): void {
    window.location.href = `tel:${this.data.phoneNumber}`;
    this.dialogRef.close();
  }

  text(): void {
    window.location.href = `sms:${this.data.phoneNumber}`;
    this.dialogRef.close();
  }

  ngOnInit() {}

}
