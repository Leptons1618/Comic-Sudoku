
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATASET_DIR = path.join(__dirname, '../tests/sudoku_dataset/images');
const TEST_COUNT = 10;

async function runTest() {
    // Get all jpg files
    const files = fs.readdirSync(DATASET_DIR).filter(f => f.endsWith('.jpg'));

    // Pick random files
    const testFiles = [];
    while (testFiles.length < TEST_COUNT && files.length > 0) {
        const idx = Math.floor(Math.random() * files.length);
        testFiles.push(files[idx]);
        files.splice(idx, 1);
    }

    console.log(`Running test on ${testFiles.length} images...`);

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Navigate to the app (assuming dev server is running)
    try {
        await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

        // Click Settings
        await page.waitForSelector('[data-testid="settings-btn"]');
        await page.click('[data-testid="settings-btn"]');

        // Click Test Scanner
        await page.waitForSelector('[data-testid="test-scanner-btn"]');
        await page.click('[data-testid="test-scanner-btn"]');

    } catch (e) {
        console.error("Failed to navigate to Test Page.", e);
        await browser.close();
        process.exit(1);
    }

    // Listen to browser console
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.error('PAGE ERROR:', err.toString()));

    // Wait for "OpenCV Loaded" status
    try {
        await page.waitForFunction(() => {
            const status = document.querySelector('span.font-mono');
            return status && status.innerText.includes('OpenCV Loaded');
        }, { timeout: 60000 }); // Increased to 60 seconds
    } catch (e) {
        console.error("OpenCV failed to load or timed out.");

        // Check what the status is
        const statusText = await page.evaluate(() => {
            const el = document.querySelector('span.font-mono');
            return el ? el.innerText : "Status element not found";
        });
        console.log("Current Status Text:", statusText);

        await browser.close();
        process.exit(1);
    }

    let passed = 0;
    let failed = 0;

    for (const file of testFiles) {
        const imagePath = path.join(DATASET_DIR, file);
        const datPath = path.join(DATASET_DIR, file.replace('.jpg', '.dat'));

        if (!fs.existsSync(datPath)) {
            console.warn(`No .dat file for ${file}, skipping.`);
            continue;
        }

        const datContent = fs.readFileSync(datPath, 'utf-8');
        const imageBuffer = fs.readFileSync(imagePath);
        const base64 = imageBuffer.toString('base64');

        console.log(`Testing ${file}...`);

        try {
            // Run extraction in browser
            const resultGrid = await page.evaluate(async (b64) => {
                if (!window.extractSudokuFromImageLocal) {
                    throw new Error("Function not exposed");
                }
                return await window.extractSudokuFromImageLocal(b64);
            }, base64);

            // Compare
            // Parse dat content: skip first 2 lines (metadata), then extract 9x9 grid
            const lines = datContent.split('\n').slice(2, 11); // Lines 3-11 contain the grid
            const expectedDigits = lines.join(' ').match(/\d/g)?.map(Number) || [];
            const actualDigits = resultGrid.flat();

            if (expectedDigits.length !== 81) {
                console.warn(`  Warning: .dat file has ${expectedDigits.length} digits, expected 81. Using first 81.`);
            }

            let matches = 0;
            let total = 81;

            for (let i = 0; i < 81; i++) {
                if (expectedDigits[i] === actualDigits[i]) matches++;
            }

            const accuracy = (matches / total) * 100;
            console.log(`  Accuracy: ${accuracy.toFixed(1)}% (${matches}/${total})`);

            if (accuracy > 80) passed++;
            else failed++;

        } catch (e) {
            console.error(`  Error processing ${file}: ${e.message}`);
            failed++;
        }
    }

    console.log(`\nTotal: ${passed + failed}, Passed: ${passed}, Failed: ${failed}`);
    await browser.close();
}

runTest();
