import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Download, Upload, Save, Trash2, RefreshCw, Grid, Camera, Settings, ChevronDown, ChevronUp, Shuffle } from 'lucide-react';
import BoardDesigner from './components/BoardDesigner';
import ActionShapes from './components/ActionShapes';
import CardDrawSimulator from './components/CardDrawSimulator';
import { CellType, ColorRequirement, Board, ActionShape, PlacedShape, MazeSettings, BoardConfig, EncounterCard } from './types';
import { generateRandomBoard } from './utils/boardGenerator';
import { generateMazeBoard, populateMaze, getShortestPath, generateEncounterCards } from './utils/mazeGenerator';
import { exportBoardAsPNG } from './utils/imageExport';
import RandomBoardSettings from './components/RandomBoardSettings';
import MazeSettingsModal from './components/MazeSettingsModal';
import BoardConfigManager from './components/BoardConfigManager';
import EncounterPanel from './components/EncounterPanel';

import TowerBoard from './components/TowerBoard';
import ForestBoard from './components/ForestBoard';
import CityBoard from './components/CityBoard';
import CharacterBoard from './components/CharacterBoard';
import { CharacterState, DEFAULT_CHARACTER } from './types';

const DEFAULT_RANDOM_BOARD_SETTINGS: { [key in CellType | ColorRequirement]?: number } = {
  [CellType.Key]: 3,
  [CellType.Lock]: 3,
  [CellType.Supplies]: 3,
  [CellType.Mana]: 3,
  [CellType.Encounter]: 4,
  [CellType.Treasure]: 4,
  [CellType.Relic]: 6,
  [CellType.Goal]: 1,
  [CellType.Energy]: 3,
  [CellType.Trap]: 4,
  [CellType.LostSoul]: 4,
  [ColorRequirement.Red]: 2,
  [ColorRequirement.Orange]: 2,
  [ColorRequirement.Yellow]: 2,
  [ColorRequirement.Green]: 2,
  [ColorRequirement.Blue]: 2,
  [ColorRequirement.Purple]: 2,
};
const DEFAULT_WALL_PERCENTAGE = 15;

const DEFAULT_MAZE_SETTINGS: MazeSettings = {
  goalCount: 1,
  goalPathLength: 20,
  coloredItemPercentage: 30,
  difficultyZones: 3,
};

function App() {
  const [currentPage, setCurrentPage] = useState<'dungeon' | 'tower' | 'forest' | 'city' | 'character'>('dungeon');

  const [character, setCharacter] = useState<CharacterState>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('characterState') || 'null');
      if (!stored) return DEFAULT_CHARACTER;
      // Migrate body locations: old format used `wounds` instead of `hits`.
      // Also backfill the top-level `wounds` counter if missing.
      const migratedBody = (stored.body ?? DEFAULT_CHARACTER.body).map((loc: Record<string, unknown>) => ({
        ...loc,
        hits: typeof loc.hits === 'number' ? loc.hits : (typeof loc.wounds === 'number' ? loc.wounds : 0),
      }));
      return { ...DEFAULT_CHARACTER, ...stored, body: migratedBody, wounds: typeof stored.wounds === 'number' ? stored.wounds : 0 };
    } catch {
      return DEFAULT_CHARACTER;
    }
  });

  useEffect(() => {
    localStorage.setItem('characterState', JSON.stringify(character));
  }, [character]);
  const [boardSize, setBoardSize] = useState<number>(16);
  const [board, setBoard] = useState<Board>(() => {
    const initialBoard: Board = Array(16).fill(null).map(() =>
      Array(16).fill(null).map(() => ({
        type: CellType.Empty,
        colorRequirement: ColorRequirement.None,
        walls: { top: false, right: false, bottom: false, left: false }
      }))
    );
    // Set entrance at a default position
    initialBoard[15][8].type = CellType.Entrance;
    return initialBoard;
  });

  const [selectedTool, setSelectedTool] = useState<CellType>(CellType.Empty);
  const [selectedColor, setSelectedColor] = useState<ColorRequirement>(ColorRequirement.None);
  const [wallToolActive, setWallToolActive] = useState<boolean>(false);
  const [selectedWall, setSelectedWall] = useState<'top' | 'right' | 'bottom' | 'left' | null>(null);
  const [placedShapes, setPlacedShapes] = useState<PlacedShape[]>([]);

  const [actionShapes, setActionShapes] = useState<ActionShape[]>([
    // Level 1 shapes (1, 2 squares)
    { id: 1, value: 1, shape: [[1]], cardValues: ['2', '3', '4'] },
    { id: 2, value: 1, shape: [[1], [1]], cardValues: ['2', '3', '4'] },

    // Level 2 shapes (3 squares)
    { id: 4, value: 2, shape: [[1, 1, 1]], cardValues: ['5', '6'] },
    { id: 5, value: 2, shape: [[1, 1], [1, 0]], cardValues: ['5', '6'] },
    { id: 6, value: 2, shape: [[1, 1], [1, 1]], cardValues: ['5', '6'] },

    // Level 3 shapes (4 squares)
    { id: 7, value: 3, shape: [[1, 1, 1], [1, 0]], cardValues: ['7', '8'] },
    { id: 8, value: 3, shape: [[1, 1, 1, 1]], cardValues: ['7', '8'] },
    { id: 9, value: 3, shape: [[0, 1], [1, 1], [1, 0]], cardValues: ['7', '8'] },

    // Level 4 shapes (5 squares)
    { id: 10, value: 4, shape: [[1, 1, 1, 1, 1]], cardValues: ['9', '10'] },
    { id: 11, value: 4, shape: [[1, 1, 1, 1], [1, 0, 0, 0]], cardValues: ['9', '10'] },
    { id: 12, value: 4, shape: [[0, 1, 0], [1, 1, 1], [0, 1, 0]], cardValues: ['9', '10'] },
    { id: 13, value: 4, shape: [[0, 1, 1], [0, 1, 0], [1, 1, 0]], cardValues: ['9', '10'] },

    // Level 5 shapes (6 squares)
    { id: 14, value: 5, shape: [[1, 1, 1, 1, 1], [1, 0, 0, 0, 0]], cardValues: ['A'] },
    { id: 15, value: 5, shape: [[1, 1, 1, 1, 1, 1]], cardValues: ['A'] },
    { id: 16, value: 5, shape: [[1, 1, 1], [1, 1, 1]], cardValues: ['A'] },
    { id: 17, value: 5, shape: [[1, 1], [1, 1], [1, 1]], cardValues: ['A'] },
  ]);

  const [savedBoards, setSavedBoards] = useState<{ name: string, board: Board }[]>([]);
  const [currentBoardName, setCurrentBoardName] = useState<string>('Untitled Board');
  const [showRandomSettings, setShowRandomSettings] = useState<boolean>(false);
  const [showMazeSettings, setShowMazeSettings] = useState<boolean>(false);
  const [mazeSettings, setMazeSettings] = useState<MazeSettings>(DEFAULT_MAZE_SETTINGS);
  const [showGenerateDropdown, setShowGenerateDropdown] = useState<boolean>(false);
  const [showMazeDropdown, setShowMazeDropdown] = useState<boolean>(false);
  const [showMazePaths, setShowMazePaths] = useState<boolean>(false);
  const [showTooltips, setShowTooltips] = useState<boolean>(true);
  const [encounterCards, setEncounterCards] = useState<EncounterCard[]>([]);
  const [hoveredEncounterKey, setHoveredEncounterKey] = useState<string | null>(null);
  const generateDropdownRef = useRef<HTMLDivElement>(null);
  const mazeDropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (generateDropdownRef.current && !generateDropdownRef.current.contains(e.target as Node)) {
        setShowGenerateDropdown(false);
      }
      if (mazeDropdownRef.current && !mazeDropdownRef.current.contains(e.target as Node)) {
        setShowMazeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    tools: true,
    cardDraw: true,
    actionShapes: false,
    savedBoards: false,
    boardConfigs: false,
  });
  const toggleSection = (key: string) =>
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  const [randomBoardSettings, setRandomBoardSettings] = useState<{
    [key in CellType | ColorRequirement]?: number;
  }>(DEFAULT_RANDOM_BOARD_SETTINGS);
  const [wallPercentage, setWallPercentage] = useState<number>(DEFAULT_WALL_PERCENTAGE);

  const [boardConfigs, setBoardConfigs] = useState<BoardConfig[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('dungeonBoardConfigs') || '[]');
    } catch {
      return [];
    }
  });
  const [configName, setConfigName] = useState<string>('My Config');

  const [mazePaths, goalDistances] = useMemo(() => {
    if (!showMazePaths) return [new Set<string>(), new Map<string, number>()] as const;
    let eRow = -1, eCol = -1;
    for (let r = 0; r < board.length; r++)
      for (let c = 0; c < board[0].length; c++)
        if (board[r][c].type === CellType.Entrance) { eRow = r; eCol = c; }
    if (eRow < 0) return [new Set<string>(), new Map<string, number>()] as const;
    const paths = new Set<string>();
    const distances = new Map<string, number>();
    for (let r = 0; r < board.length; r++)
      for (let c = 0; c < board[0].length; c++)
        if (board[r][c].type === CellType.Goal) {
          const path = getShortestPath(board, eRow, eCol, r, c);
          path.forEach(([pr, pc]) => paths.add(`${pr},${pc}`));
          if (path.length > 0) distances.set(`${r},${c}`, path.length - 1);
        }
    return [paths, distances] as const;
  }, [showMazePaths, board]);

  const handleCellClick = (row: number, col: number) => {
    const newBoard = [...board];

    if (wallToolActive && selectedWall) {
      // Toggle wall on the selected side
      newBoard[row][col].walls[selectedWall] = !newBoard[row][col].walls[selectedWall];
    } else {
      // Set the cell type
      newBoard[row][col].type = selectedTool;

      // Set the color requirement
      newBoard[row][col].colorRequirement = selectedColor;
    }

    setBoard(newBoard);
  };

  const handleResetDeck = () => {
    // Clear all placed shapes
    setPlacedShapes([]);
    setTraversalMap(new Map());

    // Reset any traversed markers on the board
    const resetBoard = JSON.parse(JSON.stringify(board)) as Board;
    for (let r = 0; r < resetBoard.length; r++) {
      for (let c = 0; c < resetBoard[0].length; c++) {
        if (resetBoard[r][c].traversed) {
          resetBoard[r][c].traversed = false;
        }
      }
    }
    setBoard(resetBoard);
  };

  const handleSaveBoard = () => {
    const boardExists = savedBoards.findIndex(b => b.name === currentBoardName);
    if (boardExists >= 0) {
      const newSavedBoards = [...savedBoards];
      newSavedBoards[boardExists] = { name: currentBoardName, board: JSON.parse(JSON.stringify(board)) };
      setSavedBoards(newSavedBoards);
    } else {
      setSavedBoards([...savedBoards, { name: currentBoardName, board: JSON.parse(JSON.stringify(board)) }]);
    }
    alert(`Board "${currentBoardName}" saved!`);
  };

  const handleLoadBoard = (index: number) => {
    setBoard(JSON.parse(JSON.stringify(savedBoards[index].board)));
    setCurrentBoardName(savedBoards[index].name);
  };

  const handleDeleteBoard = (index: number) => {
    const newSavedBoards = [...savedBoards];
    newSavedBoards.splice(index, 1);
    setSavedBoards(newSavedBoards);
  };

  const handleGenerateRandomBoard = () => {
    const options = {
      cellTypeCounts: Object.fromEntries(
        Object.entries(randomBoardSettings).filter(([key]) => Object.values(CellType).includes(key as CellType))
      ),
      colorRequirementCounts: Object.fromEntries(
        Object.entries(randomBoardSettings).filter(([key]) => Object.values(ColorRequirement).includes(key as ColorRequirement))
      ),
      wallPercentage: wallPercentage
    };

    const newBoard = generateRandomBoard(boardSize, options);
    setBoard(newBoard);
    setShowRandomSettings(false);
  };

  const handleExportBoard = () => {
    const boardData = JSON.stringify({
      name: currentBoardName,
      board: board,
      actionShapes: actionShapes,
      size: boardSize
    });

    const blob = new Blob([boardData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentBoardName.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBoard = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        setBoard(data.board);
        setCurrentBoardName(data.name);
        if (data.actionShapes) setActionShapes(data.actionShapes);
        if (data.size) setBoardSize(data.size);
      } catch (error) {
        alert('Error importing board: Invalid file format' + error);
      }
    };
    reader.readAsText(file);
  };

  const handleResizeBoard = (newSize: number) => {
    if (newSize < 8 || newSize > 24) return;

    // Create a new board with the new size
    const newBoard: Board = Array(newSize).fill(null).map(() =>
      Array(newSize).fill(null).map(() => ({
        type: CellType.Empty,
        colorRequirement: ColorRequirement.None,
        walls: { top: false, right: false, bottom: false, left: false }
      }))
    );

    // Copy over existing cells where possible
    for (let i = 0; i < Math.min(board.length, newSize); i++) {
      for (let j = 0; j < Math.min(board[0].length, newSize); j++) {
        newBoard[i][j] = JSON.parse(JSON.stringify(board[i][j]));
      }
    }

    // Ensure there's an entrance
    if (!newBoard.flat().some(cell => cell.type === CellType.Entrance)) {
      newBoard[newSize - 1][Math.floor(newSize / 2)].type = CellType.Entrance;
    }

    setBoard(newBoard);
    setBoardSize(newSize);
  };

  const [traversalMap, setTraversalMap] = useState<Map<string, { value: string; suit: string; turnIndex: number }>>(
    new Map()
  );

  /** Mark each cell in the movement path as traversed and record card/turn for overlay. */
  const handleMovePath = (
    path: { row: number; col: number }[],
    card: { value: string; suit: string },
    turnIndex: number
  ) => {
    setBoard(prev => {
      const newBoard = JSON.parse(JSON.stringify(prev)) as Board;
      for (const { row, col } of path) {
        newBoard[row][col].traversed = true;
      }
      return newBoard;
    });
    setTraversalMap(prev => {
      const next = new Map(prev);
      for (const { row, col } of path) {
        // Only set if not already claimed by a previous turn
        if (!next.has(`${row},${col}`)) {
          next.set(`${row},${col}`, { value: card.value, suit: card.suit, turnIndex });
        }
      }
      return next;
    });
  };

  // Add a new function to handle saving the board as PNG
  const handleSaveAsImage = async () => {
    try {
      // Show loading state
      const loadingToast = document.createElement('div');
      loadingToast.className = 'fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow-lg z-50';
      loadingToast.textContent = 'Generating image...';
      document.body.appendChild(loadingToast);

      // Generate the image (this might take a moment)
      const dataUrl = await exportBoardAsPNG(board);

      // Create a download link
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${currentBoardName.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Remove loading toast and show success
      document.body.removeChild(loadingToast);
      const successToast = document.createElement('div');
      successToast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50';
      successToast.textContent = 'Image saved successfully!';
      document.body.appendChild(successToast);

      // Remove success toast after 2 seconds
      setTimeout(() => {
        document.body.removeChild(successToast);
      }, 2000);
    } catch (error) {
      alert('Error saving image: ' + error);
    }
  };

  const handleSaveSettings = (
    newSettings: { [key in CellType | ColorRequirement]?: number },
    newWallPercentage: number
  ) => {
    setRandomBoardSettings(newSettings);
    setWallPercentage(Math.max(0, Math.min(100, newWallPercentage)));
    setShowRandomSettings(false);
  };

  // Add this function in App.tsx
  const handleResetBoard = () => {
    // Create a fresh empty board
    const initialBoard: Board = Array(boardSize).fill(null).map(() =>
      Array(boardSize).fill(null).map(() => ({
        type: CellType.Empty,
        colorRequirement: ColorRequirement.None,
        walls: { top: false, right: false, bottom: false, left: false }
      }))
    );

    // Set entrance at default position
    initialBoard[boardSize - 1][Math.floor(boardSize / 2)].type = CellType.Entrance;

    // Reset the board
    setBoard(initialBoard);

    // Reset placed shapes
    setPlacedShapes([]);

    // Show confirmation message
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50';
    toast.textContent = 'Board has been reset to initial state';
    document.body.appendChild(toast);

    // Remove message after 2 seconds
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 2000);
  };

  const handleTrueRandomBoard = () => {
    const newBoard = generateRandomBoard(boardSize);
    setBoard(newBoard);
    setPlacedShapes([]);
  };

  const handleGenerateMaze = () => {
    const newBoard = generateMazeBoard(boardSize, mazeSettings);
    setBoard(newBoard);
    setPlacedShapes([]);
  };

  const handleSaveConfig = (name: string) => {
    const newConfig: BoardConfig = {
      id: Date.now().toString(),
      name,
      boardSize,
      cellTypeCounts: Object.fromEntries(
        Object.entries(randomBoardSettings).filter(([key]) =>
          Object.values(CellType).includes(key as CellType)
        )
      ) as { [key in CellType]?: number },
      colorRequirementCounts: Object.fromEntries(
        Object.entries(randomBoardSettings).filter(([key]) =>
          Object.values(ColorRequirement).includes(key as ColorRequirement)
        )
      ) as { [key in ColorRequirement]?: number },
      wallPercentage,
      mazeSettings,
      createdAt: new Date().toISOString(),
    };
    const updated = [...boardConfigs, newConfig];
    setBoardConfigs(updated);
    localStorage.setItem('dungeonBoardConfigs', JSON.stringify(updated));
    setConfigName(name);
  };

  const handleLoadConfig = (config: BoardConfig) => {
    setBoardSize(config.boardSize);
    const merged: { [key in CellType | ColorRequirement]?: number } = {
      ...config.cellTypeCounts,
      ...config.colorRequirementCounts,
    };
    setRandomBoardSettings(merged);
    setWallPercentage(config.wallPercentage);
    setMazeSettings(config.mazeSettings);
    setConfigName(config.name);
  };

  const handleDeleteConfig = (id: string) => {
    const updated = boardConfigs.filter(c => c.id !== id);
    setBoardConfigs(updated);
    localStorage.setItem('dungeonBoardConfigs', JSON.stringify(updated));
  };

  const handleExportConfigs = () => {
    const data = JSON.stringify(boardConfigs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'board-configs.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportConfigs = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as BoardConfig[];
        if (!Array.isArray(data)) throw new Error('Invalid format');
        const merged = [
          ...boardConfigs,
          ...data.filter(d => !boardConfigs.some(c => c.id === d.id)),
        ];
        setBoardConfigs(merged);
        localStorage.setItem('dungeonBoardConfigs', JSON.stringify(merged));
      } catch {
        alert('Error importing configs: invalid file format');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handlePopulateMaze = () => {
    const cellTypeCounts = Object.fromEntries(
      Object.entries(randomBoardSettings).filter(([key]) =>
        Object.values(CellType).includes(key as CellType)
      )
    ) as Partial<Record<CellType, number>>;
    const colorRequirementCounts = Object.fromEntries(
      Object.entries(randomBoardSettings).filter(([key]) =>
        Object.values(ColorRequirement).includes(key as ColorRequirement)
      )
    ) as Partial<Record<ColorRequirement, number>>;
    const newBoard = populateMaze(board, cellTypeCounts, colorRequirementCounts, mazeSettings.placementStrategy, mazeSettings.coloredItemPercentage ?? 0);
    setBoard(newBoard);
    setPlacedShapes([]);
    setEncounterCards(generateEncounterCards(newBoard, mazeSettings.difficultyZones ?? 0));
  };

  const navItems: { page: 'dungeon' | 'tower' | 'forest' | 'city' | 'character'; label: string; icon: string }[] = [
    { page: 'dungeon', label: 'Dungeon', icon: '🏰' },
    { page: 'tower', label: 'Tower', icon: '🗼' },
    { page: 'forest', label: 'Forest', icon: '🌲' },
    { page: 'city', label: 'City', icon: '🏙' },
    { page: 'character', label: 'Character', icon: '⚔️' },
  ];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Left Sidebar Navigation */}
      <aside className="w-48 bg-gray-900 text-white flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-base font-bold leading-tight text-indigo-300">Dungeon<br />Designer</h1>
        </div>
        <nav className="flex flex-col flex-1 p-2 space-y-1 mt-2">
          {navItems.map(({ page, label, icon }) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`flex items-center gap-3 px-3 py-2 rounded text-left w-full transition-colors ${currentPage === page
                ? 'bg-indigo-600 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
            >
              <span className="text-lg">{icon}</span>
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700 text-xs text-gray-500 text-center">
          &copy; 2025
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {currentPage === 'dungeon' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <header className="bg-indigo-700 text-white p-4 shadow-md flex-shrink-0">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Dungeon Board Designer</h2>
                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    value={currentBoardName}
                    onChange={(e) => setCurrentBoardName(e.target.value)}
                    className="px-3 py-1 rounded text-black"
                    placeholder="Board Name"
                  />
                  <button
                    onClick={handleSaveBoard}
                    className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded flex items-center"
                  >
                    <Save size={18} className="mr-1" /> Save
                  </button>
                  <button
                    onClick={handleExportBoard}
                    className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded flex items-center"
                  >
                    <Download size={18} className="mr-1" /> Export
                  </button>
                  <label className="bg-orange-600 hover:bg-orange-700 px-3 py-1 rounded flex items-center cursor-pointer">
                    <Upload size={18} className="mr-1" /> Import
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportBoard}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={handleSaveAsImage}
                    className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded flex items-center"
                  >
                    <Camera size={18} className="mr-1" /> Save as PNG
                  </button>
                  <button
                    onClick={() => setShowRandomSettings(true)}
                    className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded flex items-center"
                  >
                    <Settings size={18} className="mr-1" /> Settings
                  </button>
                  <button
                    onClick={() => setShowMazeSettings(true)}
                    className="bg-teal-600 hover:bg-teal-700 px-3 py-1 rounded flex items-center"
                  >
                    <Settings size={18} className="mr-1" /> Maze Settings
                  </button>
                </div>
              </div>
            </header>

            <main className="p-4 flex-1 overflow-auto flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-2/3 bg-white rounded-lg shadow-md p-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleResetBoard}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded flex items-center"
                    >
                      <RefreshCw size={18} className="mr-1" /> Reset Board
                    </button>
                    <div className="relative" ref={generateDropdownRef}>
                      <div className="flex">
                        <button
                          onClick={handleGenerateRandomBoard}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-l flex items-center"
                        >
                          <Grid size={18} className="mr-1" /> Generate Board
                        </button>
                        <button
                          onClick={() => setShowGenerateDropdown(prev => !prev)}
                          className="bg-green-600 hover:bg-green-700 text-white px-2 rounded-r border-l border-green-500 flex items-center"
                          aria-label="More generate options"
                        >
                          <ChevronDown size={16} />
                        </button>
                      </div>
                      {showGenerateDropdown && (
                        <div className="absolute left-0 top-full mt-1 bg-green-50 border border-green-200 rounded shadow-lg z-10 min-w-full">
                          <button
                            onClick={() => { handleTrueRandomBoard(); setShowGenerateDropdown(false); }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-800 hover:bg-green-100 whitespace-nowrap"
                          >
                            <Shuffle size={15} /> True Random
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="relative" ref={mazeDropdownRef}>
                      <div className="flex">
                        <button
                          onClick={handleGenerateMaze}
                          className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 rounded-l flex items-center"
                        >
                          <Grid size={18} className="mr-1" /> Generate Maze
                        </button>
                        <button
                          onClick={() => setShowMazeDropdown(prev => !prev)}
                          className="bg-teal-600 hover:bg-teal-700 text-white px-2 rounded-r border-l border-teal-500 flex items-center"
                          aria-label="More maze options"
                        >
                          <ChevronDown size={16} />
                        </button>
                      </div>
                      {showMazeDropdown && (
                        <div className="absolute left-0 top-full mt-1 bg-teal-50 border border-teal-200 rounded shadow-lg z-10 min-w-full">
                          <button
                            onClick={() => { handlePopulateMaze(); setShowMazeDropdown(false); }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-teal-800 hover:bg-teal-100 whitespace-nowrap"
                          >
                            <Shuffle size={15} /> Populate Maze
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setShowMazePaths(prev => !prev)}
                      className={`px-3 py-1 rounded flex items-center text-white text-sm ${showMazePaths ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-500 hover:bg-gray-600'
                        }`}
                      title="Highlight shortest path from Entrance to each Goal"
                    >
                      🗺 Show Path
                    </button>
                    <button
                      onClick={() => setShowTooltips(prev => !prev)}
                      className={`px-3 py-1 rounded flex items-center text-white text-sm ${showTooltips ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-gray-500 hover:bg-gray-600'
                        }`}
                      title="Toggle cell tooltips"
                    >
                      💬 Tooltips
                    </button>
                    <div className="flex items-center ml-2">
                      <button
                        onClick={() => handleResizeBoard(boardSize - 1)}
                        className="bg-gray-300 hover:bg-gray-400 px-2 py-1 rounded-l"
                        disabled={boardSize <= 8}
                      >
                        -
                      </button>
                      <div className="bg-gray-200 px-3 py-1 flex items-center">
                        <Grid size={16} className="mr-1" /> {boardSize}x{boardSize}
                      </div>
                      <button
                        onClick={() => handleResizeBoard(boardSize + 1)}
                        className="bg-gray-300 hover:bg-gray-400 px-2 py-1 rounded-r"
                        disabled={boardSize >= 24}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <BoardDesigner
                  board={board}
                  onCellClick={handleCellClick}
                  placedShapes={placedShapes}
                  highlightedCells={mazePaths}
                  goalDistances={goalDistances}
                  showTooltips={showTooltips}
                  pinnedCell={hoveredEncounterKey}
                  traversedCells={traversalMap}
                />
                {encounterCards.length > 0 && (
                  <div className="mt-4 bg-white rounded-lg shadow-md p-4">
                    <EncounterPanel
                      cards={encounterCards}
                      difficultyZones={mazeSettings.difficultyZones ?? 3}
                      onHoverCard={setHoveredEncounterKey}
                    />
                  </div>
                )}
              </div>

              <div className="w-full md:w-1/3 space-y-4">
                <div className="bg-white rounded-lg shadow-md">
                  <button
                    onClick={() => toggleSection('tools')}
                    className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 rounded-lg"
                  >
                    <h2 className="text-lg font-semibold">Tools</h2>
                    {expandedSections.tools ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {expandedSections.tools && (
                    <div className="px-4 pb-4">
                      <div className="mb-4">
                        <h3 className="text-md font-medium mb-2">Cell Types</h3>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => {
                              setSelectedTool(CellType.Empty);
                              setWallToolActive(false);
                            }}
                            className={`p-2 rounded ${selectedTool === CellType.Empty && !wallToolActive ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'}`}
                          >
                            🛢️ Erase
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTool(CellType.Wall);
                              setWallToolActive(false);
                            }}
                            className={`p-2 rounded ${selectedTool === CellType.Wall && !wallToolActive ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'}`}
                          >
                            ⬛ Wall
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTool(CellType.Entrance);
                              setWallToolActive(false);
                            }}
                            className={`p-2 rounded ${selectedTool === CellType.Entrance && !wallToolActive ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'}`}
                          >
                            🚪 Entrance
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTool(CellType.Key);
                              setWallToolActive(false);
                            }}
                            className={`p-2 rounded ${selectedTool === CellType.Key && !wallToolActive ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'}`}
                          >
                            🔑 Key
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTool(CellType.Lock);
                              setWallToolActive(false);
                            }}
                            className={`p-2 rounded ${selectedTool === CellType.Lock && !wallToolActive ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'}`}
                          >
                            🔒 Lock
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTool(CellType.Supplies);
                              setWallToolActive(false);
                            }}
                            className={`p-2 rounded ${selectedTool === CellType.Supplies && !wallToolActive ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'}`}
                          >
                            🎒 Supplies
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTool(CellType.Mana);
                              setWallToolActive(false);
                            }}
                            className={`p-2 rounded ${selectedTool === CellType.Mana && !wallToolActive ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'}`}
                          >
                            ✨ Mana
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTool(CellType.Encounter);
                              setWallToolActive(false);
                            }}
                            className={`p-2 rounded ${selectedTool === CellType.Encounter && !wallToolActive ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'}`}
                          >
                            👾 Encounter
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTool(CellType.Treasure);
                              setWallToolActive(false);
                            }}
                            className={`p-2 rounded ${selectedTool === CellType.Treasure && !wallToolActive ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'}`}
                          >
                            💎 Treasure
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTool(CellType.Relic);
                              setWallToolActive(false);
                            }}
                            className={`p-2 rounded ${selectedTool === CellType.Relic && !wallToolActive ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'}`}
                          >
                            🏆 Relic
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTool(CellType.Goal);
                              setWallToolActive(false);
                            }}
                            className={`p-2 rounded ${selectedTool === CellType.Goal && !wallToolActive ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'}`}
                          >
                            ⭐ Goal
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTool(CellType.Energy);
                              setWallToolActive(false);
                            }}
                            className={`p-2 rounded ${selectedTool === CellType.Energy && !wallToolActive ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'}`}
                          >
                            ✚ Energy
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTool(CellType.Trap);
                              setWallToolActive(false);
                            }}
                            className={`p-2 rounded ${selectedTool === CellType.Trap && !wallToolActive ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'}`}
                          >
                            💣 Trap
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTool(CellType.LostSoul);
                              setWallToolActive(false);
                            }}
                            className={`p-2 rounded ${selectedTool === CellType.LostSoul && !wallToolActive ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'}`}
                          >
                            🕯️ Lost Soul
                          </button>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h3 className="text-md font-medium mb-2">Wall Placement</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              setWallToolActive(true);
                              setSelectedWall('top');
                            }}
                            className={`p-2 rounded ${wallToolActive && selectedWall === 'top' ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'}`}
                          >
                            Top Wall
                          </button>
                          <button
                            onClick={() => {
                              setWallToolActive(true);
                              setSelectedWall('right');
                            }}
                            className={`p-2 rounded ${wallToolActive && selectedWall === 'right' ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'}`}
                          >
                            Right Wall
                          </button>
                          <button
                            onClick={() => {
                              setWallToolActive(true);
                              setSelectedWall('bottom');
                            }}
                            className={`p-2 rounded ${wallToolActive && selectedWall === 'bottom' ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'}`}
                          >
                            Bottom Wall
                          </button>
                          <button
                            onClick={() => {
                              setWallToolActive(true);
                              setSelectedWall('left');
                            }}
                            className={`p-2 rounded ${wallToolActive && selectedWall === 'left' ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'}`}
                          >
                            Left Wall
                          </button>
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold mt-4 mb-2">Color Requirements</h3>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <button
                          onClick={() => {
                            setSelectedColor(ColorRequirement.None);
                          }}
                          className={`p-2 rounded ${selectedColor === ColorRequirement.None ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'}`}
                        >
                          None
                        </button>
                        <button
                          onClick={() => {
                            setSelectedColor(ColorRequirement.Red);
                          }}
                          className={`p-2 rounded ${selectedColor === ColorRequirement.Red ? 'bg-blue-100 border-2 border-blue-500' : 'bg-red-100'}`}
                        >
                          Red
                        </button>
                        <button
                          onClick={() => {
                            setSelectedColor(ColorRequirement.Orange);
                          }}
                          className={`p-2 rounded ${selectedColor === ColorRequirement.Orange ? 'bg-blue-100 border-2 border-blue-500' : 'bg-orange-100'}`}
                        >
                          Orange
                        </button>
                        <button
                          onClick={() => {
                            setSelectedColor(ColorRequirement.Yellow);
                          }}
                          className={`p-2 rounded ${selectedColor === ColorRequirement.Yellow ? 'bg-blue-100 border-2 border-blue-500' : 'bg-yellow-100'}`}
                        >
                          Yellow
                        </button>
                        <button
                          onClick={() => {
                            setSelectedColor(ColorRequirement.Green);
                          }}
                          className={`p-2 rounded ${selectedColor === ColorRequirement.Green ? 'bg-blue-100 border-2 border-blue-500' : 'bg-green-100'}`}
                        >
                          Green
                        </button>
                        <button
                          onClick={() => {
                            setSelectedColor(ColorRequirement.Blue);
                          }}
                          className={`p-2 rounded ${selectedColor === ColorRequirement.Blue ? 'bg-blue-100 border-2 border-blue-500' : 'bg-blue-100'}`}
                        >
                          Blue
                        </button>
                        <button
                          onClick={() => {
                            setSelectedColor(ColorRequirement.Purple);
                          }}
                          className={`p-2 rounded ${selectedColor === ColorRequirement.Purple ? 'bg-blue-100 border-2 border-blue-500' : 'bg-purple-100'}`}
                        >
                          Purple
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-md">
                  <button
                    onClick={() => toggleSection('cardDraw')}
                    className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 rounded-lg"
                  >
                    <h2 className="text-lg font-semibold">Card Draw Simulator</h2>
                    {expandedSections.cardDraw ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {expandedSections.cardDraw && (
                    <div className="px-4 pb-4">
                      <CardDrawSimulator
                        board={board}
                        character={character}
                        encounterCards={encounterCards}
                        onCharacterChange={setCharacter}
                        onMovePath={handleMovePath}
                        onResetDeck={handleResetDeck}
                      />
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-md">
                  <button
                    onClick={() => toggleSection('actionShapes')}
                    className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 rounded-lg"
                  >
                    <h2 className="text-lg font-semibold">Action Shapes</h2>
                    {expandedSections.actionShapes ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {expandedSections.actionShapes && (
                    <div className="px-4 pb-4">
                      <ActionShapes shapes={actionShapes} />
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-md">
                  <button
                    onClick={() => toggleSection('savedBoards')}
                    className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 rounded-lg"
                  >
                    <h2 className="text-lg font-semibold">Saved Boards</h2>
                    {expandedSections.savedBoards ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {expandedSections.savedBoards && (
                    <div className="px-4 pb-4">
                      {savedBoards.length === 0 ? (
                        <p className="text-gray-500 italic">No saved boards yet</p>
                      ) : (
                        <ul className="space-y-2">
                          {savedBoards.map((savedBoard, index) => (
                            <li key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span>{savedBoard.name}</span>
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleLoadBoard(index)}
                                  className="text-blue-600 hover:text-blue-800 p-1"
                                >
                                  Load
                                </button>
                                <button
                                  onClick={() => handleDeleteBoard(index)}
                                  className="text-red-600 hover:text-red-800 p-1"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-md">
                  <button
                    onClick={() => toggleSection('boardConfigs')}
                    className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 rounded-lg"
                  >
                    <h2 className="text-lg font-semibold">Board Configs</h2>
                    {expandedSections.boardConfigs ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {expandedSections.boardConfigs && (
                    <div className="px-4 pb-4">
                      <BoardConfigManager
                        configs={boardConfigs}
                        currentConfigName={configName}
                        onSaveConfig={handleSaveConfig}
                        onLoadConfig={handleLoadConfig}
                        onDeleteConfig={handleDeleteConfig}
                        onExportConfigs={handleExportConfigs}
                        onImportConfigs={handleImportConfigs}
                      />
                    </div>
                  )}
                </div>
              </div>
            </main>

            {showMazeSettings && (
              <MazeSettingsModal
                settings={mazeSettings}
                onSave={(s) => { setMazeSettings(s); setShowMazeSettings(false); }}
                onClose={() => setShowMazeSettings(false)}
              />
            )}

            {showRandomSettings && (
              <RandomBoardSettings
                settings={randomBoardSettings}
                wallCount={wallPercentage}
                defaultSettings={DEFAULT_RANDOM_BOARD_SETTINGS}
                defaultWallCount={DEFAULT_WALL_PERCENTAGE}
                onSave={handleSaveSettings}
                onClose={() => setShowRandomSettings(false)}
              />
            )}
          </div>
        )}

        {currentPage === 'tower' && <div className="flex-1 overflow-auto"><TowerBoard /></div>}
        {currentPage === 'forest' && <div className="flex-1 overflow-auto"><ForestBoard /></div>}
        {currentPage === 'city' && <div className="flex-1 overflow-auto"><CityBoard /></div>}
        {currentPage === 'character' && <div className="flex-1 overflow-auto"><CharacterBoard character={character} onChange={setCharacter} /></div>}

      </div>
    </div>
  );
}

export default App;
