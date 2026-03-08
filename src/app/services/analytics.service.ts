import { Injectable } from '@angular/core';
import { Analytics, logEvent, setUserId, setUserProperties } from '@angular/fire/analytics';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  constructor(
    private analytics: Analytics,
    private router: Router
  ) {
    this.initPageViewTracking();
  }

  // Automatically track page views on route changes
  private initPageViewTracking(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.logPageView(event.urlAfterRedirects);
      }
    });
  }

  // Log page views
  logPageView(page_path: string): void {
    logEvent(this.analytics, 'page_view', {
      page_path: page_path,
      page_title: document.title
    });
  }

  // Log custom events
  logEvent(eventName: string, eventParams?: { [key: string]: any }): void {
    logEvent(this.analytics, eventName, eventParams);
  }

  // Track button clicks
  trackButtonClick(buttonName: string, additionalData?: { [key: string]: any }): void {
    logEvent(this.analytics, 'button_click', {
      button_name: buttonName,
      ...additionalData
    });
  }

  // Track form submissions
  trackFormSubmit(formName: string, success: boolean): void {
    logEvent(this.analytics, 'form_submit', {
      form_name: formName,
      success: success
    });
  }

  // Track user actions
  trackUserAction(action: string, category: string, label?: string): void {
    logEvent(this.analytics, action, {
      category: category,
      label: label
    });
  }

  // Set user ID (for tracking logged-in users)
  setUser(userId: string): void {
    setUserId(this.analytics, userId);
  }

  // Set user properties (demographics, preferences, etc.)
  setUserProperty(propertyName: string, value: string): void {
    setUserProperties(this.analytics, { [propertyName]: value });
  }

  // Track errors
  trackError(errorMessage: string, errorType: string): void {
    logEvent(this.analytics, 'error', {
      error_message: errorMessage,
      error_type: errorType
    });
  }

  // Track search queries
  trackSearch(searchTerm: string, resultsCount: number): void {
    logEvent(this.analytics, 'search', {
      search_term: searchTerm,
      results_count: resultsCount
    });
  }
}
