# Data Capturing App - Mobile Authentication

A responsive React Native authentication app with three screens: Splash, Login, and Sign Up.

## Features

- **Splash Screen**: Animated DC logo with auto-transition
- **Login Screen**: Full name and password authentication
- **Sign Up Screen**: Complete registration with password validation
- **Cross-platform**: Works on iOS and Android
- **Responsive**: Adapts to all mobile screen sizes

## Tech Stack

- React Native with Expo
- React Navigation for screen transitions
- Expo Vector Icons for UI elements
- Animated API for splash screen effects

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on device:
- **iOS**: `npm run ios` or scan QR code with Camera app
- **Android**: `npm run android` or scan QR code with Expo Go app

## Project Structure

```
DataCapturingApp/
├── screens/
│   ├── SplashScreen.js    # Animated splash with DC logo
│   ├── LoginScreen.js     # Login form with validation
│   └── SignUpScreen.js    # Registration with password matching
├── App.js                 # Navigation setup
└── package.json          # Dependencies
```

## Design Specifications

- **Primary Color**: #7B2CBF (Deep Purple)
- **Background**: #FFFFFF (White)
- **Input Borders**: #E0E0E0 (Light Gray)
- **Typography**: System fonts (SF Pro/Roboto)
- **Border Radius**: 10px for inputs and buttons

## Key Features

### Splash Screen
- 3-second animated DC logo with blinking effect
- Smooth fade transition to login screen
- Full-screen purple background

### Login Screen
- Full name and password inputs
- Password visibility toggle with eye icon
- "Forgot Password?" link
- Navigation to Sign Up screen

### Sign Up Screen
- Complete registration form (name, email, password, confirm password)
- Real-time password matching validation
- Error messages for password mismatch
- Navigation back to Login screen

### Responsive Design
- Keyboard-aware scrolling
- Touch-outside-to-dismiss keyboard
- Proper input types (email keyboard for email field)
- Safe area handling for different device sizes

## Running the App

The app will start with the splash screen, automatically transition to login after 3 seconds, and allow navigation between login and sign up screens.