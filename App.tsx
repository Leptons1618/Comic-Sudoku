import React, { useState, useRef, useEffect } from 'react';
import { SudokuBoard } from './components/SudokuBoard';
import { Loader } from './components/Loader';
import { Modal } from './components/Modal';
import { createEmptyBoard, solveSudoku, generateSudoku } from './services/sudokuLogic';
import { extractSudokuFromImage, setCustomApiKey } from './services/geminiService';
import { SudokuGrid, AppMode, GridSize } from './types';
import { playSound, setMuted } from './services/audioService';

// --- Doodle Icons Component ---
export const DoodleIcon: React.FC<{ name: string; className?: string }> = ({ name, className = "w-6 h-6" }) => {
  const strokes = "stroke-black stroke-2 fill-none strokeLinecap-round strokeLinejoin-round";

  switch (name) {
    case 'camera':
      return (
        <svg viewBox="0 0 24 24" className={`${className} ${strokes}`}>
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      );
    case 'gallery':
      return (
        <svg viewBox="0 0 24 24" className={`${className} ${strokes}`}>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      );
    case 'pencil':
      return (
        <svg viewBox="0 0 24 24" className={`${className} ${strokes}`}>
          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </svg>
      );
    case 'gamepad':
      return (
        <svg viewBox="0 0 24 24" className={`${className} ${strokes}`}>
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <path d="M6 12h4m-2-2v4" />
          <line x1="15" y1="11" x2="15" y2="11" strokeWidth="3" />
          <line x1="18" y1="13" x2="18" y2="13" strokeWidth="3" />
        </svg>
      );
    case 'hint':
      return (
        <svg viewBox="0 0 24 24" className={`${className} ${strokes}`}>
          <path d="M9 18h6" />
          <path d="M10 22h4" />
          <path d="M12 2a7 7 0 0 0-7 7c0 2.386 1.194 4.49 3 5.758V18a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-3.242C17.806 13.49 19 11.386 19 9a7 7 0 0 0-7-7z" />
        </svg>
      );
    case 'check':
      return (
        <svg viewBox="0 0 24 24" className={`${className} ${strokes}`}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case 'trash':
      return (
        <svg viewBox="0 0 24 24" className={`${className} ${strokes}`}>
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      );
    case 'solve':
      return (
        <svg viewBox="0 0 24 24" className={`${className} ${strokes}`}>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case 'info':
      return (
        <svg viewBox="0 0 24 24" className={`${className} ${strokes}`}>
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      );
    case 'help':
      return (
        <svg viewBox="0 0 24 24" className={`${className} ${strokes}`}>
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case 'settings':
      return (
        <svg viewBox="0 0 24 24" className={`${className} ${strokes}`}>
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      );
    default:
      return null;
  }
};

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.SCAN);

  const [gridSize, setGridSize] = useState<GridSize>(9);
  const [grid, setGrid] = useState<SudokuGrid>(createEmptyBoard(9));
  const [initialGrid, setInitialGrid] = useState<SudokuGrid>(createEmptyBoard(9));
  const [solution, setSolution] = useState<SudokuGrid | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Thinking...");
  const [statusMessage, setStatusMessage] = useState("");

  const [showHelp, setShowHelp] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Settings State
  const [isMutedState, setIsMutedState] = useState(false);
  const [apiKey, setApiKey] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Load Settings on Mount
  useEffect(() => {
    const savedMuted = localStorage.getItem('comic_sudoku_muted') === 'true';
    const savedKey = localStorage.getItem('comic_sudoku_api_key') || "";

    setIsMutedState(savedMuted);
    setMuted(savedMuted);

    setApiKey(savedKey);
    if (savedKey) setCustomApiKey(savedKey);
  }, []);

  // Save Settings Handlers
  const toggleMute = () => {
    const newVal = !isMutedState;
    setIsMutedState(newVal);
    setMuted(newVal);
    localStorage.setItem('comic_sudoku_muted', String(newVal));
    playSound('click');
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setApiKey(val);
    setCustomApiKey(val);
    localStorage.setItem('comic_sudoku_api_key', val);
  };

  // Reset functionality
  const resetBoard = (size: GridSize = 9) => {
    playSound('pop');
    const empty = createEmptyBoard(size);
    setGridSize(size);
    setGrid(empty);
    setInitialGrid(empty);
    setSolution(null);
    setStatusMessage("");
  };

  // Switch tabs handler
  const switchMode = (newMode: AppMode) => {
    playSound('pop');
    setMode(newMode);
    // Default to 9x9 when switching tabs unless we are in Play mode maintaining state
    if (newMode !== AppMode.PLAY) {
      const empty = createEmptyBoard(9);
      setGridSize(9);
      setGrid(empty);
      setInitialGrid(empty);
      setSolution(null);
      setStatusMessage("");
    }
  };

  // --- Handlers for SCAN Mode ---

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    playSound('click');
    setLoading(true);
    setLoadingText("Scanning Puzzle...");
    setStatusMessage("");

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];

        try {
          const extractedGrid = await extractSudokuFromImage(base64Data);
          setGridSize(9); // Scanner currently supports 9x9
          setGrid(extractedGrid);
          setInitialGrid(extractedGrid);
          setSolution(null);
          playSound('success');
        } catch (error) {
          console.error(error);
          setStatusMessage("Could not identify a Sudoku. Try a clearer image.");
          playSound('error');
        } finally {
          setLoading(false);
          // Clear input
          if (event.target) event.target.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setLoading(false);
      setStatusMessage("Error reading file.");
      playSound('error');
    }
  };

  // --- Handlers for PLAY/MANUAL Mode ---

  const handleCellChange = (row: number, col: number, value: number) => {
    if (initialGrid[row][col] !== 0) return;
    const newGrid = grid.map(r => [...r]);
    newGrid[row][col] = value;
    setGrid(newGrid);
  };

  const handleSolve = () => {
    playSound('click');
    setLoading(true);
    setLoadingText("Solving...");

    setTimeout(() => {
      const solved = solveSudoku(grid);
      if (solved) {
        setGrid(solved);
        setStatusMessage("Solved!");
        playSound('success');
      } else {
        setStatusMessage("Unsolvable puzzle.");
        playSound('error');
      }
      setLoading(false);
    }, 100);
  };

  const startNewGame = (size: GridSize, difficulty: 'easy' | 'medium' | 'hard') => {
    playSound('click');
    setLoading(true);
    setLoadingText(`Generating ${size}x${size}...`);
    setGridSize(size);

    setTimeout(() => {
      try {
        const { puzzle, solution: solved } = generateSudoku(size, difficulty);
        setGrid(puzzle);
        setInitialGrid(puzzle);
        setSolution(solved);
        setStatusMessage(`Started ${size}x${size} ${difficulty} game`);
        playSound('success');
      } catch (e) {
        setStatusMessage("Error generating game");
        playSound('error');
      }
      setLoading(false);
    }, 100);
  };

  const handleHint = () => {
    playSound('click');
    if (!solution) return;

    const emptyCells: { r: number, c: number }[] = [];
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (grid[r][c] === 0) {
          emptyCells.push({ r, c });
        }
      }
    }

    if (emptyCells.length > 0) {
      const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      const newGrid = grid.map(r => [...r]);
      newGrid[randomCell.r][randomCell.c] = solution[randomCell.r][randomCell.c];
      setGrid(newGrid);
      playSound('scribble');
    } else {
      setStatusMessage("Board is full!");
    }
  };

  const handleCheck = () => {
    playSound('click');
    if (!solution) return;
    let isCorrect = true;
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (grid[r][c] !== solution[r][c]) {
          isCorrect = false;
          break;
        }
      }
    }
    if (isCorrect) playSound('success');
    else playSound('error');
    setStatusMessage(isCorrect ? "All Correct! 🎉" : "Mistakes found 🤔");
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col font-[Patrick_Hand] bg-[#fef9c3] relative overflow-hidden">
      {loading && <Loader text={loadingText} />}

      {/* --- Top Header --- */}
      <header className="flex-shrink-0 py-2 px-4 flex justify-between items-center max-w-2xl mx-auto w-full z-10">
        <h1 className="text-2xl md:text-4xl font-bold text-black drop-shadow-[2px_2px_0px_rgba(255,255,255,1)]">
          Comic Sudoku
        </h1>
        <div className="flex gap-2">
          <button onClick={() => { playSound('click'); setShowHelp(true); }} className="p-2 bg-white border-[3px] border-black rounded-full shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-sky-200 transition-transform active:scale-95">
            <DoodleIcon name="help" className="w-5 h-5" />
          </button>
          <button onClick={() => { playSound('click'); setShowSettings(true); }} className="p-2 bg-white border-[3px] border-black rounded-full shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-200 transition-transform active:scale-95">
            <DoodleIcon name="settings" className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col px-4 pb-24 max-w-lg mx-auto w-full overflow-y-auto md:overflow-hidden">

        {/* Status Banner */}
        <div className="flex-shrink-0 min-h-[2rem] mb-1 flex items-center justify-center">
          {statusMessage && (
            <div className="bg-white border-[3px] border-black px-4 py-1 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-bounce">
              <span className="font-bold text-sm text-black">{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Grid Area: Flexible height, centers board */}
        <div className="flex-1 min-h-0 flex items-center justify-center my-2 w-full">
          <div className="aspect-square max-h-full w-full max-w-md relative pr-2 pb-2">
            <SudokuBoard
              grid={grid}
              initialGrid={initialGrid}
              onCellChange={handleCellChange}
            />
          </div>
        </div>

        {/* --- Action Controls --- */}
        <div className="flex-shrink-0 flex flex-col gap-2 justify-start min-h-[100px]">

          {/* SCAN MODE */}
          {mode === AppMode.SCAN && (
            <>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleFileUpload} />

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { playSound('click'); cameraInputRef.current?.click(); }} className="bg-sky-300 text-black border-[3px] border-black p-2 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center active:translate-y-1 active:shadow-none hover:bg-sky-200">
                  <DoodleIcon name="camera" className="w-6 h-6 mb-1" />
                  <span className="font-bold text-sm">Camera</span>
                </button>
                <button onClick={() => { playSound('click'); fileInputRef.current?.click(); }} className="bg-yellow-300 text-black border-[3px] border-black p-2 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center active:translate-y-1 active:shadow-none hover:bg-yellow-200">
                  <DoodleIcon name="gallery" className="w-6 h-6 mb-1" />
                  <span className="font-bold text-sm">Upload</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => resetBoard(9)} className="bg-white text-black border-[3px] border-black p-2 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 active:translate-y-1 active:shadow-none">
                  <DoodleIcon name="trash" className="w-5 h-5" /> <span className="text-sm">Clear</span>
                </button>
                <button onClick={handleSolve} className="bg-green-400 text-black border-[3px] border-black p-2 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 active:translate-y-1 active:shadow-none hover:bg-green-300">
                  <DoodleIcon name="solve" className="w-5 h-5" /> <span className="text-sm">Solve</span>
                </button>
              </div>
            </>
          )}

          {/* MANUAL MODE */}
          {mode === AppMode.MANUAL && (
            <>
              <div className="grid grid-cols-2 gap-3 mt-auto">
                <button onClick={() => resetBoard(9)} className="bg-white text-black border-[3px] border-black p-3 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 active:translate-y-1 active:shadow-none">
                  <DoodleIcon name="trash" className="w-5 h-5" /> <span className="text-sm">Clear</span>
                </button>
                <button onClick={handleSolve} className="bg-green-400 text-black border-[3px] border-black p-3 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 active:translate-y-1 active:shadow-none hover:bg-green-300">
                  <DoodleIcon name="solve" className="w-5 h-5" /> <span className="text-sm">Solve</span>
                </button>
              </div>
            </>
          )}

          {/* PLAY MODE */}
          {mode === AppMode.PLAY && (
            <>
              {/* Grid Size & Diff */}
              <div className="flex gap-2 mb-1">
                <div className="flex gap-1">
                  <button onClick={() => resetBoard(4)} className={`px-3 py-1 border-[2px] border-black rounded-xl font-bold text-xs ${gridSize === 4 ? 'bg-pink-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white'}`}>4x4</button>
                  <button onClick={() => resetBoard(9)} className={`px-3 py-1 border-[2px] border-black rounded-xl font-bold text-xs ${gridSize === 9 ? 'bg-pink-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white'}`}>9x9</button>
                </div>
                <div className="flex-1 flex gap-1">
                  {(['easy', 'medium', 'hard'] as const).map((diff) => (
                    <button key={diff} onClick={() => startNewGame(gridSize, diff)} className="flex-1 bg-white hover:bg-yellow-200 text-black border-[2px] border-black py-1 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[10px] sm:text-xs font-bold uppercase active:translate-y-1 active:shadow-none transition-colors">
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tools */}
              <div className="grid grid-cols-3 gap-2">
                <button onClick={handleHint} className="bg-purple-300 text-black border-[3px] border-black p-2 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center active:translate-y-1 active:shadow-none hover:bg-purple-200">
                  <DoodleIcon name="hint" className="w-5 h-5" /> <span className="text-[10px] font-bold">Hint</span>
                </button>
                <button onClick={handleCheck} className="bg-orange-300 text-black border-[3px] border-black p-2 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center active:translate-y-1 active:shadow-none hover:bg-orange-200">
                  <DoodleIcon name="check" className="w-5 h-5" /> <span className="text-[10px] font-bold">Check</span>
                </button>
                <button onClick={() => { playSound('click'); solution && setGrid(solution); }} className="bg-red-300 text-black border-[3px] border-black p-2 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center active:translate-y-1 active:shadow-none hover:bg-red-200">
                  <DoodleIcon name="solve" className="w-5 h-5" /> <span className="text-[10px] font-bold">Give Up</span>
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      {/* --- Bottom Nav --- */}
      <nav className="fixed bottom-0 w-full bg-white border-t-4 border-black p-2 pb-6 flex justify-around z-40 shadow-[0px_-4px_0px_0px_rgba(0,0,0,0.1)]">
        <button onClick={() => switchMode(AppMode.SCAN)} className={`flex flex-col items-center gap-1 w-16 transition-all ${mode === AppMode.SCAN ? '-translate-y-3' : 'opacity-60'}`}>
          <div className={`p-2 rounded-full border-[3px] border-black ${mode === AppMode.SCAN ? 'bg-sky-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-gray-100'}`}>
            <DoodleIcon name="camera" className="w-6 h-6" />
          </div>
          <span className="font-bold text-[10px] uppercase">Scan</span>
        </button>

        <button onClick={() => switchMode(AppMode.MANUAL)} className={`flex flex-col items-center gap-1 w-16 transition-all ${mode === AppMode.MANUAL ? '-translate-y-3' : 'opacity-60'}`}>
          <div className={`p-2 rounded-full border-[3px] border-black ${mode === AppMode.MANUAL ? 'bg-yellow-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-gray-100'}`}>
            <DoodleIcon name="pencil" className="w-6 h-6" />
          </div>
          <span className="font-bold text-[10px] uppercase">Edit</span>
        </button>

        <button onClick={() => switchMode(AppMode.PLAY)} className={`flex flex-col items-center gap-1 w-16 transition-all ${mode === AppMode.PLAY ? '-translate-y-3' : 'opacity-60'}`}>
          <div className={`p-2 rounded-full border-[3px] border-black ${mode === AppMode.PLAY ? 'bg-pink-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-gray-100'}`}>
            <DoodleIcon name="gamepad" className="w-6 h-6" />
          </div>
          <span className="font-bold text-[10px] uppercase">Play</span>
        </button>
      </nav>

      {/* --- Modals --- */}
      {showHelp && (
        <Modal title="How to Use" onClose={() => setShowHelp(false)}>
          <h3 className="font-bold mb-2 text-lg">📷 Scan Mode</h3>
          <p className="mb-4 text-sm">Take a photo or upload a screenshot of an unsolved Sudoku. The AI will fill the board for you! Check the numbers and click "Solve".</p>

          <h3 className="font-bold mb-2 text-lg">✏️ Edit Mode</h3>
          <p className="mb-4 text-sm">Manually type in numbers from a newspaper or book. Click "Solve" to get the answer instantly.</p>

          <h3 className="font-bold mb-2 text-lg">🎮 Play Mode</h3>
          <p className="mb-2 text-sm">Generate endless puzzles! Select 4x4 (Mini) or 9x9 (Standard) size.</p>
          <ul className="list-disc pl-4 text-sm">
            <li><strong>Hint:</strong> Fills one random cell.</li>
            <li><strong>Check:</strong> Tells you if you are on the right track.</li>
          </ul>
        </Modal>
      )}

      {showAbout && (
        <Modal title="About" onClose={() => setShowAbout(false)}>
          <p className="mb-4 font-bold text-center text-xl">Comic Sudoku Solver</p>
          <p className="mb-4 text-sm text-justify">
            A fun, doodle-themed application powered by <strong>Google Gemini AI</strong>.
            Designed to help you solve, play, and enjoy Sudoku puzzles on the go.
          </p>
          <p className="text-xs text-gray-500 text-center mt-8">Version 1.2.0</p>
        </Modal>
      )}

      {showSettings && (
        <Modal title="Settings" onClose={() => setShowSettings(false)}>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center border-b-2 border-gray-200 pb-4">
              <span className="font-bold text-lg">Sound Effects</span>
              <button
                onClick={toggleMute}
                className={`w-14 h-8 rounded-full border-[3px] border-black flex items-center px-1 transition-colors ${isMutedState ? 'bg-gray-300' : 'bg-green-400'}`}
              >
                <div className={`w-5 h-5 bg-white border-[2px] border-black rounded-full transition-transform ${isMutedState ? 'translate-x-0' : 'translate-x-6'}`} />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-bold text-lg">Gemini API Key</label>
              <p className="text-xs text-gray-500">Enter your API key to use the scanning feature. It will be saved on your device.</p>
              <input
                type="password"
                value={apiKey}
                onChange={handleApiKeyChange}
                placeholder="AIzaSy..."
                className="w-full p-2 border-[3px] border-black rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
              />
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default App;