import React, { useState } from 'react';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Download, Upload, Save, Trash2, RefreshCw, Grid } from 'lucide-react';
import BoardDesigner from './components/BoardDesigner';
import ActionShapes from './components/ActionShapes';
import CardDrawSimulator from './components/CardDrawSimulator';
import { CellType, ColorRequirement, Board, ActionShape } from './types';
import { generateRandomBoard } from './utils/boardGenerator';
import { placeShapeOnBoard } from './utils/gameLogic';

function App() {
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
    // Level 1 shapes (2 squares)
    { id: 1, value: 1, shape: [[1, 1]], cardValues: ['2', '3'] },
    { id: 2, value: 1, shape: [[1], [1]], cardValues: ['2', '3'] },
    { id: 3, value: 1, shape: [[1, 0], [1, 1]], cardValues: ['2', '3'] },

    // Level 2 shapes (3 squares)
    { id: 4, value: 2, shape: [[1, 1, 1]], cardValues: ['4', '5'] },
    { id: 5, value: 2, shape: [[1, 1], [1, 0]], cardValues: ['4', '5'] },
    { id: 6, value: 2, shape: [[1, 0], [1, 1], [0, 1]], cardValues: ['4', '5'] },

    // Level 3 shapes (4 squares)
    { id: 7, value: 3, shape: [[1, 1], [1, 1]], cardValues: ['6', '7', '8'] },
    { id: 8, value: 3, shape: [[1, 1, 1, 1]], cardValues: ['6', '7', '8'] },
    { id: 9, value: 3, shape: [[1, 1], [0, 1], [0, 1]], cardValues: ['6', '7', '8'] },

    // Level 4 shapes (5 squares)
    { id: 10, value: 4, shape: [[1, 1, 1], [1, 0, 1]], cardValues: ['9', '10'] },
    { id: 11, value: 4, shape: [[1, 1, 1], [1, 1, 0]], cardValues: ['9', '10'] },
    { id: 12, value: 4, shape: [[0, 1, 0], [1, 1, 1], [0, 1, 0]], cardValues: ['9', '10'] },

    // Level 5 shapes (6 squares)
    { id: 13, value: 5, shape: [[1, 1, 1], [1, 1, 1]], cardValues: ['A'] },
    { id: 14, value: 5, shape: [[1, 1, 1, 1, 1, 1]], cardValues: ['A'] },
    { id: 15, value: 5, shape: [[1, 1], [1, 1], [1, 1]], cardValues: ['A'] },
  ]);

  const [savedBoards, setSavedBoards] = useState<{ name: string, board: Board }[]>([]);
  const [currentBoardName, setCurrentBoardName] = useState<string>('Untitled Board');

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
    const newBoard = generateRandomBoard(boardSize);
    setBoard(newBoard);
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
        alert('Error importing board: Invalid file format');
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

  // Update the handlePlaceShape function
  const handlePlaceShape = (
    startRow: number,
    startCol: number,
    shape: number[][],
    cardValue?: CardValue,
    cardSuit?: string
  ) => {
    const newBoard = placeShapeOnBoard(board, shape, startRow, startCol);
    setBoard(newBoard);

    // If this is from a card draw, track the placed shape
    if (cardValue && cardSuit) {
      setPlacedShapes(prev => [
        ...prev,
        { shape, startRow, startCol, cardValue, cardSuit }
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-indigo-700 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Tabletop Game Board Designer</h1>
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
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 flex-grow flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-3/4 bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Dungeon Board Designer</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleGenerateRandomBoard}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded flex items-center"
              >
                <RefreshCw size={18} className="mr-1" /> Generate Random
              </button>
              <div className="flex items-center">
                <button
                  onClick={() => handleResizeBoard(boardSize - 1)}
                  className="bg-gray-300 hover:bg-gray-400 px-2 py-1 rounded-l"
                >
                  -
                </button>
                <div className="bg-gray-200 px-3 py-1 flex items-center">
                  <Grid size={16} className="mr-1" /> {boardSize}x{boardSize}
                </div>
                <button
                  onClick={() => handleResizeBoard(boardSize + 1)}
                  className="bg-gray-300 hover:bg-gray-400 px-2 py-1 rounded-r"
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
          />
        </div>

        <div className="w-full md:w-1/4 space-y-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-3">Tools</h2>

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
                  Erase
                </button>
                <button
                  onClick={() => {
                    setSelectedTool(CellType.Wall);
                    setWallToolActive(false);
                  }}
                  className={`p-2 rounded ${selectedTool === CellType.Wall && !wallToolActive ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'}`}
                >
                  Wall
                </button>
                <button
                  onClick={() => {
                    setSelectedTool(CellType.Entrance);
                    setWallToolActive(false);
                  }}
                  className={`p-2 rounded ${selectedTool === CellType.Entrance && !wallToolActive ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'}`}
                >
                  Entrance
                </button>
                <button
                  onClick={() => {
                    setSelectedTool(CellType.Key);
                    setWallToolActive(false);
                  }}
                  className={`p-2 rounded ${selectedTool === CellType.Key && !wallToolActive ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'}`}
                >
                  Key
                </button>
                <button
                  onClick={() => {
                    setSelectedTool(CellType.Supplies);
                    setWallToolActive(false);
                  }}
                  className={`p-2 rounded ${selectedTool === CellType.Supplies && !wallToolActive ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'}`}
                >
                  Supplies
                </button>
                <button
                  onClick={() => {
                    setSelectedTool(CellType.Mana);
                    setWallToolActive(false);
                  }}
                  className={`p-2 rounded ${selectedTool === CellType.Mana && !wallToolActive ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'}`}
                >
                  Mana
                </button>
                <button
                  onClick={() => {
                    setSelectedTool(CellType.Encounter);
                    setWallToolActive(false);
                  }}
                  className={`p-2 rounded ${selectedTool === CellType.Encounter && !wallToolActive ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'}`}
                >
                  Encounter
                </button>
                <button
                  onClick={() => {
                    setSelectedTool(CellType.Treasure);
                    setWallToolActive(false);
                  }}
                  className={`p-2 rounded ${selectedTool === CellType.Treasure && !wallToolActive ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'}`}
                >
                  Treasure
                </button>
                <button
                  onClick={() => {
                    setSelectedTool(CellType.Relic);
                    setWallToolActive(false);
                  }}
                  className={`p-2 rounded ${selectedTool === CellType.Relic && !wallToolActive ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'}`}
                >
                  Relic
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

          <CardDrawSimulator
            board={board}
            actionShapes={actionShapes}
            onPlaceShape={handlePlaceShape}
            onResetDeck={handleResetDeck} // Add this new prop
          />

          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-3">Action Shapes</h2>
            <ActionShapes shapes={actionShapes} />
          </div>



          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-3">Saved Boards</h2>
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
        </div>
      </main>

      <footer className="bg-gray-800 text-white p-4 text-center">
        <p>Tabletop Game Board Designer &copy; 2025</p>
      </footer>
    </div>
  );
}

export default App;