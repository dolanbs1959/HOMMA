import { Injectable, Optional } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { ToastController } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class UpdateService {
  private readonly PROMPTED_SESSION_KEY = 'HOMMA__SW_UPDATE_PROMPTED_VERSION';
  private pendingVersion: VersionReadyEvent['latestVersion'] | null = null;
  private inputActive = false;

  constructor(
    @Optional() private updates: SwUpdate,
    private toastCtrl?: ToastController,
  ) {
    if (this.updates?.isEnabled) {
      this.updates.versionUpdates.subscribe(event => {
        if (event.type === 'VERSION_READY') {
          this.onVersionReady(event.latestVersion);
        }
      });

      try {
        document.addEventListener('focusin', () => this.checkInputFocus());
        document.addEventListener('focusout', () => this.checkInputFocus());
        this.checkInputFocus();
      } catch (e) {}
    }
  }

  async initOnAppLoad(): Promise<void> {
    await this.checkForUpdate();
  }

  async initOnLogin(): Promise<void> {
    await this.checkForUpdate();
  }

  async checkForUpdate(): Promise<void> {
    try {
      if (this.updates?.isEnabled) {
        await this.updates.checkForUpdate();
      }
    } catch (e) {}
  }

  private onVersionReady(latestVersion: VersionReadyEvent['latestVersion']): void {
    this.promptForUpdate(latestVersion);
  }

  private checkInputFocus(): void {
    const el = document.activeElement;
    const isInput = !!el && (
      el.tagName === 'INPUT' ||
      el.tagName === 'TEXTAREA' ||
      el.tagName === 'SELECT' ||
      el.getAttribute('contenteditable') === 'true' ||
      !!(el as HTMLElement).closest('ion-input, ion-textarea, ion-select')
    );

    this.inputActive = isInput;

    if (!this.inputActive && this.pendingVersion) {
      const version = this.pendingVersion;
      this.pendingVersion = null;
      this.presentUpdateToast(version);
    }
  }

  private versionLabel(latestVersion: VersionReadyEvent['latestVersion']): string {
    return (latestVersion?.appData as any)?.version || latestVersion?.hash || 'new';
  }

  private async promptForUpdate(latestVersion: VersionReadyEvent['latestVersion']): Promise<void> {
    const version = this.versionLabel(latestVersion);

    try {
      if (sessionStorage.getItem(this.PROMPTED_SESSION_KEY) === version) {
        return;
      }
    } catch (e) {}

    if (this.inputActive) {
      this.pendingVersion = latestVersion;
      return;
    }

    await this.presentUpdateToast(latestVersion);
  }

  private async presentUpdateToast(latestVersion: VersionReadyEvent['latestVersion']): Promise<void> {
    const version = this.versionLabel(latestVersion);

    try {
      sessionStorage.setItem(this.PROMPTED_SESSION_KEY, version);
    } catch (e) {}

    if (!this.toastCtrl) {
      return;
    }

    const toast = await this.toastCtrl.create({
      message: 'A new version of HOMMA is available.',
      position: 'bottom',
      duration: 0,
      buttons: [
        {
          text: 'Later',
          role: 'cancel',
          handler: () => {
            this.pendingVersion = null;
          }
        },
        {
          text: 'Update Now',
          handler: () => {
            this.pendingVersion = null;
            this.activateAndReload();
            return false;
          }
        }
      ]
    });

    await toast.present();
  }

  private async activateAndReload(): Promise<void> {
    try {
      if (this.updates?.isEnabled) {
        await this.updates.activateUpdate();
      }
    } catch (e) {}

    try {
      window.location.reload();
    } catch (e) {}
  }
}
