# Comic Sudoku 🧩

A fun, comic-style Sudoku solver that runs entirely on your device!

![Comic Sudoku Banner](public/icon-192.png)

## Features

- **🎨 Hand-Drawn Aesthetic**: A unique, playful interface that feels like a comic book.
- **📸 Instant Camera Scanning**: Point your camera at any Sudoku puzzle to solve it instantly.
- **🔒 100% Offline & Private**: Uses a custom **TensorFlow.js** model to process images locally on your device. No data is ever sent to the cloud.
- **⚡ Fast & Accurate**: Powered by a CNN trained on 30,000+ real-world Sudoku cells.
- **📱 PWA Ready**: Install it as an app on your phone or desktop.

## How to Use

1.  **Scan**: Tap the camera icon and point at a puzzle.
2.  **Upload**: Or upload an image from your gallery.
3.  **Solve**: The app detects the grid, recognizes the numbers, and fills in the solution.
4.  **Play**: You can also play manually with hints and error checking!

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS
- **AI/ML**: TensorFlow.js, OpenCV.js
- **Build**: Vite

## Development

To run locally:

```bash
npm install
npm run dev
```

To build for production:

```bash
npm run build
```

## Credits

Built with ❤️ by the Comic Sudoku Team.
