import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-placeholder',
  templateUrl: './placeholder.page.html',
  styleUrls: ['./placeholder.page.scss'],
})
export class PlaceholderPage implements OnInit {
  title = 'Page';

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.title = this.route.parent?.snapshot.data['title'] || 'Page';
  }
}
