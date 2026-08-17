import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-participant-detail',
  templateUrl: './participant-detail.page.html',
  styleUrls: ['./participant-detail.page.scss'],
})
export class ParticipantDetailPage implements OnInit {
  id = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id') || '';
  }
}
