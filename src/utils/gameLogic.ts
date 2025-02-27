import { Board, CellType } from '../types';

// Find a valid placement for a shape on the board
export const findValidPlacement = (
  board: Board,
  shape: number[][]
): { row: number, col: number } | null => {
  // First, find all cells that have been traversed (entrance or connected to entrance)
  const traversedCells = findTraversedCells(board);

  // For each traversed cell, try to place the shape
  for (const cell of traversedCells) {
    // Try to place the shape with the top-left corner at this cell
    if (canPlaceShapeAt(board, shape, cell.row, cell.col)) {
      return { row: cell.row, col: cell.col };
    }
  }

  return null;
};

const findTraversedCells = (board: Board): { row: number, col: number }[] => {
  const traversed: { row: number, col: number }[] = [];
  const visited = Array(board.length).fill(false).map(() => Array(board[0].length).fill(false));

  // Find entrance
  let entranceRow = -1;
  let entranceCol = -1;

  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) {
      if (board[r][c].type === CellType.Entrance || board[r][c].traversed === true) {
        traversed.push({ row: r, col: c });
        visited[r][c] = true;

        if (board[r][c].type === CellType.Entrance) {
          entranceRow = r;
          entranceCol = c;
        }
      }
    }
  }

  if (traversed.length === 0) return []; // No entrance or traversed cells found

  return traversed;
};

// Check if a shape can be placed at a specific position
const canPlaceShapeAt = (
  board: Board,
  shape: number[][],
  startRow: number,
  startCol: number
): boolean => {
  // Check if the shape fits within the board boundaries
  if (startRow + shape.length > board.length ||
    startCol + shape[0].length > board[0].length) {
    return false;
  }

  // Check if all cells in the shape can be placed
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[0].length; c++) {
      if (shape[r][c] === 1) {
        const boardRow = startRow + r;
        const boardCol = startCol + c;

        // Check if the cell is empty or already has a valid type
        if (board[boardRow][boardCol].type === CellType.Wall) {
          return false;
        }
      }
    }
  }

  return true;
};

export const placeShapeOnBoard = (
  board: Board,
  shape: number[][],
  startRow: number,
  startCol: number
): Board => {
  const newBoard = JSON.parse(JSON.stringify(board)) as Board;

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[0].length; c++) {
      if (shape[r][c] === 1) {
        const boardRow = startRow + r;
        const boardCol = startCol + c;

        // Mark this cell as traversed
        if (!newBoard[boardRow][boardCol].traversed) {
          newBoard[boardRow][boardCol].traversed = true;
        }
      }
    }
  }

  return newBoard;
};