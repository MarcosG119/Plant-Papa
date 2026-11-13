import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Plant Papa',
  slug: 'plant-papa',
  version: '0.1.0',
  scheme: 'plantpapa',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'com.plantpapa.app',
    supportsTablet: true,
    icon: './assets/expo.icon',
  },
  android: {
    package: 'com.plantpapa.app',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-web-browser',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#208AEF',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Plant Papa uses your photos to identify your plants.',
        cameraPermission: 'Plant Papa uses your camera to identify your plants.',
        microphonePermission: false,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    // Firebase web-app identifiers — public by design, the same values the web
    // app commits in src/config/firebase.ts. Read by mobile/src/services/firebase.ts.
    firebase: {
      apiKey: 'AIzaSyDfUO83Q-7_pHvEretn2ZcuH0krfSI6XrA',
      authDomain: 'plant-papa.firebaseapp.com',
      projectId: 'plant-papa',
      storageBucket: 'plant-papa.appspot.com',
      messagingSenderId: '487304988103',
      appId: '1:487304988103:web:16de89072b2a5661b8c5e2',
    },
  },
};

export default config;
