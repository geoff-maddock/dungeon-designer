import { Board, CellType } from '../types';

// Update findValidPlacement to account for already placed shapes and adjacency rules
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

  // Create a map of all occupied positions from existing shapes
  const occupied = new Set<string>();
  placedShapes.forEach(placed => {
    for (let r = 0; r < placed.shape.length; r++) {
      for (let c = 0; c < placed.shape[0].length; c++) {
        if (placed.shape[r][c] === 1) {
          occupied.add(`${placed.startRow + r},${placed.startCol + c}`);
        }
      }
    }
  });

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
    placedShapes.forEach(placed => {
      for (let r = 0; r < placed.shape.length; r++) {
        for (let c = 0; c < placed.shape[0].length; c++) {
          if (placed.shape[r][c] === 1) {
            const adjacentPositions = [
              { row: placed.startRow + r - 1, col: placed.startCol + c },  // up
              { row: placed.startRow + r + 1, col: placed.startCol + c },  // down
              { row: placed.startRow + r, col: placed.startCol + c - 1 },  // left
              { row: placed.startRow + r, col: placed.startCol + c + 1 }   // right
            ];

            adjacentPositions.forEach(pos => {
              if (!occupied.has(`${pos.row},${pos.col}`)) {
                potentialPositions.push(pos);
              }
            });
          }
        }
      }
    });
  }

  // Try each potential position
  for (const pos of potentialPositions) {
    if (canPlaceShapeAt(board, shape, pos.row, pos.col, occupied)) {
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

// Update canPlaceShapeAt to check for walls and boundaries
const canPlaceShapeAt = (
  board: Board,
  shape: number[][],
  startRow: number,
  startCol: number,
  occupied: Set<string>
): boolean => {
  const rows = board.length;
  const cols = board[0].length;

  // Check if the shape fits within board boundaries
  if (startRow < 0 || startCol < 0 ||
    startRow + shape.length > rows ||
    startCol + shape[0].length > cols) {
    return false;
  }

  // Check each cell where the shape would be placed
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[0].length; c++) {
      if (shape[r][c] === 1) {
        const boardRow = startRow + r;
        const boardCol = startCol + c;
        const key = `${boardRow},${boardCol}`;

        // Check if this position is already occupied
        if (occupied.has(key)) {
          return false;
        }

        // Check if this is a wall cell
        if (board[boardRow][boardCol].type === CellType.Wall) {
          return false;
        }

        // Check for walls on cell boundaries
        // If moving right and there's a left wall in the next cell
        if (c < shape[0].length - 1 && shape[r][c + 1] === 1 &&
          board[boardRow][boardCol].walls.right) {
          return false;
        }

        // If moving down and there's a top wall in the cell below
        if (r < shape.length - 1 && shape[r + 1][c] === 1 &&
          board[boardRow][boardCol].walls.bottom) {
          return false;
        }

        // If moving left and there's a right wall in the previous cell
        if (boardCol > 0 && c > 0 && shape[r][c - 1] === 1 &&
          board[boardRow][boardCol - 1].walls.right) {
          return false;
        }

        // If moving up and there's a bottom wall in the cell above
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