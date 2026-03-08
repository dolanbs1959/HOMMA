import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkMode = new BehaviorSubject<boolean>(false);
  private readonly THEME_KEY = 'homma-dark-mode';

  constructor() {
    this.initializeTheme();
  }

  // Observable for components to subscribe to theme changes
  get isDarkMode$() {
    return this.darkMode.asObservable();
  }

  // Get current theme state
  get isDarkMode(): boolean {
    return this.darkMode.value;
  }

  private initializeTheme() {
    // Always start with system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.setTheme(prefersDark);

    // Listen for system theme changes and apply them automatically
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      this.setTheme(e.matches);
    });
  }

  toggleTheme() {
    this.setTheme(!this.darkMode.value);
  }

  setTheme(isDark: boolean) {
    this.darkMode.next(isDark);

    // Don't save preference - always follow system
    // localStorage.setItem(this.THEME_KEY, isDark.toString());

    // Apply theme to document
    if (isDark) {
      document.body.classList.add('dark');
      // console.log('🌙 Dark mode enabled (following system preference)');
    } else {
      document.body.classList.remove('dark');
      // console.log('☀️ Light mode enabled (following system preference)');
    }
  }

  // Force light mode (if needed for specific components)
  forceLightMode() {
    this.setTheme(false);
  }

  // Force dark mode (if needed for specific components)
  forceDarkMode() {
    this.setTheme(true);
  }
}