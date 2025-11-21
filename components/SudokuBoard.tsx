import React from 'react';
import { SudokuGrid } from '../types';
import { playSound } from '../services/audioService';

interface SudokuBoardProps {
  grid: SudokuGrid;
  initialGrid: SudokuGrid; // To identify which numbers were locked/original
  onCellChange: (row: number, col: number, value: number) => void;
}

export const SudokuBoard: React.FC<SudokuBoardProps> = ({ grid, initialGrid, onCellChange }) => {
  const size = grid.length;
  const boxSize = Math.sqrt(size);

  const handleChange = (row: number, col: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow only valid numbers for the grid size (1-4 or 1-9)
    const regex = size === 9 ? /^[1-9]$/ : /^[1-4]$/;
    
    if (val === '' || regex.test(val)) {
      if (val !== '') playSound('scribble');
      onCellChange(row, col, val === '' ? 0 : parseInt(val, 10));
    }
  };

  // Determine grid columns class
  const gridColsClass = size === 9 ? 'grid-cols-9' : 'grid-cols-4';

  return (
    // Increased border radius and shadow for comic effect
    <div className="w-full h-full bg-white border-[4px] border-black p-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-3xl flex flex-col overflow-hidden">
      <div className={`grid ${gridColsClass} gap-0 border-[4px] border-black bg-black flex-1 rounded-xl overflow-hidden`}>
        {grid.map((row, rowIndex) => (
          row.map((cell, colIndex) => {
            // Determine borders for subgrids
            const isRightBorder = (colIndex + 1) % boxSize === 0 && colIndex !== (size - 1);
            const isBottomBorder = (rowIndex + 1) % boxSize === 0 && rowIndex !== (size - 1);
            
            // Is this a locked initial cell?
            const isLocked = initialGrid[rowIndex][colIndex] !== 0;

            return (
              <input
                key={`${rowIndex}-${colIndex}`}
                type="tel" // Brings up numeric keypad on mobile
                inputMode="numeric"
                value={cell === 0 ? '' : cell}
                onChange={(e) => handleChange(rowIndex, colIndex, e)}
                readOnly={false} 
                className={`
                  w-full h-full text-center font-bold outline-none focus:bg-yellow-100 p-0
                  ${size === 9 ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl'}
                  ${isRightBorder ? 'mr-[4px]' : 'mr-[1px]'} 
                  ${isBottomBorder ? 'mb-[4px]' : 'mb-[1px]'}
                  ${isLocked ? 'text-black' : 'text-blue-600'}
                  bg-white
                `}
              />
            );
          })
        ))}
      </div>
    </div>
  );
};