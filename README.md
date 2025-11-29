# Comic Sudoku

**Comic Sudoku** is a fun, doodle-themed web and mobile application that lets you solve, play, and generate Sudoku puzzles with a unique hand-drawn aesthetic and powerful AI capabilities.

[![GitHub](https://img.shields.io/badge/GitHub-Leptons1618%2FComic--Sudoku-blue?logo=github)](https://github.com/Leptons1618/Comic-Sudoku)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## ✨ Features

### 📸 Scan Mode
- **In-App Camera**: Real-time Sudoku scanning with a clean, simple interface
- **Image Upload**: Upload screenshots or photos from your gallery
- **Dual AI Engines**:
  - **Local ML**: Runs entirely on-device using OpenCV.js + Tesseract.js (Offline, Privacy-focused)
  - **Cloud AI**: Uses Google Gemini API for enhanced accuracy (Requires API Key)
- **Manual Editing**: Click any cell to manually edit numbers before solving

### 🎮 Play Mode
- Generate endless Sudoku puzzles (4x4 Mini or 9x9 Standard)
- Three difficulty levels: Easy, Medium, Hard
- Hint system to help when stuck
- Check feature to validate your progress
- Track your game with difficulty indicators

### 🎨 Comic Aesthetic
- Custom hand-drawn UI components and icons
- Doodle-themed design with vibrant colors
- Patrick Hand font for authentic comic feel
- Smooth animations and transitions

### 🔧 Advanced Features
- **Sound Effects**: Toggle-able audio feedback
- **Debug Visualization**: View processed images and grid detection (for developers)
- **Offline Support**: Local ML mode works completely offline
- **Mobile Ready**: Built with Capacitor for native Android deployment

## 🤖 Model & Technology

### Digit Recognition Model
Comic Sudoku uses a custom-trained **Convolutional Neural Network (CNN)** for handwritten digit recognition:

- **Architecture**: 3 Convolutional Blocks with Batch Normalization
- **Layers**: MaxPooling, Dropout, and Dense layers for robustness
- **Input**: 28x28 grayscale images
- **Output**: 10 classes (digits 0-9)
- **Framework**: TensorFlow.js for browser inference
- **Training**: Custom dataset optimized for Sudoku digits

### Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with custom doodle theme
- **Computer Vision**: OpenCV.js (WebAssembly)
- **OCR**: Tesseract.js (Local), Google Gemini API (Cloud)
- **ML**: TensorFlow.js for digit recognition
- **Mobile**: Capacitor for Android deployment
- **State Management**: React Hooks

## 📁 Project Structure

```
/
├── android/              # Native Android project (Capacitor)
├── components/           # React UI components
│   ├── CameraScanner.tsx # Camera interface
│   ├── SudokuBoard.tsx   # Game board
│   ├── HelpModal.tsx     # Multi-page help
│   └── ...
├── services/             # Business logic
│   ├── audioService.ts   # Sound effects
│   ├── geminiService.ts  # Gemini API integration
│   ├── localMLService.ts # OpenCV + Tesseract
│   └── sudokuLogic.ts    # Solving & generation
├── public/
│   └── models/           # TensorFlow.js model files
├── scripts/train/        # Model training scripts
└── App.tsx               # Main application
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Leptons1618/Comic-Sudoku.git
   cd Comic-Sudoku
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

## 📱 Building for Android

### Prerequisites
- **Android Studio**: [Download here](https://developer.android.com/studio)
- **Java Development Kit (JDK)**: Usually included with Android Studio

### Build Steps

1. **Build the Web App**:
   ```bash
   npm run build
   ```

2. **Sync with Android**:
   ```bash
   npx cap sync
   ```

3. **Open in Android Studio**:
   ```bash
   npx cap open android
   ```

4. **Run/Build**:
   In Android Studio, wait for Gradle sync, then click **Run** (green play icon).

### Cloud Build (GitHub Actions)

The project includes a GitHub Actions workflow for automated APK builds:
1. Push your code to GitHub
2. Go to the **Actions** tab
3. Wait for the "Build Android APK" workflow to complete
4. Download the `app-debug.apk` from **Artifacts**

## ⚙️ Configuration

### Gemini API (Cloud Mode)
1. Get an API key from [Google AI Studio](https://aistudio.google.com/)
2. Open the app and go to **Settings**
3. Toggle **Enable Gemini Cloud AI**
4. Enter your API key and save

### Local ML Mode
- Enabled by default in Settings
- Requires initial internet connection to download OpenCV.js and Tesseract data
- Works completely offline after initial setup

### Debug Visualization
- Enable in **Settings** → **Debug Visualization**
- Shows processed images and grid detection after scanning
- Useful for developers and debugging

## 🎯 How to Use

### Scan Mode
1. Click **Camera** or **Upload** button
2. Point at a Sudoku puzzle or select an image
3. The AI will detect and fill the board
4. Click any cell to manually edit if needed
5. Click **Solve Puzzle** to get the solution

### Play Mode
1. Click **Config** to choose grid size and difficulty
2. Select Easy, Medium, or Hard
3. Use **Hint** to fill a random cell
4. Use **Check** to validate your progress
5. Click **Give Up** to reveal the solution

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Developer

**Developed by [Leptons1618](https://github.com/Leptons1618)**

- 🌐 [GitHub Profile](https://github.com/Leptons1618)
- 📦 [Project Repository](https://github.com/Leptons1618/Comic-Sudoku)
- 🐛 [Report Issues](https://github.com/Leptons1618/Comic-Sudoku/issues)
- ❤️ [Sponsor](https://github.com/sponsors/Leptons1618)

## 🙏 Acknowledgments

- Google Gemini API for cloud-based OCR
- OpenCV.js for computer vision
- Tesseract.js for local OCR
- TensorFlow.js for ML inference
- The open-source community

---

**Built with React, TypeScript, TensorFlow.js & ❤️**

*Version 1.3.0*
