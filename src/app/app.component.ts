import { Component, OnDestroy, Optional } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { Title } from '@angular/platform-browser';
import { ThemeService } from './services/theme.service';
import { UserService } from './services/user.service';
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
    @Optional() private updates?: SwUpdate
  ) {
    this.titleService.setTitle('HOMMA');
    // show global spinner until first navigation completes
    this.loadingService.show();
    this._routerSub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd || e instanceof NavigationError),
      take(1)
    ).subscribe(() => this.loadingService.hide());
    // Service worker update flow: prompt user when a new version is available
    try {
      // `updates` is injected only when service worker module is enabled
      if (this.updates && this.updates.isEnabled) {
        // Prefer the newer `versionUpdates` API if available (Angular v15+), fallback to `available`
        const updatesAny = this.updates as any;
        if (updatesAny.versionUpdates && updatesAny.versionUpdates.subscribe) {
          updatesAny.versionUpdates.subscribe((evt: any) => {
            try {
              // VERSION_READY indicates a new version is available and ready to activate
              if (evt && evt.type === 'VERSION_READY') {
                const ok = confirm('A new version of the app is available. Reload to update?');
                if (ok) {
                  this.updates!.activateUpdate().then(() => location.reload());
                }
              }
            } catch (inner) {}
          });
        } else if (updatesAny.available && updatesAny.available.subscribe) {
          updatesAny.available.subscribe(() => {
            const ok = confirm('A new version of the app is available. Reload to update?');
            if (ok) {
              this.updates!.activateUpdate().then(() => location.reload());
            }
          });
        }
      }
    } catch (e) {
      console.warn('SwUpdate check skipped', e);
    }
  }

  ngOnDestroy(): void {
    if (this._routerSub && this._routerSub.unsubscribe) this._routerSub.unsubscribe();
  }
}


