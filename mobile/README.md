# FPS Game — Expo mobile app

This is the native-app foundation, kept alongside the existing Vite prototype. It is intended to become an offline Android APK; the existing web prototype is not overwritten.

## Offline environment
The dense city GLB is bundled under `assets/`, so it can be packaged with the app rather than downloaded at runtime.

## Local development
From this directory:
```sh
npm install
npx expo start
```

## APK build
Install/configure EAS CLI and authenticate with an Expo account, then run:
```sh
npx eas build --platform android --profile preview
```
The preview profile is configured to produce an installable APK.

## Important
This is an initial rendering scaffold, not a finished game. It still needs on-device validation and integration of movement, collision, camera controls, and performance safeguards before it should be described as release-ready. The GLB loader integration must be verified against the installed Expo/Three.js package versions.
