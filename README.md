# Comic Sudoku Solver

**Comic Sudoku Solver** is a fun, doodle-themed web and mobile application that lets you solve, play, and generate Sudoku puzzles. It features a unique "hand-drawn" aesthetic and powerful AI capabilities to scan and solve puzzles instantly.

## 🌟 Features

*   **Scan Mode**:
    *   **In-App Camera**: Real-time board detection using OpenCV.js. Automatically finds and crops the board.
    *   **Image Upload**: Upload screenshots or photos from your gallery.
    *   **Dual AI Engines**:
        *   **Local ML**: Runs entirely on-device using Tesseract.js and OpenCV (Offline, Privacy-focused).
        *   **Cloud AI**: Uses Google Gemini API for high-accuracy recognition (Requires API Key).
*   **Edit Mode**: Manually input numbers from a newspaper or book to solve them.
*   **Play Mode**: Generate endless Sudoku puzzles (4x4 Mini or 9x9 Standard) with varying difficulty.
*   **Comic Aesthetic**: Custom hand-drawn UI components, icons, and fonts (`Patrick Hand`).
*   **Mobile Ready**: Built with Capacitor for native Android deployment.

## Tech Stack

*   **Frontend**: React, TypeScript, Vite
*   **Styling**: Tailwind CSS
*   **Computer Vision**: OpenCV.js (Wasm)
*   **OCR / ML**: Tesseract.js (Local), Google Gemini API (Cloud)
*   **Mobile Runtime**: Capacitor (Android)
*   **State Management**: React Hooks

## Project Structure

```
/
├── android/             # Native Android project files (Capacitor)
├── src/
│   ├── components/      # React UI components (Board, Camera, Modals, etc.)
│   ├── services/        # Business logic & External services
│   │   ├── audioService.ts    # Sound effects
│   │   ├── geminiService.ts   # Google Gemini API integration
│   │   ├── localMLService.ts  # OpenCV & Tesseract logic
│   │   └── sudokuLogic.ts     # Sudoku solving & generation algorithms
│   ├── App.tsx          # Main application entry & routing
│   └── index.css        # Global styles & Tailwind directives
├── public/              # Static assets
└── capacitor.config.ts  # Capacitor configuration
```

## Getting Started

### Prerequisites
*   Node.js (v18+)
*   npm

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/comic-sudoku.git
    cd comic-sudoku
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```
    Open `http://localhost:5173` in your browser.

## Building for Android

This project uses **Capacitor** to build a native Android app.

### Prerequisites
*   **Android Studio**: Download and install [Android Studio](https://developer.android.com/studio).
*   **Java Development Kit (JDK)**: Usually included with Android Studio.

### Build Steps

1.  **Build the Web App**:
    ```bash
    npm run build
    ```

2.  **Sync with Android**:
    Copy the built web assets to the native Android project:
    ```bash
    npx cap sync
    ```

3.  **Open in Android Studio**:
    ```bash
    npx cap open android
    ```

4.  **Run/Build**:
    In Android Studio, wait for Gradle sync to finish, then click the **Run** button (green play icon) to deploy to an emulator or connected device.

### Cloud Build (GitHub Actions)

If you don't have Android Studio, you can use the included GitHub Actions workflow to build the APK automatically:
1.  Push your code to GitHub.
2.  Go to the **Actions** tab.
3.  Wait for the "Build Android APK" workflow to complete.
4.  Download the `app-debug.apk` from the **Artifacts** section.

## Configuration

*   **Gemini API**: To use the Cloud AI feature, get an API key from [Google AI Studio](https://aistudio.google.com/) and enter it in the App Settings.
*   **Local ML**: Enabled by default in Settings. Requires an initial internet connection to download `opencv.js` and Tesseract language data, then works offline.

---

*Built with ❤️ and fun by Anish*
