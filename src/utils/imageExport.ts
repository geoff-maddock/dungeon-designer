// src/utils/imageExport.ts
import { Board, CellType, ColorRequirement } from '../types';

// Function to export board as PNG image
export const exportBoardAsPNG = (board: Board, cellSize: number = 32): Promise<string> => {
    return new Promise((resolve) => {
        // Create a canvas element
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        // Set canvas dimensions based on board size
        canvas.width = board[0].length * cellSize;
        canvas.height = board.length * cellSize;

        // Fill background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw cells
        for (let row = 0; row < board.length; row++) {
            for (let col = 0; col < board[0].length; col++) {
                const cell = board[row][col];
                const x = col * cellSize;
                const y = row * cellSize;

                // Draw cell background based on color requirement
                ctx.fillStyle = getCellBackgroundColor(cell.type, cell.colorRequirement);
                ctx.fillRect(x, y, cellSize, cellSize);

                // Draw cell icon
                drawCellIcon(ctx, cell.type, x, y, cellSize);

                // Draw color requirement letter if applicable
                if (cell.type === CellType.Empty && cell.colorRequirement !== ColorRequirement.None) {
                    drawColorRequirementLetter(ctx, cell.colorRequirement, x, y, cellSize);
                }

                // Draw walls
                if (cell.walls.top || cell.walls.right || cell.walls.bottom || cell.walls.left) {
                    drawWalls(ctx, cell.walls, x, y, cellSize);
                }
            }
        }

        // Draw grid lines (after cells so they're on top)
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;

        // Draw horizontal grid lines
        for (let i = 0; i <= board.length; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * cellSize);
            ctx.lineTo(canvas.width, i * cellSize);
            ctx.stroke();
        }

        // Draw vertical grid lines
        for (let i = 0; i <= board[0].length; i++) {
            ctx.beginPath();
            ctx.moveTo(i * cellSize, 0);
            ctx.lineTo(i * cellSize, canvas.height);
            ctx.stroke();
        }

        // Convert canvas to data URL and resolve the promise
        resolve(canvas.toDataURL('image/png'));
    });
};

// Helper function to get cell background color
const getCellBackgroundColor = (type: CellType, colorRequirement: ColorRequirement): string => {
    if (type === CellType.Wall) {
        return '#333333';
    }

    switch (colorRequirement) {
        case ColorRequirement.Red:
            return '#ffcccc';
        case ColorRequirement.Orange:
            return '#ffe0cc';
        case ColorRequirement.Yellow:
            return '#ffffcc';
        case ColorRequirement.Green:
            return '#ccffcc';
        case ColorRequirement.Blue:
            return '#cce0ff';
        case ColorRequirement.Purple:
            return '#e0ccff';
        default:
            return '#ffffff';
    }
};

// Helper function to draw cell icons
const drawCellIcon = (ctx: CanvasRenderingContext2D, type: CellType, x: number, y: number, cellSize: number) => {
    const center = { x: x + cellSize / 2, y: y + cellSize / 2 };
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${cellSize / 2}px sans-serif`;

    switch (type) {
        case CellType.Entrance:
            ctx.fillStyle = '#009900';
            ctx.fillText('⮕', center.x, center.y);
            break;
        case CellType.Key:
            ctx.fillStyle = '#cc9900';
            ctx.fillText('🔑', center.x, center.y);
            break;
        case CellType.Lock:
            ctx.fillStyle = '#505050';
            ctx.fillText('🔒', center.x, center.y);
            break;
        case CellType.Supplies:
            ctx.fillStyle = '#0066cc';
            ctx.fillText('🎒', center.x, center.y);
            break;
        case CellType.Mana:
            ctx.fillStyle = '#6600cc';
            ctx.fillText('✨', center.x, center.y);
            break;
        case CellType.Encounter:
            ctx.fillStyle = '#cc0000';
            ctx.fillText('👾', center.x, center.y);
            break;
        case CellType.Treasure:
            ctx.fillStyle = '#cc7700';
            ctx.fillText('💎', center.x, center.y);
            break;
        case CellType.Relic:
            ctx.fillStyle = '#4b0082';
            ctx.fillText('🏆', center.x, center.y);
            break;
    }
};

// Helper function to draw color requirement letters
const drawColorRequirementLetter = (
    ctx: CanvasRenderingContext2D,
    colorRequirement: ColorRequirement,
    x: number,
    y: number,
    cellSize: number
) => {
    const center = { x: x + cellSize / 2, y: y + cellSize / 2 };
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${cellSize / 2}px sans-serif`;
    ctx.fillStyle = '#000000';

    let letter = '';
    switch (colorRequirement) {
        case ColorRequirement.Red:
            letter = 'R';
            break;
        case ColorRequirement.Orange:
            letter = 'O';
            break;
        case ColorRequirement.Yellow:
            letter = 'Y';
            break;
        case ColorRequirement.Green:
            letter = 'G';
            break;
        case ColorRequirement.Blue:
            letter = 'B';
            break;
        case ColorRequirement.Purple:
            letter = 'P';
            break;
    }

    ctx.fillText(letter, center.x, center.y);
};

// Helper function to draw walls
const drawWalls = (
    ctx: CanvasRenderingContext2D,
    walls: { top: boolean, right: boolean, bottom: boolean, left: boolean },
    x: number,
    y: number,
    cellSize: number
) => {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;

    if (walls.top) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + cellSize, y);
        ctx.stroke();
    }

    if (walls.right) {
        ctx.beginPath();
        ctx.moveTo(x + cellSize, y);
        ctx.lineTo(x + cellSize, y + cellSize);
        ctx.stroke();
    }

    if (walls.bottom) {
        ctx.beginPath();
        ctx.moveTo(x, y + cellSize);
        ctx.lineTo(x + cellSize, y + cellSize);
        ctx.stroke();
    }

    if (walls.left) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + cellSize);
        ctx.stroke();
    }
};