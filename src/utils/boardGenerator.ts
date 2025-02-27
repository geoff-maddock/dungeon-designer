import { Board, CellType, ColorRequirement, Cell } from '../types';

// Helper function to add random cells of a specific type
const addRandomCells = (board: Board, cellType: CellType, count: number) => {
  const size = board.length;
  let added = 0;
  
  while (added < count) {
    const row = Math.floor(Math.random() * size);
    const col = Math.floor(Math.random() * size);
    
    // Skip if this cell is already occupied or is the entrance
    if (board[row][col].type !== CellType.Empty) {
      continue;
    }
    
    board[row][col].type = cellType;
    added++;
  }
};

// Helper function to add random color requirements
const addRandomColorRequirements = (board: Board, colorRequirement: ColorRequirement, count: number) => {
  const size = board.length;
  let added = 0;
  
  while (added < count) {
    const row = Math.floor(Math.random() * size);
    const col = Math.floor(Math.random() * size);
    
    // Skip if this cell already has a color requirement
    if (board[row][col].colorRequirement !== ColorRequirement.None) {
      continue;
    }
    
    board[row][col].colorRequirement = colorRequirement;
    added++;
  }
};

export const generateRandomBoard = (size: number): Board => {
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
  
  // Add walls (about 15% of the board)
  const wallCount = Math.floor(size * size * 0.15);
  addRandomCells(board, CellType.Wall, wallCount);
  
  // Add resource requirements
  addRandomCells(board, CellType.Key, 3);
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
  
  return board;
};