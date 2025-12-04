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
        let isMounted = true;

        const startCamera = async () => {
            try {
                // Load OpenCV in background (don't block camera)
                loadOpenCV().catch(err => console.warn("OpenCV preload failed:", err));

                // Check if getUserMedia is supported
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error("Camera API not supported. Please use a modern browser.");
                }

                // Try simple constraints first (works better on desktop)
                let cameraConstraints: MediaStreamConstraints = {
                    video: true
                };

                // On mobile, prefer rear camera
                const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
                if (isMobile) {
                    cameraConstraints = {
                        video: { facingMode: 'environment' }
                    };
                }

                const cameraPromise = navigator.mediaDevices.getUserMedia(cameraConstraints);

                const timeoutPromise = new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error("Camera access timed out. Please refresh and try again.")), 15000)
                );

                stream = await Promise.race([cameraPromise, timeoutPromise]);

                if (videoRef.current && isMounted) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                    setIsLoading(false);
                }
            } catch (err: any) {
                console.error("Camera error:", err);

                // Provide more specific error messages
                let errorMessage = "Could not access camera.";
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    errorMessage = "Camera permission denied. Please allow camera access and refresh.";
                } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                    errorMessage = "No camera found on this device.";
                } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                    errorMessage = "Camera is in use by another app. Please close other apps and try again.";
                } else if (err.name === 'OverconstrainedError') {
                    errorMessage = "Camera doesn't support requested settings. Trying with defaults...";
                    // Retry with basic constraints
                    try {
                        stream = await navigator.mediaDevices.getUserMedia({ video: true });
                        if (videoRef.current && isMounted) {
                            videoRef.current.srcObject = stream;
                            await videoRef.current.play();
                            setIsLoading(false);
                            return;
                        }
                    } catch (retryErr) {
                        errorMessage = "Could not access camera with any settings.";
                    }
                } else if (err.message) {
                    errorMessage = err.message;
                }

                if (isMounted) {
                    setError(errorMessage);
                    setIsLoading(false);
                }
            }
        };

        startCamera();

        return () => {
            isMounted = false;
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
                {/* Always render video element so ref is available, but hide during loading/error */}
                <video
                    ref={videoRef}
                    className={`absolute inset-0 w-full h-full object-cover ${isLoading || error ? 'hidden' : ''}`}
                    playsInline
                    muted
                    autoPlay
                />

                {isLoading && (
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
                )}

                {error && (
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
