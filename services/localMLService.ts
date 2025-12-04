import { recognizeDigitsBatch, loadDigitModel } from './digitRecognitionService';
import { SudokuGrid } from '../types';

// Declare cv on window for TypeScript
declare global {
    interface Window {
        cv: any;
        extractSudokuFromImageLocal: any;
    }
}

/**
 * Loads OpenCV.js dynamically if not already loaded.
 */
export const loadOpenCV = async (): Promise<void> => {
    if (window.cv && window.cv.getBuildInformation) return;

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://docs.opencv.org/4.8.0/opencv.js';
        script.async = true;

        const timeout = setTimeout(() => {
            reject(new Error("OpenCV load timed out"));
        }, 10000); // 10s timeout

        script.onload = () => {
            // OpenCV.js has a runtime initialization
            if (window.cv.getBuildInformation) {
                clearTimeout(timeout);
                resolve();
            } else {
                // Wait for runtime to be ready
                window.cv['onRuntimeInitialized'] = () => {
                    clearTimeout(timeout);
                    resolve();
                };
            }
        };
        script.onerror = () => {
            clearTimeout(timeout);
            reject(new Error("Failed to load OpenCV.js"));
        }
        document.body.appendChild(script);
    });
};

/**
 * Extracts a Sudoku grid from a base64 image using local OCR (Tesseract.js) + OpenCV.
 */
/**
 * Extracts a Sudoku grid from a base64 image using local OCR (Tesseract.js) + OpenCV.
 */
export const extractSudokuFromImageLocal = async (
    base64Data: string,
    returnDebug: boolean = false
): Promise<{ grid: SudokuGrid, debugData?: any }> => {
    console.log("extractSudokuFromImageLocal called");
    try {
        await loadOpenCV(); // Ensure OpenCV is ready
        console.log("OpenCV loaded");
    } catch (e) {
        console.error("Failed to load OpenCV:", e);
        throw e;
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = async () => {
            try {
                console.log("Image loaded, processing board...");
                // 1. Detect and Warp Board
                // 1. Detect and Warp Board
                const processedCanvas = processBoardWithOpenCV(img);

                if (!processedCanvas) {
                    throw new Error("Could not detect Sudoku board. Please ensure the grid is clearly visible.");
                }

                console.log("Board processed, recognizing grid...");

                // 2. Slice and Recognize
                const grid = await recognizeGrid(processedCanvas);
                console.log("Grid recognized");

                let debugData = null;
                if (returnDebug) {
                    debugData = {
                        originalImage: base64Data,
                        warpedBoard: processedCanvas.toDataURL(),
                        extractedGrid: grid
                    };
                }

                resolve({ grid, debugData });
            } catch (err) {
                console.error("Error in extractSudokuFromImageLocal processing:", err);
                reject(err);
            }
        };
        img.onerror = (err) => {
            console.error("Failed to load image for processing:", err);
            reject(err);
        };
        img.src = `data:image/png;base64,${base64Data}`;
    });
};

// Expose for automation testing
if (typeof window !== 'undefined') {
    window.extractSudokuFromImageLocal = extractSudokuFromImageLocal;
}

/**
 * Helper to detect board corners in an image (for real-time overlay).
 * Returns array of 4 points {x,y} or null if no board found.
 */
export const detectBoardCorners = (imgElementOrCanvas: HTMLImageElement | HTMLCanvasElement): { x: number, y: number }[] | null => {
    if (!window.cv) return null;
    const cv = window.cv;

    let src;
    try {
        src = cv.imread(imgElementOrCanvas);
    } catch (e) {
        return null;
    }

    const dst = new cv.Mat();

    // Preprocess
    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
    cv.GaussianBlur(dst, dst, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
    cv.adaptiveThreshold(dst, dst, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);

    // Find Contours
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(dst, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let maxArea = 0;
    let maxContour = null;

    for (let i = 0; i < contours.size(); ++i) {
        const cnt = contours.get(i);
        const area = cv.contourArea(cnt);

        if (area < 1000) {
            cnt.delete();
            continue;
        }

        const peri = cv.arcLength(cnt, true);
        const approx = new cv.Mat();
        cv.approxPolyDP(cnt, approx, 0.02 * peri, true);

        if (approx.rows === 4 && area > maxArea) {
            maxArea = area;
            if (maxContour) maxContour.delete();
            maxContour = approx;
        } else {
            approx.delete();
            cnt.delete();
        }
    }

    let points = null;
    if (maxContour) {
        points = [];
        for (let i = 0; i < 4; i++) {
            points.push({
                x: maxContour.data32S[i * 2],
                y: maxContour.data32S[i * 2 + 1]
            });
        }
        maxContour.delete();
    }

    // Cleanup
    src.delete(); dst.delete(); contours.delete(); hierarchy.delete();

    return points;
};

/**
 * Uses OpenCV to find the largest square (the board) and warp it to a flat view.
 */
const processBoardWithOpenCV = (img: HTMLImageElement): HTMLCanvasElement | null => {
    const cv = window.cv;
    const src = cv.imread(img);

    // Configurations to try
    const configs = [
        { blur: 5, blockSize: 11, dilate: 3 }, // Standard with mild dilation
        { blur: 5, blockSize: 11, dilate: 5 }, // Stronger dilation
        { blur: 7, blockSize: 19, dilate: 5 }, // High-res / thick lines
        { blur: 5, blockSize: 5, dilate: 3 },  // Smaller block size
        { blur: 3, blockSize: 11, dilate: 1 }, // Less blur, minimal dilation
        { blur: 9, blockSize: 11, dilate: 3 }, // More blur
        { blur: 5, blockSize: 11, dilate: 0 }  // Original (no dilation)
    ];

    for (const config of configs) {
        const dst = new cv.Mat();
        try {
            // Preprocess
            cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
            cv.GaussianBlur(dst, dst, new cv.Size(config.blur, config.blur), 0, 0, cv.BORDER_DEFAULT);
            cv.adaptiveThreshold(dst, dst, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, config.blockSize, 2);

            // Dilate
            if (config.dilate > 0) {
                const kernel = cv.Mat.ones(config.dilate, config.dilate, cv.CV_8U);
                cv.dilate(dst, dst, kernel);
                kernel.delete();
            }

            // Find Contours
            const contours = new cv.MatVector();
            const hierarchy = new cv.Mat();
            cv.findContours(dst, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

            // Find largest quadrilateral
            let maxArea = 0;
            let maxContour = null;

            for (let i = 0; i < contours.size(); ++i) {
                const cnt = contours.get(i);
                const area = cv.contourArea(cnt);

                if (area < 1000) {
                    cnt.delete();
                    continue;
                }

                const peri = cv.arcLength(cnt, true);
                const approx = new cv.Mat();
                cv.approxPolyDP(cnt, approx, 0.02 * peri, true);

                if (approx.rows === 4 && area > maxArea) {
                    maxArea = area;
                    if (maxContour) maxContour.delete();
                    maxContour = approx;
                } else {
                    approx.delete();
                    cnt.delete();
                }
            }

            contours.delete();
            hierarchy.delete();

            if (maxContour) {
                console.log(`Board found with config: blur=${config.blur}, block=${config.blockSize}, dilate=${config.dilate}`);

                // Perspective Transform
                const points = [];
                for (let i = 0; i < 4; i++) {
                    points.push({
                        x: maxContour.data32S[i * 2],
                        y: maxContour.data32S[i * 2 + 1]
                    });
                }
                maxContour.delete();

                // Sort by Y to separate Top/Bottom
                points.sort((a, b) => a.y - b.y);
                const top = points.slice(0, 2).sort((a, b) => a.x - b.x);
                const bottom = points.slice(2, 4).sort((a, b) => a.x - b.x);

                const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
                    top[0].x, top[0].y,
                    top[1].x, top[1].y,
                    bottom[1].x, bottom[1].y,
                    bottom[0].x, bottom[0].y
                ]);

                const widthA = Math.hypot(bottom[1].x - bottom[0].x, bottom[1].y - bottom[0].y);
                const widthB = Math.hypot(top[1].x - top[0].x, top[1].y - top[0].y);
                const maxWidth = Math.max(widthA, widthB);

                const heightA = Math.hypot(top[0].x - bottom[0].x, top[0].y - bottom[0].y);
                const heightB = Math.hypot(top[1].x - bottom[1].x, top[1].y - bottom[1].y);
                const maxHeight = Math.max(heightA, heightB);

                const side = Math.max(maxWidth, maxHeight);

                const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
                    0, 0,
                    side, 0,
                    side, side,
                    0, side
                ]);

                const M = cv.getPerspectiveTransform(srcTri, dstTri);
                const warped = new cv.Mat();
                cv.warpPerspective(src, warped, M, new cv.Size(side, side), cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

                // Convert to Canvas
                const finalCanvas = document.createElement('canvas');
                cv.imshow(finalCanvas, warped);

                // Cleanup
                src.delete(); dst.delete(); srcTri.delete(); dstTri.delete(); M.delete(); warped.delete();

                return finalCanvas;
            }

            dst.delete();
        } catch (e) {
            console.error("Error in board detection attempt:", e);
            dst.delete();
        }
    }

    // If all attempts fail
    console.warn("No board detected after all attempts.");
    src.delete();
    return null;
};

const recognizeGrid = async (canvas: HTMLCanvasElement): Promise<SudokuGrid> => {
    console.log("Starting grid recognition with TensorFlow model...");
    const size = canvas.width; // It's square now
    const cellSize = size / 9;
    const grid: number[][] = Array(9).fill(null).map(() => Array(9).fill(0));

    try {
        console.log("Loading TensorFlow model...");
        await loadDigitModel();
        console.log("Model loaded. Processing cells...");

        // Collect all non-empty cell canvases
        const cellData: { r: number, c: number, canvas: HTMLCanvasElement }[] = [];

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const cellCanvas = document.createElement('canvas');
                cellCanvas.width = cellSize;
                cellCanvas.height = cellSize;
                const cellCtx = cellCanvas.getContext('2d');

                if (cellCtx) {
                    // Margin to remove grid lines
                    const margin = cellSize * 0.15;
                    cellCtx.drawImage(canvas,
                        c * cellSize + margin, r * cellSize + margin,
                        cellSize - 2 * margin, cellSize - 2 * margin,
                        0, 0, cellSize, cellSize
                    );

                    // Check if cell is empty
                    const cellImageData = cellCtx.getImageData(0, 0, cellSize, cellSize);
                    if (!isCellEmpty(cellImageData)) {
                        cellData.push({ r, c, canvas: cellCanvas });
                    }
                }
            }
        }

        console.log(`Found ${cellData.length} non-empty cells`);

        if (cellData.length > 0) {
            // Batch recognize all non-empty cells
            const canvases = cellData.map(d => d.canvas);
            const results = await recognizeDigitsBatch(canvases);

            // Fill in the grid
            results.forEach((result, idx) => {
                const { r, c } = cellData[idx];
                grid[r][c] = result.digit;
                console.log(`Cell [${r},${c}]: ${result.digit} (confidence: ${result.confidence.toFixed(2)})`);
            });
        }

    } catch (error) {
        console.error("Error in recognizeGrid:", error);
        throw error;
    }

    console.log("Grid recognition complete:", grid);
    return grid;
};

const isCellEmpty = (imageData: ImageData): boolean => {
    const data = imageData.data;
    let darkPixels = 0;
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if ((r + g + b) / 3 < 200) {
            darkPixels++;
        }
    }
    return (darkPixels / (data.length / 4)) < 0.05;
};
