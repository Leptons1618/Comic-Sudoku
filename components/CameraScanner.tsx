import React, { useRef, useEffect, useState } from 'react';
import { DoodleIcon } from './DoodleIcon';
import { loadOpenCV } from '../services/localMLService';

interface CameraScannerProps {
    onCapture: (imageData: string) => void;
    onClose: () => void;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        let stream: MediaStream | null = null;

        const startCamera = async () => {
            try {
                // Load OpenCV first
                await loadOpenCV();

                // Request camera access
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                    setIsLoading(false);
                }
            } catch (err) {
                console.error("Camera error:", err);
                setError("Could not access camera. Ensure you are on HTTPS/localhost and have granted permissions.");
                setIsLoading(false);
            }
        };

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleCapture = () => {
        if (!videoRef.current) return;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            const base64 = dataUrl.split(',')[1];
            onCapture(base64);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* Header */}
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-10">
                <button onClick={onClose} className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition-colors">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-white stroke-2 fill-none">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
                {!isLoading && !error && (
                    <div className="bg-black/50 px-3 py-1 rounded-full">
                        <span className="text-white text-xs font-bold">Point at Sudoku</span>
                    </div>
                )}
                <div className="w-10"></div>
            </div>

            {/* Camera View */}
            <div className="flex-1 relative overflow-hidden bg-gray-900 flex items-center justify-center">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center gap-4">
                        <div className="relative">
                            {/* Animated spinner */}
                            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <DoodleIcon name="camera" className="w-8 h-8 text-white/60" />
                            </div>
                        </div>
                        <p className="text-white text-sm font-bold">Initializing Camera...</p>
                        <p className="text-white/60 text-xs">This may take a moment</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center gap-4 text-white p-4 text-center max-w-sm">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-8 h-8 stroke-red-400 stroke-2 fill-none">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 8v4M12 16h.01" />
                            </svg>
                        </div>
                        <p className="font-bold">Camera Error</p>
                        <p className="text-sm text-white/80">{error}</p>
                    </div>
                ) : (
                    <video
                        ref={videoRef}
                        className="absolute inset-0 w-full h-full object-cover"
                        playsInline
                        muted
                    />
                )}
            </div>

            {/* Controls */}
            {!isLoading && !error && (
                <div className="h-32 bg-black flex items-center justify-center pb-8">
                    <button
                        onClick={handleCapture}
                        className="w-20 h-20 rounded-full border-[6px] border-white bg-transparent flex items-center justify-center transition-all active:scale-95 hover:border-green-400"
                    >
                        <div className="w-16 h-16 rounded-full bg-white" />
                    </button>
                </div>
            )}
        </div>
    );
};
