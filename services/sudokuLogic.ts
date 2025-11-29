import { SudokuGrid, GridSize } from "../types";

// Helper to check if placing num at board[row][col] is valid
export const isValid = (board: SudokuGrid, row: number, col: number, num: number): boolean => {
  const size = board.length;
  const boxSize = Math.sqrt(size);

  // Check row
  for (let x = 0; x < size; x++) {
    if (board[row][x] === num) return false;
  }

  // Check column
  for (let x = 0; x < size; x++) {
    if (board[x][col] === num) return false;
  }

  // Check box
  const startRow = Math.floor(row / boxSize) * boxSize;
  const startCol = Math.floor(col / boxSize) * boxSize;

  for (let i = 0; i < boxSize; i++) {
    for (let j = 0; j < boxSize; j++) {
      if (board[i + startRow][j + startCol] === num) return false;
    }
  }

  return true;
};

// Deep copy helper
const copyBoard = (board: SudokuGrid): SudokuGrid => {
  return board.map((row) => [...row]);
};

// Randomize array helper
const shuffle = (array: number[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export const solveSudoku = (initialBoard: SudokuGrid, randomize = false): SudokuGrid | null => {
  const board = copyBoard(initialBoard);
  const size = board.length;

  const solve = (): boolean => {
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (board[row][col] === 0) {
          // Generate numbers based on size (1..4 or 1..9)
          const nums = Array.from({ length: size }, (_, i) => i + 1);
          if (randomize) shuffle(nums);

          for (const num of nums) {
            if (isValid(board, row, col, num)) {
              board[row][col] = num;
              if (solve()) {
                return true;
              }
              board[row][col] = 0; // Backtrack
            }
          }
          return false; // No valid number found
        }
      }
    }
    return true; // Solved
  };

  if (solve()) {
    return board;
  }
  return null; // Unsolvable
};

export const createEmptyBoard = (size: GridSize = 9): SudokuGrid => {
  return Array(size).fill(null).map(() => Array(size).fill(0));
};

// Generate a new puzzle
export const generateSudoku = (size: GridSize, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): { puzzle: SudokuGrid; solution: SudokuGrid } => {
  // 1. Create a full valid board
  const empty = createEmptyBoard(size);
  const solution = solveSudoku(empty, true); // Use randomized solver

  if (!solution) {
    throw new Error("Failed to generate board");
  }

  // 2. Remove numbers to create puzzle
  const puzzle = copyBoard(solution);
  
  // Adjust removal count based on size and difficulty
  let baseRemovals = 0;
  if (size === 9) {
      baseRemovals = difficulty === 'easy' ? 30 : difficulty === 'medium' ? 40 : 50;
  } else {
      baseRemovals = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 7 : 10;
  }

  let attempts = baseRemovals;
  
  while (attempts > 0) {
    const row = Math.floor(Math.random() * size);
    const col = Math.floor(Math.random() * size);
    
    if (puzzle[row][col] !== 0) {
      puzzle[row][col] = 0;
      attempts--;
    }
  }

  return { puzzle, solution };
};