import { Component, OnDestroy, Optional } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { Title } from '@angular/platform-browser';
import { ThemeService } from './services/theme.service';
import { UserService } from './services/user.service';
import { UpdateService } from './services/update.service';
import { Router, NavigationEnd, NavigationError } from '@angular/router';
import { filter, take } from 'rxjs/operators';
import { LoadingService } from './services/loading.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnDestroy {

  private _routerSub: any;

  constructor(
    private titleService: Title,
    private themeService: ThemeService,
    private userService: UserService,
    private router: Router,
    public loadingService: LoadingService,
    @Optional() private updates?: SwUpdate,
    private updateService?: UpdateService
  ) {
    this.titleService.setTitle('HOMMA');
    // show global spinner until first navigation completes
    this.loadingService.show();
    this._routerSub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd || e instanceof NavigationError),
      take(1)
    ).subscribe(() => this.loadingService.hide());
    // UpdateService instantiation ensures update checks, notifications, and activation logic
    try { if (this.updateService && (this.updateService as any).initOnAppLoad) (this.updateService as any).initOnAppLoad(); } catch (e) {}
  }

  ngOnDestroy(): void {
    if (this._routerSub && this._routerSub.unsubscribe) this._routerSub.unsubscribe();
  }
}


