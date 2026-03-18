import { Board, CellType, PlacedShape, CardValue, MovementStep, TurnEvent, TurnRecord } from '../types';
import { CardDraw } from '../types';

// ---------------------------------------------------------------------------
// Wall-respecting frontier
// ---------------------------------------------------------------------------

/**
 * Returns the set of cells (as "row,col" strings) that are directly reachable
 * from any cell already covered by placedShapes — i.e. adjacent and not
 * separated by a wall — and not themselves covered by a placed shape.
 */
function buildFrontier(board: Board, placedShapes: PlacedShape[]): Set<string> {
  const rows = board.length;
  const cols = board[0].length;

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

  const STEP = [
    { dr: -1, dc: 0, fromWall: 'top' as const, toWall: 'bottom' as const },
    { dr: 0, dc: 1, fromWall: 'right' as const, toWall: 'left' as const },
    { dr: 1, dc: 0, fromWall: 'bottom' as const, toWall: 'top' as const },
    { dr: 0, dc: -1, fromWall: 'left' as const, toWall: 'right' as const },
  ];

  const frontier = new Set<string>();
  for (const key of occupied) {
    const [r, c] = key.split(',').map(Number);
    for (const { dr, dc, fromWall, toWall } of STEP) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (occupied.has(`${nr},${nc}`)) continue;
      // Both sides of the boundary must be passable
      if (board[r][c].walls[fromWall]) continue;
      if (board[nr][nc].walls[toWall]) continue;
      frontier.add(`${nr},${nc}`);
    }
  }
  return frontier;
}

// ---------------------------------------------------------------------------
// Placement search
// ---------------------------------------------------------------------------

/**
 * Find a valid top-left start position for `shape` on `board`:
 *
 * - First shape (placedShapes is empty): at least one shape cell must land
 *   on the Entrance cell.
 * - Subsequent shapes: every internal step within the shape must not cross a
 *   wall, and at least one shape cell must land on a frontier cell (a cell
 *   reachable from existing shapes without crossing walls).
 */
export const findValidPlacement = (
  board: Board,
  shape: number[][],
  placedShapes: PlacedShape[]
): { row: number, col: number } | null => {
  const rows = board.length;
  const cols = board[0].length;

  if (placedShapes.length === 0) {
    // --- First shape: must overlap the entrance ---
    let entranceRow = -1, entranceCol = -1;
    outer: for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (board[r][c].type === CellType.Entrance) {
          entranceRow = r; entranceCol = c;
          break outer;
        }
      }
    }
    if (entranceRow === -1) return null;

    // Try every cell in the shape as the one that covers the entrance
    for (let sr = 0; sr < shape.length; sr++) {
      for (let sc = 0; sc < shape[0].length; sc++) {
        if (shape[sr][sc] === 1) {
          const startRow = entranceRow - sr;
          const startCol = entranceCol - sc;
          if (canPlaceShapeAt(board, shape, startRow, startCol, placedShapes)) {
            return { row: startRow, col: startCol };
          }
        }
      }
    }
    return null;
  }

  // --- Subsequent shapes: wall-respecting frontier adjacency ---
  const frontier = buildFrontier(board, placedShapes);

  for (let startRow = 0; startRow <= rows - shape.length; startRow++) {
    for (let startCol = 0; startCol <= cols - shape[0].length; startCol++) {
      if (!canPlaceShapeAt(board, shape, startRow, startCol, placedShapes)) continue;

      // Require that at least one shape cell lands in the frontier
      let touchesFrontier = false;
      done: for (let sr = 0; sr < shape.length; sr++) {
        for (let sc = 0; sc < shape[0].length; sc++) {
          if (shape[sr][sc] === 1 && frontier.has(`${startRow + sr},${startCol + sc}`)) {
            touchesFrontier = true;
            break done;
          }
        }
      }
      if (touchesFrontier) return { row: startRow, col: startCol };
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

// Add this function to src/utils/gameLogic.ts
// Horizontally flip a shape
export const flipShapeHorizontal = (shape: number[][]): number[][] => {
  const flipped = [];
  for (let r = 0; r < shape.length; r++) {
    flipped.push([...shape[r]].reverse());
  }
  return flipped;
};

// Vertically flip a shape
export const flipShapeVertical = (shape: number[][]): number[][] => {
  const flipped = [...shape].reverse();
  return flipped;
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

        // Check if this is a wall cell - cannot overlap physical wall cells
        if (board[boardRow][boardCol].type === CellType.Wall) {
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

// ---------------------------------------------------------------------------
// Movement simulation
// ---------------------------------------------------------------------------

/**
 * Returns the number of spaces the player moves for a given card value.
 * Returns null for face cards (J, Q, K) which trigger an encounter instead.
 * Ace = 1 (low card).
 */
export const getCardMoveCount = (value: CardValue): number | null => {
  if (value === 'J' || value === 'Q' || value === 'K') return null;
  if (value === 'A') return 1;
  return parseInt(value, 10);
};

/** Cell types that are collectible items (non-blocking events). */
const ITEM_CELL_TYPES = new Set<CellType>([
  CellType.Key,
  CellType.Supplies,
  CellType.Mana,
  CellType.Treasure,
  CellType.Relic,
  CellType.Energy,
  CellType.LostSoul,
]);

/** Find the entrance cell on the board. Returns null if not found. */
export const findEntrance = (board: Board): { row: number; col: number } | null => {
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) {
      if (board[r][c].type === CellType.Entrance) return { row: r, col: c };
    }
  }
  return null;
};

const DIRECTIONS = [
  { dr: -1, dc: 0, fromWall: 'top' as const, toWall: 'bottom' as const },
  { dr: 0, dc: 1, fromWall: 'right' as const, toWall: 'left' as const },
  { dr: 1, dc: 0, fromWall: 'bottom' as const, toWall: 'top' as const },
  { dr: 0, dc: -1, fromWall: 'left' as const, toWall: 'right' as const },
];

/**
 * Returns all valid adjacent cells the player can step into from (row, col).
 * A step is blocked if:
 *   - A wall separates the two cells
 *   - The target cell is a Wall-type cell
 *   - The target cell was already visited this turn (no backtracking)
 */
export const getValidNeighbors = (
  board: Board,
  row: number,
  col: number,
  visitedThisTurn: Set<string>
): { row: number; col: number }[] => {
  const rows = board.length;
  const cols = board[0].length;
  const result: { row: number; col: number }[] = [];

  for (const { dr, dc, fromWall, toWall } of DIRECTIONS) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
    if (visitedThisTurn.has(`${nr},${nc}`)) continue;
    if (board[nr][nc].type === CellType.Wall) continue;
    if (board[row][col].walls[fromWall]) continue;
    if (board[nr][nc].walls[toWall]) continue;
    result.push({ row: nr, col: nc });
  }
  return result;
};

export interface PartialMoveResult {
  path: MovementStep[];
  events: TurnEvent[];
  /**
   * Set when movement pauses mid-turn at an encounter or trap cell.
   * Contains remaining steps the player still has after resolving.
   */
  pausedAtEncounter: boolean;
  pausedAtTrap: boolean;
  remainingSteps: number;
}

/**
 * Simulates player movement from a given starting cell for up to `steps`
 * spaces (the starting cell itself does NOT count as a step consumed).
 *
 * Movement stops early when:
 *   - The player runs out of steps
 *   - There are no valid neighbouring cells (dead end — no backtracking)
 *   - An un-collected Encounter cell is entered (pause for resolution)
 *   - An un-collected Trap cell is entered (pause for resolution)
 *
 * @param board          Current board state
 * @param startRow       Row of the starting cell (entrance or resume position)
 * @param startCol       Col of the starting cell
 * @param steps          Number of spaces remaining to move
 * @param visitedThisTurn Cells already visited this turn (updated in place)
 * @param collectedCells  Cells whose items have already been picked up (by key "r,c")
 * @param cardNumericValue Numeric value of the drawn card (for trap/encounter events)
 */
export const simulateMovement = (
  board: Board,
  startRow: number,
  startCol: number,
  steps: number,
  visitedThisTurn: Set<string>,
  collectedCells: Set<string>,
  cardNumericValue: number = 0
): PartialMoveResult => {
  const path: MovementStep[] = [];
  const events: TurnEvent[] = [];

  let curRow = startRow;
  let curCol = startCol;
  let remaining = steps;

  while (remaining > 0) {
    const neighbors = getValidNeighbors(board, curRow, curCol, visitedThisTurn);

    if (neighbors.length === 0) {
      events.push({ type: 'dead_end', message: 'Dead end — movement ends.', row: curRow, col: curCol });
      return { path, events, pausedAtEncounter: false, pausedAtTrap: false, remainingSteps: 0 };
    }

    // Choose next cell: prefer untraversed cells, then random among all options
    const untraversed = neighbors.filter(n => !board[n.row][n.col].traversed);
    const chosen = untraversed.length > 0
      ? untraversed[Math.floor(Math.random() * untraversed.length)]
      : neighbors[Math.floor(Math.random() * neighbors.length)];

    visitedThisTurn.add(`${chosen.row},${chosen.col}`);
    const cellType = board[chosen.row][chosen.col].type;
    const colorReq = board[chosen.row][chosen.col].colorRequirement;
    path.push({ row: chosen.row, col: chosen.col, cellType });
    remaining--;

    const cellKey = `${chosen.row},${chosen.col}`;

    // Collect items
    if (ITEM_CELL_TYPES.has(cellType) && !collectedCells.has(cellKey)) {
      collectedCells.add(cellKey);
      events.push({
        type: 'item_collected',
        message: `Collected ${cellType} at (${chosen.row}, ${chosen.col}).`,
        row: chosen.row,
        col: chosen.col,
        colorRequirement: colorReq,
      });
    }

    // Trap — pause for resolution
    if (cellType === CellType.Trap && !collectedCells.has(cellKey)) {
      events.push({
        type: 'trap_hit',
        message: `Trap at (${chosen.row}, ${chosen.col})! Card value ${cardNumericValue} vs your agility.`,
        row: chosen.row,
        col: chosen.col,
        cardNumericValue,
      });
      collectedCells.add(cellKey);
      curRow = chosen.row;
      curCol = chosen.col;
      return { path, events, pausedAtEncounter: false, pausedAtTrap: true, remainingSteps: remaining };
    }

    // Goal reached
    if (cellType === CellType.Goal && !collectedCells.has(cellKey)) {
      collectedCells.add(cellKey);
      events.push({
        type: 'goal_reached',
        message: `Goal reached at (${chosen.row}, ${chosen.col})! +5 XP, +5 Discovery.`,
        row: chosen.row,
        col: chosen.col,
      });
    }

    // Encounter — pause for resolution
    if (cellType === CellType.Encounter && !collectedCells.has(cellKey)) {
      events.push({
        type: 'encounter_found',
        message: `Encounter at (${chosen.row}, ${chosen.col})! Resolve before continuing.`,
        row: chosen.row,
        col: chosen.col,
        cardNumericValue,
      });
      // Mark as "collected" so we don't re-trigger if player returns later
      collectedCells.add(cellKey);
      curRow = chosen.row;
      curCol = chosen.col;
      return { path, events, pausedAtEncounter: true, pausedAtTrap: false, remainingSteps: remaining };
    }

    curRow = chosen.row;
    curCol = chosen.col;
  }

  events.push({ type: 'completed', message: `Moved ${steps} space${steps !== 1 ? 's' : ''}.` });
  return { path, events, pausedAtEncounter: false, pausedAtTrap: false, remainingSteps: 0 };
};