import { Board, CellType, PlacedShape, CardValue } from '../types';
import { CardDraw } from '../types';

// Update findValidPlacement to ensure the adjacency rule is enforced
export const findValidPlacement = (
  board: Board,
  shape: number[][],
  placedShapes: PlacedShape[]
): { row: number, col: number } | null => {
  // Find entrance position first
  let entranceRow = -1;
  let entranceCol = -1;

  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) {
      if (board[r][c].type === CellType.Entrance) {
        entranceRow = r;
        entranceCol = c;
        break;
      }
    }
    if (entranceRow !== -1) break;
  }

  if (entranceRow === -1) return null; // No entrance found

  // Generate all potential starting positions
  const potentialPositions: { row: number, col: number }[] = [];

  // If no shapes are placed yet, the first shape must cover the entrance
  if (placedShapes.length === 0) {
    // Try different positions that would cover the entrance
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[0].length; c++) {
        if (shape[r][c] === 1) {
          potentialPositions.push({
            row: entranceRow - r,
            col: entranceCol - c
          });
        }
      }
    }
  } else {
    // For subsequent shapes, find all positions adjacent to existing shapes
    const adjacentPositions = new Set<string>();

    placedShapes.forEach(placed => {
      for (let r = 0; r < placed.shape.length; r++) {
        for (let c = 0; c < placed.shape[0].length; c++) {
          if (placed.shape[r][c] === 1) {
            // Add all four adjacent positions
            adjacentPositions.add(`${placed.startRow + r - 1},${placed.startCol + c}`); // up
            adjacentPositions.add(`${placed.startRow + r + 1},${placed.startCol + c}`); // down
            adjacentPositions.add(`${placed.startRow + r},${placed.startCol + c - 1}`); // left
            adjacentPositions.add(`${placed.startRow + r},${placed.startCol + c + 1}`); // right
          }
        }
      }
    });

    // Convert adjacency set back to positions array
    adjacentPositions.forEach(pos => {
      const [row, col] = pos.split(',').map(Number);
      potentialPositions.push({ row, col });
    });
  }

  // Try each potential position
  for (const pos of potentialPositions) {
    if (canPlaceShapeAt(board, shape, pos.row, pos.col, placedShapes)) {
      return pos;
    }
  }

  return null;
};

// Add this function to rotate a shape (90 degrees clockwise)
export const rotateShape = (shape: number[][]): number[][] => {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated = Array(cols).fill(0).map(() => Array(rows).fill(0));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rotated[c][rows - 1 - r] = shape[r][c];
    }
  }

  return rotated;
};

// Removed unused findTraversedCells function

// Update canPlaceShapeAt to check for overlaps with existing shapes
const canPlaceShapeAt = (
  board: Board,
  shape: number[][],
  startRow: number,
  startCol: number,
  placedShapes: PlacedShape[]
): boolean => {
  const rows = board.length;
  const cols = board[0].length;

  // Check if the shape fits within board boundaries
  if (startRow < 0 || startCol < 0 ||
    startRow + shape.length > rows ||
    startCol + shape[0].length > cols) {
    return false;
  }

  // Create a map of all occupied positions from existing shapes
  const occupiedByShapes = new Set<string>();
  placedShapes.forEach(placed => {
    for (let r = 0; r < placed.shape.length; r++) {
      for (let c = 0; c < placed.shape[0].length; c++) {
        if (placed.shape[r][c] === 1) {
          occupiedByShapes.add(`${placed.startRow + r},${placed.startCol + c}`);
        }
      }
    }
  });

  // Check each cell where the shape would be placed
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[0].length; c++) {
      if (shape[r][c] === 1) {
        const boardRow = startRow + r;
        const boardCol = startCol + c;

        // Check if this position is already occupied by another shape
        if (occupiedByShapes.has(`${boardRow},${boardCol}`)) {
          return false;
        }

        // Check if this is a wall cell - cannot overlap walls
        if (board[boardRow][boardCol].type === CellType.Wall) {
          return false;
        }

        // Check for walls on cell boundaries
        if (c < shape[0].length - 1 && shape[r][c + 1] === 1 &&
          board[boardRow][boardCol].walls.right) {
          return false;
        }

        if (r < shape.length - 1 && shape[r + 1][c] === 1 &&
          board[boardRow][boardCol].walls.bottom) {
          return false;
        }

        if (boardCol > 0 && c > 0 && shape[r][c - 1] === 1 &&
          board[boardRow][boardCol - 1].walls.right) {
          return false;
        }

        if (boardRow > 0 && r > 0 && shape[r - 1][c] === 1 &&
          board[boardRow - 1][boardCol].walls.bottom) {
          return false;
        }
      }
    }
  }

  return true;
};

// Update placeShapeOnBoard to return the modified board
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
        newBoard[boardRow][boardCol].traversed = true;
      }
    }
  }

  return newBoard;
};

// Create a standard 52-card deck
export const createStandardDeck = (): CardDraw[] => {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
  const values: CardValue[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck: CardDraw[] = [];

  // Create exactly one of each card
  for (const suit of suits) {
    for (const value of values) {
      deck.push({
        suit,
        value,
        isPlaced: false
      });
    }
  }

  return deck;
};

// Fisher-Yates shuffle algorithm for the deck
export const shuffleDeck = <T>(deck: T[]): T[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};