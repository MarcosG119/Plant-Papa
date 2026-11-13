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
};

export default config;
