import { Board, CellType, ColorRequirement, Cell } from '../types';

interface RandomBoardOptions {
  cellTypeCounts: {
    [key in CellType]?: number;
  };
  colorRequirementCounts: {
    [key in ColorRequirement]?: number;
  };
  wallPercentage: number;
}

// Modified function to add random cells of a specific type with a specific count
const addRandomCells = (board: Board, cellType: CellType, count: number) => {
  const size = board.length;
  let added = 0;
  let attempts = 0;
  const maxAttempts = size * size * 2; // Prevent infinite loop

  while (added < count && attempts < maxAttempts) {
    attempts++;
    const row = Math.floor(Math.random() * size);
    const col = Math.floor(Math.random() * size);

    // Skip if this cell is already occupied or is the entrance
    if (board[row][col].type !== CellType.Empty) {
      continue;
    }

    board[row][col].type = cellType;
    added++;
  }

  return added; // Return how many were actually added
};

// Modified function to add random color requirements
const addRandomColorRequirements = (board: Board, colorRequirement: ColorRequirement, count: number) => {
  const size = board.length;
  let added = 0;
  let attempts = 0;
  const maxAttempts = size * size * 2; // Prevent infinite loop

  while (added < count && attempts < maxAttempts) {
    attempts++;
    const row = Math.floor(Math.random() * size);
    const col = Math.floor(Math.random() * size);

    // Skip if this cell already has a color requirement
    if (board[row][col].colorRequirement !== ColorRequirement.None) {
      continue;
    }

    board[row][col].colorRequirement = colorRequirement;
    added++;
  }

  return added; // Return how many were actually added
};

export const generateRandomBoard = (size: number, options?: RandomBoardOptions): Board => {
  // Create an empty board
  const board: Board = Array(size).fill(null).map(() =>
    Array(size).fill(null).map(() => ({
      type: CellType.Empty,
      colorRequirement: ColorRequirement.None,
      walls: { top: false, right: false, bottom: false, left: false }
    }))
  );

  // Set entrance at the bottom middle
  board[size - 1][Math.floor(size / 2)].type = CellType.Entrance;

  if (options) {
    // Add specific cell types based on options
    Object.entries(options.cellTypeCounts).forEach(([cellType, count]) => {
      if (cellType !== CellType.Empty && cellType !== CellType.Entrance) {
        addRandomCells(board, cellType as CellType, count || 0);
      }
    });

    // Add color requirements based on options
    Object.entries(options.colorRequirementCounts).forEach(([colorReq, count]) => {
      if (colorReq !== ColorRequirement.None) {
        addRandomColorRequirements(board, colorReq as ColorRequirement, count || 0);
      }
    });

    // Add walls based on percentage
    if (options.wallPercentage > 0) {
      // First, count how many cells are already occupied
      const occupiedCount = board.flat().filter(cell => cell.type !== CellType.Empty).length;

      // Calculate how many walls to add based on percentage of remaining cells
      const remainingCells = size * size - occupiedCount;
      const wallCount = Math.floor(remainingCells * (options.wallPercentage / 100));

      addRandomCells(board, CellType.Wall, wallCount);

      // Add some random walls between cells
      const wallEdgeCount = Math.floor(size * size * (options.wallPercentage / 100) * 0.2);
      for (let i = 0; i < wallEdgeCount; i++) {
        const row = Math.floor(Math.random() * size);
        const col = Math.floor(Math.random() * size);
        const wallSide = ['top', 'right', 'bottom', 'left'][Math.floor(Math.random() * 4)] as 'top' | 'right' | 'bottom' | 'left';

        board[row][col].walls[wallSide] = true;
      }
    }
  } else {
    // Default generation logic (original behavior)
    // Add walls (about 15% of the board)
    const wallCount = Math.floor(size * size * 0.15);
    addRandomCells(board, CellType.Wall, wallCount);

    // Add resource requirements
    addRandomCells(board, CellType.Key, 3);
    // Add locks
    addRandomCells(board, CellType.Lock, 3);
    addRandomCells(board, CellType.Supplies, 3);
    addRandomCells(board, CellType.Mana, 3);

    // Add color requirements
    addRandomColorRequirements(board, ColorRequirement.Red, 2);
    addRandomColorRequirements(board, ColorRequirement.Orange, 2);
    addRandomColorRequirements(board, ColorRequirement.Yellow, 2);
    addRandomColorRequirements(board, ColorRequirement.Green, 2);
    addRandomColorRequirements(board, ColorRequirement.Blue, 2);
    addRandomColorRequirements(board, ColorRequirement.Purple, 2);

    // Add encounters and treasures
    addRandomCells(board, CellType.Encounter, 4);
    addRandomCells(board, CellType.Treasure, 4);

    // Add relics (objectives)
    addRandomCells(board, CellType.Relic, 6);

    // Add some random walls between cells
    const wallEdgeCount = Math.floor(size * size * 0.2);
    for (let i = 0; i < wallEdgeCount; i++) {
      const row = Math.floor(Math.random() * size);
      const col = Math.floor(Math.random() * size);
      const wallSide = ['top', 'right', 'bottom', 'left'][Math.floor(Math.random() * 4)] as 'top' | 'right' | 'bottom' | 'left';

      board[row][col].walls[wallSide] = true;
    }
  }

  return board;
};