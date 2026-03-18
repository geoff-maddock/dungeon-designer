import { findValidPlacement, rotateShape, flipShapeHorizontal, createStandardDeck, shuffleDeck, getCardMoveCount, getValidNeighbors, findEntrance, simulateMovement } from '../utils/gameLogic';
import { Board, CellType, ColorRequirement, PlacedShape, CardValue } from '../types';

describe('gameLogic utility', () => {
  const mockBoard: Board = Array(8).fill(null).map(() =>
    Array(8).fill(null).map(() => ({
      type: CellType.Empty,
      colorRequirement: ColorRequirement.None,
      walls: { top: false, right: false, bottom: false, left: false }
    }))
  );

  mockBoard[7][4].type = CellType.Entrance;

  const mockPlacedShapes: PlacedShape[] = [
    { shape: [[1]], startRow: 7, startCol: 4, cardValue: '2', cardSuit: 'hearts' }
  ];

  test('findValidPlacement finds a valid position for a shape', () => {
    const shape = [[1, 1], [1, 0]];
    const position = findValidPlacement(mockBoard, shape, mockPlacedShapes);
    expect(position).toEqual({ row: 6, col: 4 });
  });

  test('rotateShape rotates a shape 90 degrees clockwise', () => {
    const shape = [[1, 0], [1, 1]];
    const rotated = rotateShape(shape);
    expect(rotated).toEqual([[1, 1], [1, 0]]);
  });

  test('flipShapeHorizontal flips a shape horizontally', () => {
    const shape = [[1, 0], [1, 1]];
    const flipped = flipShapeHorizontal(shape);
    expect(flipped).toEqual([[0, 1], [1, 1]]);
  });

  test('createStandardDeck creates a standard 52-card deck', () => {
    const deck = createStandardDeck();
    expect(deck.length).toBe(52);
    expect(deck.filter(card => card.suit === 'hearts').length).toBe(13);
    expect(deck.filter(card => card.value === 'A').length).toBe(4);
  });

  test('shuffleDeck shuffles the deck', () => {
    const deck = createStandardDeck();
    const shuffledDeck = shuffleDeck(deck);
    expect(shuffledDeck).not.toEqual(deck);
  });
});

// ---------------------------------------------------------------------------
// Movement simulation tests
// ---------------------------------------------------------------------------

describe('movement simulation', () => {
  // Simple open 5×5 board with entrance at bottom-centre (4,2)
  const makeBoard = (): Board =>
    Array(5).fill(null).map((_, r) =>
      Array(5).fill(null).map((_, c) => ({
        type: r === 4 && c === 2 ? CellType.Entrance : CellType.Empty,
        colorRequirement: ColorRequirement.None,
        walls: { top: false, right: false, bottom: false, left: false },
      }))
    );

  test('getCardMoveCount returns correct values', () => {
    expect(getCardMoveCount('2')).toBe(2);
    expect(getCardMoveCount('10')).toBe(10);
    expect(getCardMoveCount('A')).toBe(1);
    expect(getCardMoveCount('J')).toBeNull();
    expect(getCardMoveCount('Q')).toBeNull();
    expect(getCardMoveCount('K')).toBeNull();
  });

  test('findEntrance locates the entrance cell', () => {
    const board = makeBoard();
    expect(findEntrance(board)).toEqual({ row: 4, col: 2 });
  });

  test('findEntrance returns null when no entrance', () => {
    const board: Board = Array(3).fill(null).map(() =>
      Array(3).fill(null).map(() => ({
        type: CellType.Empty,
        colorRequirement: ColorRequirement.None,
        walls: { top: false, right: false, bottom: false, left: false },
      }))
    );
    expect(findEntrance(board)).toBeNull();
  });

  test('getValidNeighbors returns adjacent passable cells', () => {
    const board = makeBoard();
    const visited = new Set<string>(['4,2']);
    const neighbors = getValidNeighbors(board, 4, 2, visited);
    // (4,2) can go up to (3,2) and left to (4,1) and right to (4,3)
    // not back to itself (visited), not out of bounds (below is row 5)
    expect(neighbors).toEqual(expect.arrayContaining([
      { row: 3, col: 2 },
      { row: 4, col: 1 },
      { row: 4, col: 3 },
    ]));
    expect(neighbors.length).toBe(3);
  });

  test('getValidNeighbors respects wall barriers', () => {
    const board = makeBoard();
    board[4][2].walls.top = true; // wall on top of entrance
    const visited = new Set<string>(['4,2']);
    const neighbors = getValidNeighbors(board, 4, 2, visited);
    expect(neighbors.find(n => n.row === 3 && n.col === 2)).toBeUndefined();
  });

  test('getValidNeighbors skips already-visited cells', () => {
    const board = makeBoard();
    const visited = new Set<string>(['4,2', '3,2']);
    const neighbors = getValidNeighbors(board, 4, 2, visited);
    expect(neighbors.find(n => n.row === 3 && n.col === 2)).toBeUndefined();
  });

  test('simulateMovement moves the correct number of steps', () => {
    const board = makeBoard();
    const visited = new Set<string>(['4,2']);
    const collected = new Set<string>();
    const result = simulateMovement(board, 4, 2, 3, visited, collected);
    expect(result.path.length).toBe(3);
    expect(result.pausedAtEncounter).toBe(false);
  });

  test('simulateMovement stops at a dead end', () => {
    // Create a 3×1 corridor: [Entrance]—[Empty]—[surrounded by walls]
    const board: Board = Array(1).fill(null).map(() =>
      Array(3).fill(null).map((_, c) => ({
        type: c === 0 ? CellType.Entrance : CellType.Empty,
        colorRequirement: ColorRequirement.None,
        walls: { top: true, bottom: true, left: c === 0, right: c === 2 },
      }))
    );
    const visited = new Set<string>(['0,0']);
    const collected = new Set<string>();
    // Max 10 steps, but corridor only has 2 cells after start
    const result = simulateMovement(board, 0, 0, 10, visited, collected);
    expect(result.events.some(e => e.type === 'dead_end')).toBe(true);
    expect(result.pausedAtEncounter).toBe(false);
  });

  test('simulateMovement pauses at an encounter cell', () => {
    const board = makeBoard();
    // Place an encounter just above the entrance
    board[3][2].type = CellType.Encounter;
    const visited = new Set<string>(['4,2']);
    const collected = new Set<string>();
    // Force movement upward: wall off left and right
    board[4][2].walls.left = true;
    board[4][2].walls.right = true;
    const result = simulateMovement(board, 4, 2, 5, visited, collected);
    expect(result.pausedAtEncounter).toBe(true);
    expect(result.events.some(e => e.type === 'encounter_found')).toBe(true);
  });

  test('simulateMovement collects items along the path', () => {
    const board = makeBoard();
    board[3][2].type = CellType.Key;
    // Force upward movement
    board[4][2].walls.left = true;
    board[4][2].walls.right = true;
    const visited = new Set<string>(['4,2']);
    const collected = new Set<string>();
    simulateMovement(board, 4, 2, 3, visited, collected);
    expect(collected.has('3,2')).toBe(true);
  });
});
