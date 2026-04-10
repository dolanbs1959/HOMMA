import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { BehaviorSubject } from 'rxjs';

if (environment.production) {
  enableProdMode();
}

defineCustomElements(window);

// Development-only global interceptor: log every BehaviorSubject.next call
// This runs very early so it will capture publishes from any service instances.
try {
  if (!environment.production && typeof BehaviorSubject !== 'undefined') {
    try {
      const origNext = (BehaviorSubject.prototype as any).next;
      (BehaviorSubject.prototype as any).next = function (v: any) {
        try {
          const ctor = (this && this.constructor && this.constructor.name) ? this.constructor.name : 'BehaviorSubject';
          const stack = (new Error('GLOBAL_INTERCEPT')).stack || 'no-stack';
          try {
            // debug logging removed
          } catch (e) {}
        } catch (e) {}
        try { return origNext.call(this, v); } catch (e) { return origNext(v); }
      };
      // Global interceptor installed (logging disabled)
    } catch (e) { /* failed to install global interceptor (silenced) */ }
  }
} catch (e) {}

platformBrowserDynamic().bootstrapModule(AppModule)
.then(() => {
  if ('serviceWorker' in navigator && environment.production) {
    navigator.serviceWorker.register('/ngsw-worker.js');
  }
})  .catch(err => // console.log(err)
{});
