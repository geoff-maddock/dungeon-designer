import { findValidPlacement, rotateShape, flipShapeHorizontal, createStandardDeck, shuffleDeck } from '../utils/gameLogic';
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
