"use client";

import React, { useState, useEffect } from 'react';
import { extractSudokuFromImageLocal, loadOpenCV } from '../services/localMLService';
import { SudokuGrid } from '../types';

interface TestResult {
    filename: string;
    status: 'pending' | 'processing' | 'success' | 'error';
    accuracy?: number;
    matches?: number;
    total?: number;
    extractedGrid?: SudokuGrid;
    expectedGrid?: SudokuGrid;
    error?: string;
    processingTime?: number;
}

export default function TestScannerPage() {
    const [opencvReady, setOpencvReady] = useState(false);
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [currentTest, setCurrentTest] = useState<number>(-1);
    const [processing, setProcessing] = useState(false);
    const [batchSize, setBatchSize] = useState(10);
    const [availableImages, setAvailableImages] = useState<string[]>([]);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);

    useEffect(() => {
        loadOpenCV()
            .then(() => setOpencvReady(true))
            .catch(err => console.error("OpenCV Error:", err));

        // Dynamically discover available test images
        discoverTestImages();
    }, []);

    const discoverTestImages = async () => {
        try {
            // Fetch the list of images from the test_images directory
            // We'll try to load a known set and filter what exists
            const potentialImages = Array.from({ length: 100 }, (_, i) => `image${i + 1}.jpg`)
                .concat(Array.from({ length: 100 }, (_, i) => `image${100 + i}.jpg`))
                .concat(Array.from({ length: 100 }, (_, i) => `image${1000 + i}.jpg`));

            const existing: string[] = [];

            // Check which images actually exist (in batches to avoid too many requests)
            for (const img of potentialImages.slice(0, 200)) {
                try {
                    const response = await fetch(`/test_images/${img}`, { method: 'HEAD' });
                    if (response.ok) {
                        existing.push(img);
                    }
                } catch {
                    // Image doesn't exist, skip
                }

                // Stop after finding 60 images
                if (existing.length >= 60) break;
            }

            setAvailableImages(existing);
            console.log(`Found ${existing.length} test images`);
        } catch (error) {
            console.error('Error discovering test images:', error);
            // Fallback to known images
            setAvailableImages([
                'image1.jpg', 'image2.jpg', 'image10.jpg', 'image11.jpg', 'image13.jpg',
                'image16.jpg', 'image17.jpg', 'image18.jpg', 'image100.jpg', 'image101.jpg'
            ]);
        }
    };

    const loadDatFile = async (filename: string): Promise<SudokuGrid | null> => {
        try {
            const datFile = filename.replace('.jpg', '.dat');
            const response = await fetch(`/test_images/${datFile}`);
            if (!response.ok) return null;

            const content = await response.text();
            const lines = content.split('\n').slice(2, 11);
            const digits = lines.join(' ').match(/\d/g)?.map(Number) || [];

            if (digits.length !== 81) {
                console.warn(`Invalid .dat file for ${filename}: ${digits.length} digits`);
                return null;
            }

            const grid: SudokuGrid = [];
            for (let i = 0; i < 9; i++) {
                grid.push(digits.slice(i * 9, (i + 1) * 9));
            }
            return grid;
        } catch (error) {
            console.error(`Error loading .dat file for ${filename}:`, error);
            return null;
        }
    };

    const runBatchTest = async () => {
        if (availableImages.length === 0) {
            alert('No test images found. Please ensure images are in public/test_images/');
            return;
        }

        setProcessing(true);
        const testCount = Math.min(batchSize, availableImages.length);
        const selectedImages = availableImages.slice(0, testCount);

        setTestResults(selectedImages.map(f => ({ filename: f, status: 'pending' as const })));
        setCurrentTest(0);

        for (let i = 0; i < selectedImages.length; i++) {
            setCurrentTest(i);
            const filename = selectedImages[i];

            setTestResults(prev => prev.map((r, idx) =>
                idx === i ? { ...r, status: 'processing' as const } : r
            ));

            try {
                const startTime = performance.now();

                // Load image
                const img = new Image();
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = `/test_images/${filename}`;
                    img.crossOrigin = 'anonymous';
                });

                // Convert to base64
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error("Canvas context failed");

                ctx.drawImage(img, 0, 0);
                const base64 = canvas.toDataURL('image/png').split(',')[1];

                // Extract grid
                const { grid: extractedGrid } = await extractSudokuFromImageLocal(base64);
                const expectedGrid = await loadDatFile(filename);

                const endTime = performance.now();
                const processingTime = Math.round(endTime - startTime);

                // Calculate accuracy
                let matches = 0;
                if (expectedGrid) {
                    for (let r = 0; r < 9; r++) {
                        for (let c = 0; c < 9; c++) {
                            if (extractedGrid[r][c] === expectedGrid[r][c]) {
                                matches++;
                            }
                        }
                    }
                }

                const accuracy = expectedGrid ? (matches / 81) * 100 : 0;

                setTestResults(prev => prev.map((r, idx) =>
                    idx === i ? {
                        ...r,
                        status: 'success' as const,
                        accuracy,
                        matches,
                        total: 81,
                        extractedGrid,
                        expectedGrid: expectedGrid || undefined,
                        processingTime
                    } : r
                ));
            } catch (error: any) {
                setTestResults(prev => prev.map((r, idx) =>
                    idx === i ? {
                        ...r,
                        status: 'error' as const,
                        error: error.message
                    } : r
                ));
            }
        }

        setProcessing(false);
        setCurrentTest(-1);
    };

    const renderGrid = (grid: SudokuGrid, expectedGrid?: SudokuGrid) => {
        return (
            <div className="grid grid-cols-9 gap-0 border-2 border-black w-fit">
                {grid.map((row, r) => (
                    row.map((cell, c) => {
                        const isCorrect = expectedGrid ? cell === expectedGrid[r][c] : true;
                        const isEmpty = cell === 0;
                        const bgColor = isEmpty ? 'bg-white' :
                            isCorrect ? 'bg-green-100' : 'bg-red-100';

                        return (
                            <div
                                key={`${r}-${c}`}
                                className={`w-8 h-8 flex items-center justify-center border border-gray-300 text-sm font-mono
                                    ${(c + 1) % 3 === 0 && c < 8 ? 'border-r-2 border-r-black' : ''}
                                    ${(r + 1) % 3 === 0 && r < 8 ? 'border-b-2 border-b-black' : ''}
                                    ${bgColor} ${!isEmpty && 'font-bold'}
                                `}
                            >
                                {cell !== 0 ? cell : ''}
                            </div>
                        );
                    })
                ))}
            </div>
        );
    };

    const avgAccuracy = testResults.length > 0
        ? testResults.filter(r => r.accuracy !== undefined).reduce((sum, r) => sum + (r.accuracy || 0), 0) / testResults.filter(r => r.accuracy !== undefined).length
        : 0;

    const successCount = testResults.filter(r => r.status === 'success').length;
    const avgTime = testResults.filter(r => r.processingTime).reduce((sum, r) => sum + (r.processingTime || 0), 0) / testResults.filter(r => r.processingTime).length || 0;

    return (
        <div className="p-8 bg-gray-50 min-h-screen text-black">
            <h1 className="text-3xl font-bold mb-2">Scanner Test & Tuning</h1>
            <p className="text-gray-600 mb-6">Test the image processing pipeline on multiple images from the dataset</p>

            {!opencvReady && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
                    <p className="font-semibold">⏳ Loading OpenCV...</p>
                </div>
            )}

            {/* Controls */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Batch Test Configuration</h2>

                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <label className="font-semibold">Number of Images to Test:</label>
                        <span className="text-2xl font-bold text-blue-600">{batchSize}</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max={Math.min(availableImages.length, 50)}
                        value={batchSize}
                        onChange={(e) => setBatchSize(parseInt(e.target.value))}
                        disabled={processing}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>1</span>
                        <span>{availableImages.length} available</span>
                    </div>
                </div>

                <button
                    onClick={runBatchTest}
                    disabled={processing || !opencvReady || availableImages.length === 0}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg transition-colors"
                >
                    {processing ? `Processing... (${currentTest + 1}/${batchSize})` : `Run Batch Test (${batchSize} images)`}
                </button>

                {testResults.length > 0 && (
                    <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-2 border-blue-200">
                        <h3 className="font-bold text-lg mb-4 text-center">Overall Statistics</h3>
                        <div className="grid grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-blue-600">
                                    {successCount}/{testResults.length}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">Successful</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-green-600">
                                    {avgAccuracy.toFixed(1)}%
                                </div>
                                <div className="text-sm text-gray-600 mt-1">Avg Accuracy</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-purple-600">
                                    {avgTime.toFixed(0)}ms
                                </div>
                                <div className="text-sm text-gray-600 mt-1">Avg Time</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Results Table */}
            {testResults.length > 0 && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b">
                        <h2 className="text-xl font-bold">Test Results</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 border-b-2">
                                <tr>
                                    <th className="p-3 text-left font-semibold">#</th>
                                    <th className="p-3 text-left font-semibold">Image</th>
                                    <th className="p-3 text-left font-semibold">Status</th>
                                    <th className="p-3 text-right font-semibold">Accuracy</th>
                                    <th className="p-3 text-right font-semibold">Correct Cells</th>
                                    <th className="p-3 text-right font-semibold">Time (ms)</th>
                                    <th className="p-3 text-center font-semibold">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {testResults.map((result, idx) => (
                                    <React.Fragment key={result.filename}>
                                        <tr
                                            className={`border-b hover:bg-gray-50 transition-colors ${idx === currentTest ? 'bg-blue-50' : ''
                                                } ${expandedRow === idx ? 'bg-gray-50' : ''}`}
                                        >
                                            <td className="p-3 font-mono text-gray-500">{idx + 1}</td>
                                            <td className="p-3 font-mono text-xs">{result.filename}</td>
                                            <td className="p-3">
                                                {result.status === 'pending' && <span className="text-gray-400">⏳ Pending</span>}
                                                {result.status === 'processing' && <span className="text-blue-600 font-semibold">⚙️ Processing...</span>}
                                                {result.status === 'success' && <span className="text-green-600">✓ Success</span>}
                                                {result.status === 'error' && <span className="text-red-600">✗ Error</span>}
                                            </td>
                                            <td className="p-3 text-right">
                                                {result.accuracy !== undefined ? (
                                                    <span className={`font-bold ${result.accuracy >= 90 ? 'text-green-600' :
                                                        result.accuracy >= 70 ? 'text-yellow-600' :
                                                            'text-red-600'
                                                        }`}>
                                                        {result.accuracy.toFixed(1)}%
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="p-3 text-right font-mono">
                                                {result.matches !== undefined ? `${result.matches}/${result.total}` : '-'}
                                            </td>
                                            <td className="p-3 text-right text-gray-600">
                                                {result.processingTime || '-'}
                                            </td>
                                            <td className="p-3 text-center">
                                                {result.status === 'success' && result.extractedGrid && (
                                                    <button
                                                        onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                                                        className="text-blue-600 hover:text-blue-800 font-semibold text-xs"
                                                    >
                                                        {expandedRow === idx ? '▲ Hide' : '▼ Show Grids'}
                                                    </button>
                                                )}
                                                {result.status === 'error' && (
                                                    <span className="text-red-500 text-xs">{result.error}</span>
                                                )}
                                            </td>
                                        </tr>
                                        {expandedRow === idx && result.extractedGrid && (
                                            <tr>
                                                <td colSpan={7} className="p-6 bg-gray-50 border-b">
                                                    <div className="grid grid-cols-2 gap-8">
                                                        <div>
                                                            <h4 className="font-bold mb-3 text-center">Extracted Grid</h4>
                                                            <div className="flex justify-center">
                                                                {renderGrid(result.extractedGrid, result.expectedGrid)}
                                                            </div>
                                                        </div>
                                                        {result.expectedGrid && (
                                                            <div>
                                                                <h4 className="font-bold mb-3 text-center">Expected Grid</h4>
                                                                <div className="flex justify-center">
                                                                    {renderGrid(result.expectedGrid)}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="mt-4 text-center text-sm text-gray-600">
                                                        <span className="inline-block bg-green-100 px-2 py-1 rounded mr-2">Green = Correct</span>
                                                        <span className="inline-block bg-red-100 px-2 py-1 rounded">Red = Incorrect</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
