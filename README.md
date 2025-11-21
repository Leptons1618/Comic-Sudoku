<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1lMCMwqY5ypFRS6zRZv_oddur1sMQmZ8W

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Build for Android

To build this application for Android, we use [Capacitor](https://capacitorjs.com/). Follow these steps:

### Prerequisites
- **Android Studio**: Download and install [Android Studio](https://developer.android.com/studio).
- **Java Development Kit (JDK)**: Ensure you have a compatible JDK installed (usually included with Android Studio).

### Step-by-Step Guide

1. **Install Capacitor Dependencies**
   Install the necessary Capacitor packages:
   ```bash
   npm install @capacitor/core
   npm install -D @capacitor/cli @capacitor/android
   ```

2. **Initialize Capacitor**
   Initialize the Capacitor config. This sets up the project structure.
   ```bash
   npx cap init "Comic Sudoku Solver" com.comicsudoku.app --web-dir dist
   ```

3. **Add Android Platform**
   Add the Android platform to your project:
   ```bash
   npx cap add android
   ```

4. **Build the Web App**
   Compile your React application into the `dist` folder:
   ```bash
   npm run build
   ```

5. **Sync with Android**
   Copy the built web assets to the Android project:
   ```bash
   npx cap sync
   ```

6. **Open in Android Studio**
   Open the native Android project in Android Studio:
   ```bash
   npx cap open android
   ```

7. **Run the App**
   - In Android Studio, wait for Gradle sync to finish.
   - Connect an Android device or create an Emulator (AVD).
   - Click the **Run** button (green play icon) to build and install the app on your device/emulator.

   - Click the **Run** button (green play icon) to build and install the app on your device/emulator.

## Build APK without Android Studio (Cloud Build)

If you don't have Android Studio installed, the easiest way to build the APK is using **GitHub Actions**. We have set up a workflow that automatically builds the APK for you in the cloud.

1. **Push to GitHub**
   Push your code to a GitHub repository.

2. **Wait for Build**
   Go to the **Actions** tab in your GitHub repository. You will see a workflow named "Build Android APK" running.

3. **Download APK**
   Once the workflow completes (green checkmark):
   - Click on the workflow run.
   - Scroll down to the **Artifacts** section.
   - Click on **app-debug** to download the zip file.
   - Extract the zip to find `app-debug.apk`.

4. **Install on Device**
   Transfer the file to your Android phone and install it.

## Build APK Locally (Advanced)
If you have the Android SDK installed and want to build locally via command line:

1. **Configure SDK Location**
   Create `android/local.properties` and add: `sdk.dir=C:\\Path\\To\\Android\\Sdk`

2. **Build**
   ```bash
   cd android
   ./gradlew assembleDebug
   ```

3. **Locate APK**
   `android/app/build/outputs/apk/debug/app-debug.apk`

### Updating the App

### Updating the App
Whenever you make changes to your React code:
1. Rebuild the web app: `npm run build`
2. Sync changes: `npx cap sync`
3. Rebuild the APK: `cd android && ./gradlew assembleDebug`
