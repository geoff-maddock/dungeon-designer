import { exportBoardAsPNG } from '../utils/imageExport';
import { Board, CellType, ColorRequirement } from '../types';

describe('imageExport utility', () => {
  const mockBoard: Board = Array(8).fill(null).map(() =>
    Array(8).fill(null).map(() => ({
      type: CellType.Empty,
      colorRequirement: ColorRequirement.None,
      walls: { top: false, right: false, bottom: false, left: false }
    }))
  );

  mockBoard[7][4].type = CellType.Entrance;

  test('exportBoardAsPNG generates a valid data URL', async () => {
    const dataUrl = await exportBoardAsPNG(mockBoard);
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  test('getCellBackgroundColor returns correct color for cell type and color requirement', () => {
    const cellType = CellType.Wall;
    const colorRequirement = ColorRequirement.Red;
    const color = getCellBackgroundColor(cellType, colorRequirement);
    expect(color).toBe('#333333');
  });

  test('drawCellIcon draws correct icon for cell type', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const cellType = CellType.Entrance;
    drawCellIcon(ctx, cellType, 0, 0, 32);
    // Add assertions to verify the drawn icon
  });

  test('drawWalls draws correct walls for cell', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const walls = { top: true, right: true, bottom: true, left: true };
    drawWalls(ctx, walls, 0, 0, 32);
    // Add assertions to verify the drawn walls
  });
});
