# FPS Game — Expo mobile app

This native-app foundation lives beside the existing Vite prototype. It is intended to become an offline Android APK; the existing web prototype is not overwritten.

## Offline environment
The dense city GLB is bundled under `assets/` and Metro is configured to treat `.glb` as a bundled asset. Runtime city loading should not require internet access.

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

## Readiness status
This is a scaffold, not a finished or verified APK. The Three.js/Expo GLB loading path must be tested on a physical Android device, then movement, collision, camera controls, and performance safeguards need to be integrated and tested before release. Do not distribute it as release-ready until those checks pass.
