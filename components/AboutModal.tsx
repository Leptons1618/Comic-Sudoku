import React from 'react';
import { Modal } from './Modal';
import { DoodleIcon } from './DoodleIcon';

interface AboutModalProps {
    onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
    return (
        <Modal onClose={onClose} title="About Comic Sudoku">
            <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center transform -rotate-6">
                    <span className="text-4xl">🧩</span>
                </div>

                <div>
                    <h2 className="text-2xl font-bold">Comic Sudoku</h2>
                    <p className="text-gray-500 font-bold">Version 1.0.0</p>
                </div>

                <p className="text-gray-600">
                    A fun, comic-style Sudoku solver that runs entirely on your device!
                    Snap a photo of any puzzle and let our custom AI solve it instantly.
                </p>

                <div className="w-full bg-blue-50 p-4 rounded-xl border-2 border-blue-100">
                    <h3 className="font-bold text-blue-800 mb-2">Features</h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>✨ 100% Offline & Private</li>
                        <li>📸 Instant Camera Scanning</li>
                        <li>🤖 Custom TensorFlow.js AI Model</li>
                        <li>🎨 Hand-Drawn Comic Aesthetic</li>
                    </ul>
                </div>

                <div className="text-xs text-gray-400 mt-4">
                    Built with React, TensorFlow.js, and OpenCV.
                    <br />
                    © 2025 Comic Sudoku Team
                </div>
            </div>
        </Modal>
    );
};
