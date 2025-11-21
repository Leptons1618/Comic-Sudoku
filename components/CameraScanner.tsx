import React, { useRef, useEffect, useState } from 'react';
import { DoodleIcon } from './DoodleIcon';
import { detectBoardCorners, loadOpenCV } from '../services/localMLService';

interface CameraScannerProps {
    onCapture: (imageData: string) => void;
    onClose: () => void;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isBoardDetected, setIsBoardDetected] = useState(false);
    const [error, setError] = useState<string>("");
    const requestRef = useRef<number>();

    useEffect(() => {
        let stream: MediaStream | null = null;

        const startCamera = async () => {
            try {
                await loadOpenCV(); // Ensure OpenCV is ready

                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                    requestRef.current = requestAnimationFrame(processFrame);
                }
            } catch (err) {
                console.error("Camera error:", err);
                setError("Could not access camera. Please check permissions.");
            }
        };

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, []);

    const processFrame = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
            // Match canvas size to video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw video frame to canvas (hidden processing)
            // We use a small offscreen canvas for processing to speed up OpenCV
            const processCanvas = document.createElement('canvas');
            const scale = 0.5; // Process at half resolution
            processCanvas.width = video.videoWidth * scale;
            processCanvas.height = video.videoHeight * scale;
            const pCtx = processCanvas.getContext('2d');

            if (pCtx) {
                pCtx.drawImage(video, 0, 0, processCanvas.width, processCanvas.height);

                // Detect
                const points = detectBoardCorners(processCanvas);

                // Clear previous drawings
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                if (points) {
                    setIsBoardDetected(true);

                    // Scale points back up
                    const scaledPoints = points.map(p => ({ x: p.x / scale, y: p.y / scale }));

                    // Draw Outline
                    ctx.beginPath();
                    ctx.moveTo(scaledPoints[0].x, scaledPoints[0].y);
                    ctx.lineTo(scaledPoints[1].x, scaledPoints[1].y);
                    ctx.lineTo(scaledPoints[2].x, scaledPoints[2].y);
                    ctx.lineTo(scaledPoints[3].x, scaledPoints[3].y);
                    ctx.closePath();

                    ctx.strokeStyle = '#4ade80'; // Green-400
                    ctx.lineWidth = 4;
                    ctx.stroke();

                    // Draw corners
                    ctx.fillStyle = '#4ade80';
                    scaledPoints.forEach(p => {
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, 6, 0, 2 * Math.PI);
                        ctx.fill();
                    });

                } else {
                    setIsBoardDetected(false);
                }
            }
        }

        requestRef.current = requestAnimationFrame(processFrame);
    };

    const handleCapture = () => {
        if (!videoRef.current) return;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            // Remove prefix to get base64 data
            const base64 = dataUrl.split(',')[1];
            onCapture(base64);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* Header */}
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-10">
                <button onClick={onClose} className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white">
                    <DoodleIcon name="trash" className="w-6 h-6 rotate-45" /> {/* Using trash as close/X for now or add X icon */}
                </button>
                <div className="bg-black/50 px-3 py-1 rounded-full">
                    <span className="text-white text-xs font-bold">Point at Sudoku</span>
                </div>
                <div className="w-10"></div>
            </div>

            {/* Camera View */}
            <div className="flex-1 relative overflow-hidden bg-gray-900">
                {error ? (
                    <div className="flex items-center justify-center h-full text-white p-4 text-center">
                        <p>{error}</p>
                    </div>
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            className="absolute inset-0 w-full h-full object-cover"
                            playsInline
                            muted
                        />
                        <canvas
                            ref={canvasRef}
                            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                        />
                    </>
                )}
            </div>

            {/* Controls */}
            <div className="h-32 bg-black flex items-center justify-center pb-8">
                <button
                    onClick={handleCapture}
                    className={`w-20 h-20 rounded-full border-[6px] flex items-center justify-center transition-all ${isBoardDetected
                            ? 'border-green-400 bg-white/10 scale-110'
                            : 'border-white bg-transparent'
                        }`}
                >
                    <div className={`w-16 h-16 rounded-full ${isBoardDetected ? 'bg-green-400' : 'bg-white'}`} />
                </button>
            </div>
        </div>
    );
};
