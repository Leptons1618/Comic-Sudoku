import React from 'react';
import { GridSize } from '../types';

interface NumberKeyboardProps {
    gridSize: GridSize;
    onNumberClick: (num: number) => void;
    onDelete: () => void;
    onSolve?: () => void;
    disabledNumbers: number[];
    visible: boolean;
    onClose: () => void;
}

export const NumberKeyboard: React.FC<NumberKeyboardProps> = ({ gridSize, onNumberClick, onDelete, onSolve, disabledNumbers, visible, onClose }) => {
    if (!visible) return null;

    const numbers = gridSize === 9 ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : [1, 2, 3, 4];

    return (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t-[4px] border-black p-4 pb-8 rounded-t-3xl shadow-[0px_-10px_20px_rgba(0,0,0,0.2)] z-50 animate-slide-up">
            <div className="flex justify-between items-center mb-2 px-2">
                <span className="font-bold text-lg">Input Number</span>
                <button onClick={onClose} className="font-bold text-red-500 text-xl px-2">✕</button>
            </div>

            <div className="flex flex-col items-center gap-3">
                <div className={`grid ${gridSize === 9 ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
                    {numbers.map((num) => {
                        const isDisabled = disabledNumbers.includes(num);
                        return (
                            <button
                                key={num}
                                onClick={() => !isDisabled && onNumberClick(num)}
                                disabled={isDisabled}
                                className={`
                                    w-16 h-14 sm:w-20 sm:h-16 rounded-xl border-[3px] border-black font-bold text-2xl
                                    flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                                    active:translate-y-1 active:shadow-none transition-all
                                    ${isDisabled
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-400 shadow-none'
                                        : 'bg-white hover:bg-yellow-100 text-black'}
                                `}
                            >
                                {num}
                            </button>
                        );
                    })}
                </div>

                <div className="flex gap-3 w-full justify-center max-w-[16rem] sm:max-w-[19rem]">
                    {onSolve && (
                        <button
                            onClick={onSolve}
                            className="flex-1 h-14 sm:h-16 rounded-xl border-[3px] border-black bg-green-400 hover:bg-green-300 font-bold text-xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
                        >
                            Solve
                        </button>
                    )}
                    <button
                        onClick={onDelete}
                        className="flex-1 h-14 sm:h-16 rounded-xl border-[3px] border-black bg-red-200 hover:bg-red-300 font-bold text-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
                    >
                        ⌫
                    </button>
                </div>
            </div>
        </div>
    );
};
