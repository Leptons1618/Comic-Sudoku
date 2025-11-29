import React from 'react';
import { SudokuGrid, CellPosition } from '../types';

interface SudokuBoardProps {
  grid: SudokuGrid;
  initialGrid: SudokuGrid;
  selectedCell: CellPosition | null;
  onCellClick: (row: number, col: number) => void;
  hintCells?: CellPosition[];
  errorCells?: CellPosition[];
  animatingHint?: CellPosition | null;
}

export const SudokuBoard: React.FC<SudokuBoardProps> = ({
  grid,
  initialGrid,
  selectedCell,
  onCellClick,
  hintCells = [],
  errorCells = [],
  animatingHint
}) => {
  const size = grid.length;
  const boxSize = Math.sqrt(size);

  // Determine grid columns class
  const gridColsClass = size === 9 ? 'grid-cols-9' : 'grid-cols-4';

  return (
    // Board container
    <div className="w-full h-full bg-white border-[4px] border-black p-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-3xl flex flex-col overflow-hidden relative">
      {/* Grid Lines Container - bg-black creates the lines via gap/margin */}
      <div className={`grid ${gridColsClass} gap-0 border-[4px] border-black bg-black flex-1 rounded-xl overflow-hidden`}>
        {grid.map((row, rowIndex) => (
          row.map((cell, colIndex) => {
            // Determine borders for subgrids
            const isRightBorder = (colIndex + 1) % boxSize === 0 && colIndex !== (size - 1);
            const isBottomBorder = (rowIndex + 1) % boxSize === 0 && rowIndex !== (size - 1);

            // Is this a locked initial cell?
            const isInitial = initialGrid[rowIndex][colIndex] !== 0;

            // Is selected?
            const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;

            // Is Hint?
            const isHint = hintCells.some(h => h.row === rowIndex && h.col === colIndex);

            // Is Error?
            const isError = errorCells.some(e => e.row === rowIndex && e.col === colIndex);

            // Is Animating?
            const isAnimating = animatingHint?.row === rowIndex && animatingHint?.col === colIndex;

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                onClick={() => onCellClick(rowIndex, colIndex)}
                className={`
                  flex items-center justify-center cursor-pointer select-none relative
                  ${size === 9 ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl'}
                  ${isRightBorder ? 'mr-[4px]' : 'mr-[1px]'} 
                  ${isBottomBorder ? 'mb-[4px]' : 'mb-[1px]'}
                  ${isInitial ? 'text-black font-extrabold' : 'text-blue-600 font-semibold'}
                  ${isError ? 'text-red-600 bg-red-100' : ''}
                  ${isHint ? 'text-purple-600 font-bold' : ''}
                  ${isAnimating ? 'animate-pulse bg-purple-200' : ''}
                  ${isSelected ? 'z-10' : 'bg-white'}
                  ${!isError && !isSelected && !isAnimating ? 'hover:bg-gray-50' : ''}
                `}
              >
                {isSelected && (
                  <div className="absolute inset-0 border-[3px] border-blue-400 pointer-events-none"></div>
                )}
                {cell !== 0 ? cell : ''}
              </div>
            );
          })
        ))}
      </div>
    </div>
  );
};