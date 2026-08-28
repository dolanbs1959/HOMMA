import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-coming-soon',
  templateUrl: './coming-soon.page.html',
  styleUrls: ['./coming-soon.page.scss'],
})
export class ComingSoonPage implements OnInit {
  featureTitle = 'Job Board';
  message = 'A new feature is being developed to display open jobs, job details, and a way to apply. Check back soon.';

  constructor(private router: Router) {}

  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state as { title?: string; message?: string } | undefined;
    if (state?.title) {
      this.featureTitle = state.title;
    }
    if (state?.message) {
      this.message = state.message;
    }
  }
}
