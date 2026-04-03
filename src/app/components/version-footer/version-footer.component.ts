import { Component, OnInit, OnDestroy } from '@angular/core';
import { VersionService } from 'src/app/services/version.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-version-footer',
  templateUrl: './version-footer.component.html',
  styleUrls: ['./version-footer.component.scss']
})
export class VersionFooterComponent implements OnInit, OnDestroy {
  version = '...';

  constructor(private vs: VersionService, private toastCtrl: ToastController) {}

  async ngOnInit() {
    try { this.version = await this.vs.getVersion(); } catch (e) { this.version = 'unknown'; }
    try { document && document.body && document.body.classList.add('has-version-footer'); } catch (e) {}
  }

  ngOnDestroy() {
    try { document && document.body && document.body.classList.remove('has-version-footer'); } catch (e) {}
  }

  async reportVersion() {
    const ver = this.version || await this.vs.getVersion();
    const info = `App version: ${ver}\nUserAgent: ${navigator.userAgent}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(info);
      } else {
        const ta = document.createElement('textarea');
        ta.value = info;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      const t = await this.toastCtrl.create({ message: 'Version copied to clipboard.', duration: 2000, position: 'bottom' });
      await t.present();
    } catch (e) {
      const t = await this.toastCtrl.create({ message: 'Could not copy version.', duration: 2000, position: 'bottom' });
      await t.present();
    }
  }
}
