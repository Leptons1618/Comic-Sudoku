export type CellValue = number; // 0 represents empty
export type SudokuGrid = CellValue[][];
export type GridSize = 4 | 9;

export interface CellPosition {
  row: number;
  col: number;
}

export enum GameState {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  SOLVING = 'SOLVING',
  SOLVED = 'SOLVED',
  ERROR = 'ERROR',
  PLAYING = 'PLAYING',
}

export enum AppMode {
  SCAN = 'SCAN',
  MANUAL = 'MANUAL',
  PLAY = 'PLAY'
}