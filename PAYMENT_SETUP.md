# Payment Integration Setup

## Required Package Installation

To enable Flutterwave payment integration, you need to install the WebView package:

```bash
npm install react-native-webview
```

For Expo managed workflow:
```bash
expo install react-native-webview
```

## Backend API Endpoints Required

The following API endpoints need to be implemented on your backend:

### 1. Initialize Payment
```
POST /api/payments/initialize
```

### 2. Verify Payment
```
POST /api/payments/verify
```

### 3. Get Organization Subscription
```
GET /api/organization/subscription
```

### 4. Get Available Packages for Organization
```
GET /api/subscription-packages/available
```

## Flutterwave Configuration

1. Set up your Flutterwave account
2. Get your public and secret keys
3. Configure webhook URL in Flutterwave dashboard
4. Set redirect URLs for success/failure

## Flow Summary

1. Organization admin logs in
2. System checks for active subscription
3. If no subscription, redirect to SubscriptionSelectionScreen
4. User selects package and duration
5. Payment is initialized with Flutterwave
6. User completes payment in WebView
7. System verifies payment and creates subscription
8. User is redirected to AdminDashboard

## Files Created/Modified

- SubscriptionSelectionScreen.js (new)
- PaymentVerificationScreen.js (new)
- LoginScreen.js (modified - added subscription check)
- App.js (modified - added new screens)
- api.js (modified - added payment methods)