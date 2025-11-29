import React from 'react';
import { DoodleIcon } from './DoodleIcon';

interface DebugVisualizationProps {
    debugData: {
        originalImage?: string;
        processedImage?: string;
        warpedBoard?: string;
        extractedGrid?: number[][];
        status?: string;
    } | null;
    onClose: () => void;
    onExtract?: () => void;
}

export const DebugVisualization: React.FC<DebugVisualizationProps> = ({ debugData, onClose, onExtract }) => {
    if (!debugData) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-purple-300 border-b-4 border-black p-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold uppercase text-black">Debug Visualization</h2>
                    <button onClick={onClose} className="hover:scale-110 transition-transform">
                        <svg viewBox="0 0 24 24" className="w-8 h-8 stroke-black stroke-2 fill-none">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Status */}
                    {debugData.status && (
                        <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-400 rounded-xl">
                            <p className="text-sm font-bold text-blue-900">Status: {debugData.status}</p>
                        </div>
                    )}

                    {/* Images Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Original Image */}
                        {debugData.originalImage && (
                            <div className="border-3 border-black rounded-xl overflow-hidden bg-gray-50">
                                <div className="bg-yellow-200 border-b-2 border-black p-2">
                                    <h3 className="font-bold text-sm">1. Original Image</h3>
                                </div>
                                <div className="p-2">
                                    <img
                                        src={`data:image/png;base64,${debugData.originalImage}`}
                                        alt="Original"
                                        className="w-full h-auto border-2 border-gray-300 rounded"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Processed/Warped Board */}
                        {debugData.warpedBoard && (
                            <div className="border-3 border-black rounded-xl overflow-hidden bg-gray-50">
                                <div className="bg-green-200 border-b-2 border-black p-2">
                                    <h3 className="font-bold text-sm">2. Detected & Warped Board</h3>
                                </div>
                                <div className="p-2">
                                    <img
                                        src={debugData.warpedBoard}
                                        alt="Warped Board"
                                        className="w-full h-auto border-2 border-gray-300 rounded"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Extracted Grid */}
                    {debugData.extractedGrid && (
                        <div className="border-3 border-black rounded-xl overflow-hidden bg-gray-50">
                            <div className="bg-pink-200 border-b-2 border-black p-2">
                                <h3 className="font-bold text-sm">3. Extracted Grid Values</h3>
                            </div>
                            <div className="p-4">
                                <div className="grid grid-cols-9 gap-1 max-w-md mx-auto">
                                    {debugData.extractedGrid.map((row, r) =>
                                        row.map((cell, c) => (
                                            <div
                                                key={`${r}-${c}`}
                                                className={`aspect-square flex items-center justify-center border-2 border-black text-sm font-bold ${cell === 0 ? 'bg-gray-100 text-gray-400' : 'bg-white text-black'
                                                    } ${(c + 1) % 3 === 0 && c !== 8 ? 'border-r-4' : ''} ${(r + 1) % 3 === 0 && r !== 8 ? 'border-b-4' : ''
                                                    }`}
                                            >
                                                {cell || '·'}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer with Extract Button */}
                <div className="border-t-4 border-black p-4 bg-gray-50 flex justify-between items-center">
                    <p className="text-xs text-gray-600">
                        {debugData.extractedGrid
                            ? `Detected ${debugData.extractedGrid.flat().filter(n => n !== 0).length} numbers`
                            : 'Processing...'}
                    </p>
                    {onExtract && debugData.extractedGrid && (
                        <button
                            onClick={onExtract}
                            className="bg-green-400 text-black border-3 border-black px-6 py-2 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold hover:bg-green-300 active:translate-y-1 active:shadow-none transition-all flex items-center gap-2"
                        >
                            <DoodleIcon name="check" className="w-5 h-5" />
                            Use This Grid
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
