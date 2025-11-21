import Tesseract from 'tesseract.js';
import { SudokuGrid } from '../types';

// Declare cv on window for TypeScript
declare global {
    interface Window {
        cv: any;
    }
}

/**
 * Loads OpenCV.js dynamically if not already loaded.
 */
export const loadOpenCV = async (): Promise<void> => {
    if (window.cv) return;

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://docs.opencv.org/4.8.0/opencv.js';
        script.async = true;
        script.onload = () => {
            // OpenCV.js has a runtime initialization
            if (window.cv.getBuildInformation) {
                resolve();
            } else {
                // Wait for runtime to be ready
                window.cv['onRuntimeInitialized'] = () => {
                    resolve();
                };
            }
        };
        script.onerror = () => reject(new Error("Failed to load OpenCV.js"));
        document.body.appendChild(script);
    });
};

/**
 * Extracts a Sudoku grid from a base64 image using local OCR (Tesseract.js) + OpenCV.
 */
export const extractSudokuFromImageLocal = async (base64Data: string): Promise<SudokuGrid> => {
    await loadOpenCV(); // Ensure OpenCV is ready

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = async () => {
            try {
                // 1. Detect and Warp Board
                const processedCanvas = processBoardWithOpenCV(img);

                // 2. Slice and Recognize
                const grid = await recognizeGrid(processedCanvas);

                resolve(grid);
            } catch (err) {
                reject(err);
            }
        };
        img.onerror = (err) => reject(err);
        img.src = `data:image/png;base64,${base64Data}`;
    });
};

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
const processBoardWithOpenCV = (img: HTMLImageElement): HTMLCanvasElement => {
    const cv = window.cv;

    // Read image
    const src = cv.imread(img);
    const dst = new cv.Mat();

    // Preprocess
    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
    cv.GaussianBlur(dst, dst, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
    cv.adaptiveThreshold(dst, dst, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);

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
            maxContour = approx; // Keep this Mat
        } else {
            approx.delete();
            cnt.delete();
        }
    }

    // If no board found, just use original image (fallback)
    if (!maxContour) {
        console.warn("No board detected, using full image.");
        src.delete(); dst.delete(); contours.delete(); hierarchy.delete();

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        return canvas;
    }

    // Perspective Transform
    const points = [];
    for (let i = 0; i < 4; i++) {
        points.push({
            x: maxContour.data32S[i * 2],
            y: maxContour.data32S[i * 2 + 1]
        });
    }

    // Sort by Y to separate Top/Bottom
    points.sort((a, b) => a.y - b.y);
    const top = points.slice(0, 2).sort((a, b) => a.x - b.x); // TL, TR
    const bottom = points.slice(2, 4).sort((a, b) => a.x - b.x); // BL, BR

    const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
        top[0].x, top[0].y,      // TL
        top[1].x, top[1].y,      // TR
        bottom[1].x, bottom[1].y,// BR
        bottom[0].x, bottom[0].y // BL
    ]);

    // Calculate dimensions
    const widthA = Math.hypot(bottom[1].x - bottom[0].x, bottom[1].y - bottom[0].y);
    const widthB = Math.hypot(top[1].x - top[0].x, top[1].y - top[0].y);
    const maxWidth = Math.max(widthA, widthB);

    const heightA = Math.hypot(top[0].x - bottom[0].x, top[0].y - bottom[0].y);
    const heightB = Math.hypot(top[1].x - bottom[1].x, top[1].y - bottom[1].y);
    const maxHeight = Math.max(heightA, heightB);

    // Force square for Sudoku
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
    src.delete(); dst.delete(); contours.delete(); hierarchy.delete();
    maxContour.delete(); srcTri.delete(); dstTri.delete(); M.delete(); warped.delete();

    return finalCanvas;
};

const recognizeGrid = async (canvas: HTMLCanvasElement): Promise<SudokuGrid> => {
    const size = canvas.width; // It's square now
    const cellSize = size / 9;
    const grid: number[][] = Array(9).fill(null).map(() => Array(9).fill(0));
    const promises: Promise<void>[] = [];

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

                // Check empty
                const cellData = cellCtx.getImageData(0, 0, cellSize, cellSize);
                if (isCellEmpty(cellData)) {
                    grid[r][c] = 0;
                    continue;
                }

                // Recognize
                const p = Tesseract.recognize(
                    cellCanvas.toDataURL(),
                    'eng',
                    {
                        logger: () => { },
                        errorHandler: () => { }
                    }
                ).then(({ data: { text } }) => {
                    const clean = text.replace(/[^1-9]/g, '');
                    const digit = parseInt(clean.charAt(0));
                    grid[r][c] = isNaN(digit) ? 0 : digit;
                }).catch(() => {
                    grid[r][c] = 0;
                });

                promises.push(p);
            }
        }
    }

    await Promise.all(promises);
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
