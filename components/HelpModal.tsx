import React, { useState } from 'react';
import { DoodleIcon } from './DoodleIcon';
import { playSound } from '../services/audioService';

interface HelpModalProps {
    onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
    const [currentPage, setCurrentPage] = useState(0);

    const pages = [
        {
            title: 'How to Use',
            content: (
                <>
                    <h3 className="font-bold mb-2 text-lg flex items-center gap-2">
                        <DoodleIcon name="camera" className="w-5 h-5" /> Scan Mode
                    </h3>
                    <p className="mb-4 text-sm">
                        Take a photo or upload a screenshot of an unsolved Sudoku. The AI will fill the board for you!
                        You can also click on any cell to manually edit it. Click "Solve" to get the solution.
                    </p>

                    <h3 className="font-bold mb-2 text-lg flex items-center gap-2">
                        <DoodleIcon name="gamepad" className="w-5 h-5" /> Play Mode
                    </h3>
                    <p className="mb-2 text-sm">
                        Generate endless puzzles! Select 4x4 (Mini) or 9x9 (Standard) size.
                    </p>
                    <ul className="list-disc pl-4 text-sm mb-4">
                        <li><strong>Hint:</strong> Fills one random cell.</li>
                        <li><strong>Check:</strong> Tells you if you are on the right track.</li>
                    </ul>

                    <div className="p-3 bg-yellow-50 border-[2px] border-black border-dashed rounded-xl">
                        <p className="text-xs font-bold">💡 Pro Tip</p>
                        <p className="text-xs mt-1">
                            Click any cell in Scan mode to manually edit numbers before solving!
                        </p>
                    </div>
                </>
            ),
        },
        {
            title: 'Model & Technology',
            content: (
                <>
                    <h3 className="font-bold mb-2 text-lg">🔍 Scanning Pipeline</h3>
                    <p className="mb-3 text-sm">
                        Comic Sudoku runs <strong>100% offline</strong> using a two-stage scanning pipeline.
                    </p>

                    <div className="bg-green-50 border-[2px] border-black rounded-xl p-3 mb-3">
                        <p className="text-xs font-bold mb-2">Stage 1: Board Detection (OpenCV.js)</p>
                        <ul className="text-xs space-y-1">
                            <li>• Finds the Sudoku grid in your image</li>
                            <li>• Corrects perspective & warps to flat view</li>
                            <li>• Slices board into 81 individual cells</li>
                        </ul>
                    </div>

                    <div className="bg-blue-50 border-[2px] border-black rounded-xl p-3 mb-3">
                        <p className="text-xs font-bold mb-2">Stage 2: Digit Recognition (TensorFlow.js)</p>
                        <ul className="text-xs space-y-1">
                            <li>• Custom-trained CNN (3 Conv Blocks + BatchNorm)</li>
                            <li>• Recognizes digits 1-9 from cell images</li>
                            <li>• 28x28 grayscale input, batch inference</li>
                            <li>• WebGL acceleration for fast predictions</li>
                        </ul>
                    </div>

                    <div className="p-3 bg-yellow-50 border-[2px] border-black border-dashed rounded-xl">
                        <p className="text-xs font-bold">✨ No Internet Required</p>
                        <p className="text-xs mt-1">
                            All processing happens on your device. Your images never leave your browser!
                        </p>
                    </div>
                </>
            ),
        },
        {
            title: 'About',
            content: (
                <>
                    <div className="text-center mb-4">
                        <h3 className="text-2xl font-bold mb-2">Comic Sudoku</h3>
                        <p className="text-sm text-gray-600">Version 1.3.0</p>
                    </div>

                    <p className="mb-4 text-sm text-justify">
                        A fun, doodle-themed Sudoku application that combines AI-powered scanning with classic puzzle gameplay.
                        Solve puzzles from photos, play generated games, or practice with manual input.
                    </p>

                    <div className="bg-green-50 border-[2px] border-black rounded-xl p-3 mb-3">
                        <p className="text-xs font-bold mb-2">✨ Features</p>
                        <ul className="text-xs space-y-1">
                            <li>• AI-powered puzzle scanning</li>
                            <li>• Custom-trained digit recognition model</li>
                            <li>• Puzzle generator with 3 difficulty levels</li>
                            <li>• Offline & cloud scanning modes</li>
                            <li>• 4x4 and 9x9 grid support</li>
                        </ul>
                    </div>

                    <a
                        href="https://github.com/Leptons1618/Comic-Sudoku"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => playSound('click')}
                        className="block w-full bg-black text-white text-center py-3 rounded-xl border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] hover:bg-gray-800 active:translate-y-1 active:shadow-none font-bold"
                    >
                        <div className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            View on GitHub
                        </div>
                    </a>
                </>
            ),
        },
        {
            title: 'Developer',
            content: (
                <>
                    <div className="text-center mb-4">
                        <h3 className="text-xl font-bold mb-1">Developed by</h3>
                        <p className="text-lg font-bold text-blue-600">Leptons1618</p>
                    </div>

                    <div className="bg-purple-50 border-[2px] border-black rounded-xl p-3 mb-3">
                        <p className="text-xs font-bold mb-2">🔗 Project Links</p>
                        <div className="space-y-2">
                            <a
                                href="https://github.com/Leptons1618/Comic-Sudoku"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => playSound('click')}
                                className="block text-xs text-blue-600 hover:underline"
                            >
                                📦 GitHub Repository
                            </a>
                            <a
                                href="https://github.com/Leptons1618/Comic-Sudoku/issues"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => playSound('click')}
                                className="block text-xs text-blue-600 hover:underline"
                            >
                                🐛 Report Issues
                            </a>
                            <a
                                href="https://github.com/Leptons1618"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => playSound('click')}
                                className="block text-xs text-blue-600 hover:underline"
                            >
                                👤 Developer Profile
                            </a>
                        </div>
                    </div>

                    <div className="bg-yellow-50 border-[2px] border-black border-dashed rounded-xl p-3 mb-3">
                        <p className="text-xs font-bold mb-1">💖 Support This Project</p>
                        <p className="text-xs mb-2">
                            If you enjoy Comic Sudoku, consider starring the repository or contributing to the project!
                        </p>
                    </div>

                    <a
                        href="https://github.com/sponsors/Leptons1618"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => playSound('click')}
                        className="block w-full bg-pink-400 text-black text-center py-3 rounded-xl border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-pink-300 active:translate-y-1 active:shadow-none font-bold"
                    >
                        ❤️ Sponsor on GitHub
                    </a>

                    <p className="text-xs text-center text-gray-500 mt-4">
                        Built with React, TypeScript, TensorFlow.js & ❤️
                    </p>
                </>
            ),
        },
    ];

    const handleNext = () => {
        if (currentPage < pages.length - 1) {
            setCurrentPage(currentPage + 1);
            playSound('click');
        }
    };

    const handlePrev = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
            playSound('click');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] w-full max-w-sm relative flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="bg-yellow-300 border-b-4 border-black p-4 rounded-t-3xl flex justify-between items-center flex-shrink-0">
                    <h2 className="text-2xl font-bold uppercase text-black">{pages[currentPage].title}</h2>
                    <button
                        onClick={() => {
                            playSound('click');
                            onClose();
                        }}
                        className="hover:scale-110 transition-transform"
                    >
                        <svg viewBox="0 0 24 24" className="w-8 h-8 stroke-black stroke-2 fill-none strokeLinecap-round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto text-left text-black flex-1">
                    {pages[currentPage].content}
                </div>

                {/* Navigation */}
                <div className="border-t-4 border-black p-4 flex items-center justify-between bg-gray-50 rounded-b-3xl flex-shrink-0">
                    <button
                        onClick={handlePrev}
                        disabled={currentPage === 0}
                        className={`px-4 py-2 rounded-xl border-[3px] border-black font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none ${currentPage === 0
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-400 shadow-none'
                            : 'bg-white hover:bg-gray-100'
                            }`}
                    >
                        ← Prev
                    </button>

                    {/* Page Indicators */}
                    <div className="flex gap-2">
                        {pages.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setCurrentPage(index);
                                    playSound('click');
                                }}
                                className={`w-2 h-2 rounded-full border-[2px] border-black transition-all ${index === currentPage ? 'bg-yellow-400 w-6' : 'bg-gray-300'
                                    }`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={handleNext}
                        disabled={currentPage === pages.length - 1}
                        className={`px-4 py-2 rounded-xl border-[3px] border-black font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none ${currentPage === pages.length - 1
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-400 shadow-none'
                            : 'bg-white hover:bg-gray-100'
                            }`}
                    >
                        Next →
                    </button>
                </div>
            </div>
        </div>
    );
};
