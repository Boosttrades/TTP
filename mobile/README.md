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

## Start an APK build from GitLab
The repository includes a GitLab CI job that runs an EAS Android preview build and produces an installable APK.

1. Open the [Expo access-token page](https://expo.dev/accounts/%40me/settings/access-tokens) while signed in to the Expo account that owns this project (or open your account settings and create an access token).
2. In GitLab, open **Settings → CI/CD → Variables** for this project.
3. Add a variable named `EXPO_TOKEN` with the token value. Mark it **Masked**; mark it **Protected** only if the `main` branch is protected and the job is allowed to access protected variables.
4. Open **Build → Pipelines** and retry/run the pipeline on `main`. The job runs `eas build --platform android --profile preview --non-interactive`.
5. Check the resulting build at [Expo Builds](https://expo.dev/). When it completes successfully, Expo provides the APK link.

Do not paste the access token into chat, source files, or commit history.

## Readiness status
This is a scaffold, not a finished or verified APK. The Three.js/Expo GLB loading path must be tested on a physical Android device, then movement, collision, camera controls, and performance safeguards need to be integrated and tested before release. Do not distribute it as release-ready until those checks pass.
