# Google Analytics 4 Setup Instructions

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Enter a project name (e.g., "HOMMA")
4. Accept the terms and click "Continue"
5. Enable Google Analytics (toggle ON)
6. Choose or create a Google Analytics account
7. Click "Create project"

## Step 2: Register Your Web App

1. In the Firebase Console, click the **Web icon** (</>) to add a web app
2. Give your app a nickname (e.g., "HOMMA Web App")
3. Check "Also set up Firebase Hosting" if you want (optional)
4. Click "Register app"

## Step 3: Get Your Firebase Configuration

After registering, you'll see a configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAbc123...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
  measurementId: "G-XXXXXXXXXX"
};
```

## Step 4: Update Your Environment Files

Copy the values from your Firebase config and replace the placeholders in:

### `src/environments/environment.ts` (for development)
### `src/environments/environment.prod.ts` (for production)

Replace these lines:
```typescript
firebase: {
  apiKey: 'YOUR_FIREBASE_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
  measurementId: 'G-XXXXXXXXXX'
}
```

With your actual Firebase config values.

## Step 5: Enable Google Analytics in Firebase

1. In Firebase Console, go to **Analytics** > **Dashboard**
2. Click "Enable Google Analytics"
3. Your GA4 property will be automatically created

## Step 6: Test Your Implementation

### Development Testing:
```bash
ng serve
```

Then open your browser console (F12) and go to the **Network** tab:
- Filter by "google-analytics.com" or "analytics"
- You should see tracking requests being sent

### View Real-Time Data:
1. Go to [Google Analytics](https://analytics.google.com/)
2. Select your property
3. Go to **Reports** > **Realtime**
4. Open your app and navigate around
5. You should see your visits in real-time!

## Step 7: Build and Deploy

After testing, build your production version:
```bash
npm run build
```

Then deploy to your hosting provider.

## Using the Analytics Service in Your Components

The AnalyticsService is already set up with automatic page view tracking. You can also track custom events:

```typescript
import { AnalyticsService } from './services/analytics.service';

constructor(private analytics: AnalyticsService) {}

// Track a button click
this.analytics.trackButtonClick('submit_form', { form_name: 'participant_review' });

// Track a custom event
this.analytics.logEvent('participant_added', { participant_id: '123' });

// Track form submission
this.analytics.trackFormSubmit('login_form', true);

// Set user ID after login
this.analytics.setUser('user_123');

// Track search
this.analytics.trackSearch('john doe', 5);
```

## What Data You'll See in GA4

Once set up, you'll get:
- **Real-time users** currently on your site
- **Page views** and most visited pages
- **User demographics** (age, gender, location)
- **Device types** (desktop, mobile, tablet)
- **Traffic sources** (direct, referral, search)
- **User engagement** (time on site, bounce rate)
- **Custom events** you track with the AnalyticsService
- **Conversion tracking** for goals you set up

## Important Notes

- ⚠️ **Keep your API keys secure** - Don't commit them to public repositories
- 📊 **Data may take 24-48 hours** to fully populate in GA4
- 🔒 **Consider GDPR/privacy** - Add a cookie consent banner if needed
- 🚀 **Analytics only works in production mode** or with `ng serve` (not on file://)

## Troubleshooting

If tracking doesn't work:
1. Check browser console for errors
2. Verify Firebase config values are correct
3. Make sure you're using https:// or http:// (not file://)
4. Check ad-blockers aren't blocking analytics
5. Look for requests to `google-analytics.com` in Network tab
