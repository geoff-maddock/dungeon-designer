import { generateRandomBoard } from '../utils/boardGenerator';
import { CellType, ColorRequirement, Board } from '../types';

describe('boardGenerator utility', () => {
  test('generateRandomBoard creates a board with the correct size', () => {
    const size = 16;
    const board = generateRandomBoard(size);
    expect(board.length).toBe(size);
    expect(board[0].length).toBe(size);
  });

  test('generateRandomBoard places the entrance at the correct position', () => {
    const size = 16;
    const board = generateRandomBoard(size);
    expect(board[size - 1][Math.floor(size / 2)].type).toBe(CellType.Entrance);
  });

  test('generateRandomBoard adds random cells of specific types', () => {
    const size = 16;
    const options = {
      cellTypeCounts: {
        [CellType.Key]: 3,
        [CellType.Lock]: 3,
        [CellType.Supplies]: 3,
        [CellType.Mana]: 3,
        [CellType.Encounter]: 4,
        [CellType.Treasure]: 4,
        [CellType.Relic]: 6,
      },
      colorRequirementCounts: {},
      wallPercentage: 0,
    };
    const board = generateRandomBoard(size, options);

    const countCells = (type: CellType) => {
      return board.flat().filter(cell => cell.type === type).length;
    };

    expect(countCells(CellType.Key)).toBe(3);
    expect(countCells(CellType.Lock)).toBe(3);
    expect(countCells(CellType.Supplies)).toBe(3);
    expect(countCells(CellType.Mana)).toBe(3);
    expect(countCells(CellType.Encounter)).toBe(4);
    expect(countCells(CellType.Treasure)).toBe(4);
    expect(countCells(CellType.Relic)).toBe(6);
  });

  test('generateRandomBoard adds random color requirements', () => {
    const size = 16;
    const options = {
      cellTypeCounts: {},
      colorRequirementCounts: {
        [ColorRequirement.Red]: 2,
        [ColorRequirement.Orange]: 2,
        [ColorRequirement.Yellow]: 2,
        [ColorRequirement.Green]: 2,
        [ColorRequirement.Blue]: 2,
        [ColorRequirement.Purple]: 2,
      },
      wallPercentage: 0,
    };
    const board = generateRandomBoard(size, options);

    const countColorRequirements = (color: ColorRequirement) => {
      return board.flat().filter(cell => cell.colorRequirement === color).length;
    };

    expect(countColorRequirements(ColorRequirement.Red)).toBe(2);
    expect(countColorRequirements(ColorRequirement.Orange)).toBe(2);
    expect(countColorRequirements(ColorRequirement.Yellow)).toBe(2);
    expect(countColorRequirements(ColorRequirement.Green)).toBe(2);
    expect(countColorRequirements(ColorRequirement.Blue)).toBe(2);
    expect(countColorRequirements(ColorRequirement.Purple)).toBe(2);
  });

  test('generateRandomBoard adds walls based on percentage', () => {
    const size = 16;
    const options = {
      cellTypeCounts: {},
      colorRequirementCounts: {},
      wallPercentage: 15,
    };
    const board = generateRandomBoard(size, options);

    const countWalls = () => {
      return board.flat().filter(cell => cell.type === CellType.Wall).length;
    };

    const expectedWallCount = Math.floor(size * size * 0.15);
    expect(countWalls()).toBeGreaterThanOrEqual(expectedWallCount - 1);
    expect(countWalls()).toBeLessThanOrEqual(expectedWallCount + 1);
  });
});
