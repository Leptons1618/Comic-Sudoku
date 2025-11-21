import React, { useState, useRef, useEffect } from 'react';
import { SudokuBoard } from './components/SudokuBoard';
import { Loader } from './components/Loader';
import { Modal } from './components/Modal';
import { NumberKeyboard } from './components/NumberKeyboard';
import { DoodleIcon } from './components/DoodleIcon';
import { createEmptyBoard, solveSudoku, generateSudoku } from './services/sudokuLogic';
import { extractSudokuFromImage, setCustomApiKey } from './services/geminiService';
import { SudokuGrid, AppMode, GridSize, CellPosition } from './types';
import { playSound, setMuted } from './services/audioService';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.SCAN);

  const [gridSize, setGridSize] = useState<GridSize>(9);
  const [grid, setGrid] = useState<SudokuGrid>(createEmptyBoard(9));
  const [initialGrid, setInitialGrid] = useState<SudokuGrid>(createEmptyBoard(9));
  const [solution, setSolution] = useState<SudokuGrid | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Thinking...");
  const [statusMessage, setStatusMessage] = useState("");

  const [showHelp, setShowHelp] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showGameConfig, setShowGameConfig] = useState(false);

  // Settings State
  const [isMutedState, setIsMutedState] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [tempApiKey, setTempApiKey] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
  const [hintCells, setHintCells] = useState<CellPosition[]>([]);
  const [animatingHint, setAnimatingHint] = useState<CellPosition | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Load Settings on Mount
  useEffect(() => {
    const savedMuted = localStorage.getItem('comic_sudoku_muted') === 'true';
    const savedKey = localStorage.getItem('comic_sudoku_api_key') || "";

    setIsMutedState(savedMuted);
    setMuted(savedMuted);

    setApiKey(savedKey);
    setTempApiKey(savedKey);
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
    setTempApiKey(e.target.value);
    setSaveMessage("");
  };

  const saveSettings = () => {
    setApiKey(tempApiKey);
    setCustomApiKey(tempApiKey);
    localStorage.setItem('comic_sudoku_api_key', tempApiKey);
    setSaveMessage("Saved!");
    playSound('success');
    setTimeout(() => setSaveMessage(""), 2000);
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
    setSelectedCell(null);
    setHintCells([]);
    setAnimatingHint(null);
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
      setSelectedCell(null);
      setHintCells([]);
      setAnimatingHint(null);
    }
  };

  // --- Helpers ---
  const showStatus = (msg: string, duration = 3000) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(""), duration);
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
          setHintCells([]);
          setAnimatingHint(null);
          playSound('success');
        } catch (error) {
          console.error(error);
          showStatus("Could not identify a Sudoku. Try a clearer image.");
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
      showStatus("Error reading file.");
      playSound('error');
    }
  };

  // --- Handlers for PLAY/MANUAL Mode ---

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
    playSound('click');
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;

    // Check if cell is locked (initial grid)
    if (initialGrid[row][col] !== 0) {
      playSound('error');
      return;
    }

    const newGrid = grid.map(r => [...r]);
    newGrid[row][col] = num;
    setGrid(newGrid);
    playSound('scribble');
  };

  const handleDelete = () => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    if (initialGrid[row][col] !== 0) return;

    const newGrid = grid.map(r => [...r]);
    newGrid[row][col] = 0;
    setGrid(newGrid);
    playSound('scribble');
  };

  const getDisabledNumbers = (): number[] => {
    if (!selectedCell) return [];
    const { row, col } = selectedCell;
    const disabled: number[] = [];
    const size = gridSize;
    const boxSize = Math.sqrt(size);

    // Check Row
    for (let c = 0; c < size; c++) {
      if (grid[row][c] !== 0) disabled.push(grid[row][c]);
    }

    // Check Col
    for (let r = 0; r < size; r++) {
      if (grid[r][col] !== 0) disabled.push(grid[r][col]);
    }

    // Check Subgrid
    const startRow = Math.floor(row / boxSize) * boxSize;
    const startCol = Math.floor(col / boxSize) * boxSize;
    for (let r = 0; r < boxSize; r++) {
      for (let c = 0; c < boxSize; c++) {
        const val = grid[startRow + r][startCol + c];
        if (val !== 0) disabled.push(val);
      }
    }

    return disabled;
  };

  const handleSolve = () => {
    playSound('click');
    setLoading(true);
    setLoadingText("Solving...");

    setTimeout(() => {
      const solved = solveSudoku(grid);
      if (solved) {
        setGrid(solved);
        showStatus("Solved!");
        playSound('success');
      } else {
        showStatus("Unsolvable puzzle.");
        playSound('error');
      }
      setLoading(false);
    }, 100);
  };

  const startNewGame = (size: GridSize, diff: 'easy' | 'medium' | 'hard') => {
    playSound('click');
    setLoading(true);
    setLoadingText(`Generating ${size}x${size}...`);
    setGridSize(size);
    setDifficulty(diff);
    setShowGameConfig(false);

    setTimeout(() => {
      try {
        const { puzzle, solution: solved } = generateSudoku(size, diff);
        setGrid(puzzle);
        setInitialGrid(puzzle);
        setSolution(solved);
        setHintCells([]);
        setAnimatingHint(null);
        showStatus(`Started ${size}x${size} ${diff} game`);
        playSound('success');
      } catch (e) {
        showStatus("Error generating game");
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
      setHintCells(prev => [...prev, { row: randomCell.r, col: randomCell.c }]);
      setAnimatingHint({ row: randomCell.r, col: randomCell.c });
      setTimeout(() => setAnimatingHint(null), 2000);
      playSound('scribble');
    } else {
      showStatus("Board is full!");
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
    showStatus(isCorrect ? "All Correct! 🎉" : "Mistakes found 🤔");
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col font-[Patrick_Hand] bg-[#fef9c3] relative overflow-hidden pt-8 sm:pt-4">
      {loading && <Loader text={loadingText} />}

      {/* --- Top Header --- */}
      <header className="flex-shrink-0 py-2 px-4 flex justify-between items-center max-w-2xl mx-auto w-full z-10 mt-4 sm:mt-0">
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

        {/* Status Banner - Fixed Overlay */}
        <div className="absolute top-16 left-0 w-full z-50 flex justify-center pointer-events-none">
          {statusMessage && (
            <div className="bg-white border-[3px] border-black px-4 py-2 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-bounce pointer-events-auto">
              <span className="font-bold text-sm text-black">{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Grid Area: Flexible height, centers board */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center my-2 w-full relative">

          {/* Toolbar above board */}
          <div className="w-full max-w-md flex justify-between items-end mb-1 pr-2 pl-2">
            {/* Left: Config Button (Play Mode Only) */}
            {mode === AppMode.PLAY && (
              <button onClick={() => setShowGameConfig(true)} className="bg-white text-black border-[2px] border-black px-2 py-1 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 active:translate-y-1 active:shadow-none text-xs font-bold hover:bg-purple-100">
                <DoodleIcon name="settings" className="w-4 h-4" /> Config
              </button>
            )}

            {/* Center: Difficulty Indicator (Play Mode Only) */}
            {mode === AppMode.PLAY && solution && (
              <div className="bg-yellow-300 border-[2px] border-black px-3 py-1 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs font-bold uppercase">
                {gridSize}x{gridSize} - {difficulty}
              </div>
            )}

            {/* Right: Clear Button */}
            <button onClick={() => resetBoard(gridSize)} className="bg-white text-black border-[2px] border-black px-2 py-1 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 active:translate-y-1 active:shadow-none text-xs font-bold hover:bg-red-100 ml-auto">
              <DoodleIcon name="trash" className="w-4 h-4" /> Clear
            </button>
          </div>

          <div className="aspect-square max-h-full w-full max-w-md relative pr-2 pb-2">
            {/* Play Mode Initial State Overlay */}
            {mode === AppMode.PLAY && !solution ? (
              <div className="w-full h-full bg-white/50 border-[4px] border-black border-dashed rounded-3xl flex flex-col items-center justify-center gap-4 p-4">
                <p className="text-xl font-bold text-center">Ready to Play?</p>
                <button onClick={() => startNewGame(9, 'medium')} className="bg-green-400 text-black border-[4px] border-black px-8 py-4 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-2xl font-bold active:translate-y-1 active:shadow-none hover:bg-green-300 animate-pulse">
                  PLAY
                </button>
                <p className="text-sm text-gray-600">Auto-generates 9x9 Medium</p>
              </div>
            ) : (
              <SudokuBoard
                grid={grid}
                initialGrid={initialGrid}
                selectedCell={selectedCell}
                onCellClick={handleCellClick}
                hintCells={hintCells}
                animatingHint={animatingHint}
              />
            )}
          </div>
        </div>

        {/* --- Action Controls --- */}
        <div className="flex-shrink-0 flex flex-col gap-2 justify-start min-h-[100px]">

          {/* SCAN MODE */}
          {mode === AppMode.SCAN && (
            <>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleFileUpload} />

              <div className="grid grid-cols-2 gap-3 mb-4">
                <button onClick={() => { playSound('click'); cameraInputRef.current?.click(); }} className="bg-sky-300 text-black border-[3px] border-black p-2 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center active:translate-y-1 active:shadow-none hover:bg-sky-200">
                  <DoodleIcon name="camera" className="w-6 h-6 mb-1" />
                  <span className="font-bold text-sm">Camera</span>
                </button>
                <button onClick={() => { playSound('click'); fileInputRef.current?.click(); }} className="bg-yellow-300 text-black border-[3px] border-black p-2 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center active:translate-y-1 active:shadow-none hover:bg-yellow-200">
                  <DoodleIcon name="gallery" className="w-6 h-6 mb-1" />
                  <span className="font-bold text-sm">Upload</span>
                </button>
              </div>

              {/* Show Solve only if grid has content AND keyboard is NOT active */}
              {grid.some(row => row.some(c => c !== 0)) && !selectedCell && (
                <div className="flex justify-center mb-2">
                  <button onClick={handleSolve} className="w-full bg-green-400 text-black border-[3px] border-black p-2 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 active:translate-y-1 active:shadow-none hover:bg-green-300">
                    <DoodleIcon name="solve" className="w-5 h-5" /> <span className="text-sm font-bold">Solve Puzzle</span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* MANUAL MODE */}
          {mode === AppMode.MANUAL && !selectedCell && (
            <>
              <div className="flex justify-center mb-2 mt-4">
                <button onClick={handleSolve} className="w-full bg-green-400 text-black border-[3px] border-black p-2 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 active:translate-y-1 active:shadow-none hover:bg-green-300">
                  <DoodleIcon name="solve" className="w-5 h-5" /> <span className="text-sm font-bold">Solve</span>
                </button>
              </div>
            </>
          )}

          {/* PLAY MODE */}
          {mode === AppMode.PLAY && solution && (
            <>
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

        {/* Keyboard - Popup */}
        <NumberKeyboard
          gridSize={gridSize}
          onNumberClick={handleNumberInput}
          onDelete={handleDelete}
          onSolve={mode !== AppMode.PLAY ? handleSolve : undefined}
          disabledNumbers={getDisabledNumbers()}
          visible={!!selectedCell}
          onClose={() => setSelectedCell(null)}
        />
      </main>

      {/* --- Bottom Nav --- */}
      <nav className="fixed bottom-0 w-full bg-white border-t-4 border-black p-2 pb-0 flex justify-around z-40 shadow-[0px_-4px_0px_0px_rgba(0,0,0,0.1)]">
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
      {showGameConfig && (
        <Modal title="New Game" onClose={() => setShowGameConfig(false)}>
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-bold mb-2">Grid Size</h3>
              <div className="flex gap-2">
                <button onClick={() => setGridSize(4)} className={`flex-1 py-2 border-[3px] border-black rounded-xl font-bold ${gridSize === 4 ? 'bg-pink-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white'}`}>4x4 (Mini)</button>
                <button onClick={() => setGridSize(9)} className={`flex-1 py-2 border-[3px] border-black rounded-xl font-bold ${gridSize === 9 ? 'bg-pink-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white'}`}>9x9 (Standard)</button>
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-2">Difficulty</h3>
              <div className="flex flex-col gap-2">
                {(['easy', 'medium', 'hard'] as const).map((diff) => (
                  <button key={diff} onClick={() => startNewGame(gridSize, diff)} className="w-full bg-white hover:bg-yellow-200 text-black border-[3px] border-black py-3 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold uppercase active:translate-y-1 active:shadow-none transition-colors">
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {showHelp && (
        <Modal title="How to Use" onClose={() => setShowHelp(false)}>
          <h3 className="font-bold mb-2 text-lg flex items-center gap-2"><DoodleIcon name="camera" className="w-5 h-5" /> Scan Mode</h3>
          <p className="mb-4 text-sm">Take a photo or upload a screenshot of an unsolved Sudoku. The AI will fill the board for you! Check the numbers and click "Solve".</p>

          <h3 className="font-bold mb-2 text-lg flex items-center gap-2"><DoodleIcon name="pencil" className="w-5 h-5" /> Edit Mode</h3>
          <p className="mb-4 text-sm">Manually type in numbers from a newspaper or book. Click "Solve" to get the answer instantly.</p>

          <h3 className="font-bold mb-2 text-lg flex items-center gap-2"><DoodleIcon name="gamepad" className="w-5 h-5" /> Play Mode</h3>
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
              <div className="flex gap-2">
                <input
                  type="password"
                  value={tempApiKey}
                  onChange={handleApiKeyChange}
                  placeholder="AIzaSy..."
                  className="flex-1 p-2 border-[3px] border-black rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
                <button onClick={saveSettings} className="bg-blue-400 text-white font-bold px-4 py-2 rounded-xl border-[3px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none flex items-center justify-center">
                  <DoodleIcon name="save" className="w-6 h-6" />
                </button>
              </div>
              {saveMessage && <p className="text-green-600 font-bold text-center">{saveMessage}</p>}
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default App;