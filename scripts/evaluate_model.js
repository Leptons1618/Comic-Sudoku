import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_IMAGES_DIR = path.join(__dirname, '../public/test_images');
const REPORT_FILE = path.join(__dirname, '../evaluation_report.md');
const APP_URL = 'http://localhost:3000'; // Assuming dev server is running

async function loadDatFile(filename) {
    try {
        const datPath = path.join(TEST_IMAGES_DIR, filename.replace('.jpg', '.dat'));
        const content = await fs.readFile(datPath, 'utf-8');
        const lines = content.split('\n').slice(2, 11);
        const digits = lines.join(' ').match(/\d/g)?.map(Number) || [];

        if (digits.length !== 81) return null;

        const grid = [];
        for (let i = 0; i < 9; i++) {
            grid.push(digits.slice(i * 9, (i + 1) * 9));
        }
        return grid;
    } catch (e) {
        return null;
    }
}

async function runEvaluation() {
    console.log('Starting evaluation...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    try {
        console.log(`Navigating to ${APP_URL}...`);
        await page.goto(APP_URL, { waitUntil: 'networkidle0' });

        // Wait for app to hydrate
        await page.waitForSelector('#root');
        console.log('App loaded.');

        // Get test images
        const files = await fs.readdir(TEST_IMAGES_DIR);
        const imageFiles = files.filter(f => f.endsWith('.jpg')).sort();

        if (imageFiles.length === 0) {
            console.error('No test images found in public/test_images');
            return;
        }

        console.log(`Found ${imageFiles.length} test images.`);

        let report = `# Local Model Evaluation Report\n\nDate: ${new Date().toLocaleString()}\n\n`;
        report += `| Image | Status | Accuracy | Time (ms) | Notes |\n`;
        report += `|---|---|---|---|---|\n`;

        let totalAccuracy = 0;
        let successCount = 0;
        let totalTested = 0;

        for (const filename of imageFiles) {
            console.log(`Processing ${filename}...`);
            const expectedGrid = await loadDatFile(filename);

            if (!expectedGrid) {
                console.warn(`Skipping ${filename}: No valid .dat file`);
                continue;
            }

            totalTested++;

            // Read image as base64
            const imagePath = path.join(TEST_IMAGES_DIR, filename);
            const imageBuffer = await fs.readFile(imagePath);
            const base64Data = imageBuffer.toString('base64');

            const startTime = Date.now();
            let result;
            let error = null;

            try {
                // Execute in browser
                result = await page.evaluate(async (b64) => {
                    if (!window.extractSudokuFromImageLocal) throw new Error("Function not exposed");
                    return await window.extractSudokuFromImageLocal(b64, true);
                }, base64Data);
            } catch (e) {
                error = e.message;
            }
            const endTime = Date.now();
            const duration = endTime - startTime;

            if (error) {
                console.error(`Error processing ${filename}: ${error}`);
                report += `| ${filename} | ❌ Error | - | ${duration} | ${error} |\n`;
                continue;
            }

            // Calculate accuracy
            const extractedGrid = result.grid;
            let matches = 0;
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    if (extractedGrid[r][c] === expectedGrid[r][c]) {
                        matches++;
                    }
                }
            }
            const accuracy = (matches / 81) * 100;
            totalAccuracy += accuracy;
            if (accuracy === 100) successCount++;

            console.log(`  Accuracy: ${accuracy.toFixed(1)}% (${duration}ms)`);
            report += `| ${filename} | ${accuracy === 100 ? '✅ Perfect' : '⚠️ Partial'} | ${accuracy.toFixed(1)}% | ${duration} | Matches: ${matches}/81 |\n`;
        }

        const avgAccuracy = totalTested > 0 ? totalAccuracy / totalTested : 0;

        const summary = `\n## Summary\n\n- **Total Images Tested**: ${totalTested}\n- **Perfect Extractions**: ${successCount}\n- **Average Accuracy**: ${avgAccuracy.toFixed(1)}%\n`;

        report = summary + report;

        await fs.writeFile(REPORT_FILE, report);
        console.log(`Report generated at ${REPORT_FILE}`);

    } catch (error) {
        console.error('Evaluation failed:', error);
    } finally {
        await browser.close();
    }
}

runEvaluation();
