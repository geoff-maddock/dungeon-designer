import React, { useState } from 'react';
import { Board, CellType, ColorRequirement, PlacedShape, CardValue } from '../types';

interface BoardDesignerProps {
  board: Board;
  onCellClick: (row: number, col: number) => void;
  placedShapes?: PlacedShape[];
}

const BoardDesigner: React.FC<BoardDesignerProps> = ({ board, onCellClick, placedShapes = [] }) => {
  const [hoveredCell, setHoveredCell] = useState<{ row: number, col: number } | null>(null);

  const getCellColor = (type: CellType, colorRequirement: ColorRequirement): string => {
    // Special case for walls - always dark
    if (type === CellType.Wall) {
      return 'bg-gray-800';
    }

    // Background color based on color requirement
    switch (colorRequirement) {
      case ColorRequirement.Red:
        return 'bg-red-200';
      case ColorRequirement.Orange:
        return 'bg-orange-200';
      case ColorRequirement.Yellow:
        return 'bg-yellow-200';
      case ColorRequirement.Green:
        return 'bg-green-200';
      case ColorRequirement.Blue:
        return 'bg-blue-200';
      case ColorRequirement.Purple:
        return 'bg-purple-200';
      default:
        return 'bg-white'; // Default white background for no color requirement
    }
  };

  const getColorText = (colorRequirement: ColorRequirement): JSX.Element | string => {
    switch (colorRequirement) {
      case ColorRequirement.Red:
        return <span>R</span>;
      case ColorRequirement.Orange:
        return <span>O</span>;
      case ColorRequirement.Yellow:
        return <span>Y</span>;
      case ColorRequirement.Green:
        return <span>G</span>;
      case ColorRequirement.Blue:
        return <span>B</span>;
      case ColorRequirement.Purple:
        return <span>P</span>;
      default:
        return '';
    }
  };

  const getCellDescription = (type: CellType, colorRequirement: ColorRequirement): string => {
    let description = '';

    // Cell type description
    switch (type) {
      case CellType.Empty:
        description = 'Empty Space';
        break;
      case CellType.Wall:
        description = 'Wall - Cannot pass through';
        break;
      case CellType.Entrance:
        description = 'Entrance - Starting point';
        break;
      case CellType.Key:
        description = 'Key - Required to unlock certain paths';
        break;
      case CellType.Supplies:
        description = 'Supplies - Required for certain paths';
        break;
      case CellType.Mana:
        description = 'Mana - Required for magical paths';
        break;
      case CellType.Encounter:
        description = 'Encounter - Battle or challenge';
        break;
      case CellType.Treasure:
        description = 'Treasure - Valuable reward';
        break;
      case CellType.Relic:
        description = 'Relic - Primary objective';
        break;
      case CellType.Lock:
        description = 'Lock - Requires a key to pass through';
        break;
      default:
        description = '';
    }

    // Add color requirement if present
    if (colorRequirement !== ColorRequirement.None) {
      const colorName = colorRequirement.charAt(0).toUpperCase() + colorRequirement.slice(1);
      description += (description ? ' + ' : '') + `${colorName} resource required`;
    }

    return description;
  };

  const getCellIconWithStyle = (type: CellType): JSX.Element | string => {
    const outlineStyle = {
      textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'
    };

    switch (type) {
      case CellType.Entrance:
        return <span className="text-green-600 font-bold" style={outlineStyle}>🚪</span>;
      case CellType.Key:
        return <span className="text-yellow-600" style={outlineStyle}>🔑</span>;
      case CellType.Supplies:
        return <span className="text-blue-600" style={outlineStyle}>🎒</span>;
      case CellType.Mana:
        return <span className="text-purple-600" style={outlineStyle}>✨</span>;
      case CellType.Encounter:
        return <span className="text-red-600" style={outlineStyle}>👾</span>;
      case CellType.Treasure:
        return <span className="text-amber-600" style={outlineStyle}>💎</span>;
      case CellType.Relic:
        return <span className="text-indigo-600" style={outlineStyle}>🏆</span>;
      case CellType.Lock:
        return <span className="text-gray-700" style={outlineStyle}>🔒</span>;
      default:
        return '';
    }
  };

  const getPlacedShapeInfo = (row: number, col: number): { cardValue: CardValue, cardSuit: string } | null => {
    for (const shape of placedShapes) {
      for (let r = 0; r < shape.shape.length; r++) {
        for (let c = 0; c < shape.shape[0].length; c++) {
          if (shape.shape[r][c] === 1 &&
            shape.startRow + r === row &&
            shape.startCol + c === col) {
            return {
              cardValue: shape.cardValue,
              cardSuit: shape.cardSuit
            };
          }
        }
      }
    }
    return null;
  };

  function getSuitSymbol(suit: string): string {
    switch (suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      default: return '';
    }
  }

  // New function to render the tooltip area
  const renderTooltipArea = () => {
    if (!hoveredCell) {
      return (
        <div className="p-4 h-full border rounded bg-gray-50 flex items-center justify-center">
          <p className="text-gray-500 italic">Hover over a cell to see details</p>
        </div>
      );
    }

    const { row, col } = hoveredCell;
    const cell = board[row][col];
    const hasWalls = cell.walls.top || cell.walls.right || cell.walls.bottom || cell.walls.left;
    const placedShape = getPlacedShapeInfo(row, col);

    return (
      <div className="p-4 h-full border rounded bg-white">
        <h3 className="font-semibold text-lg mb-3">Cell Information</h3>

        <div className="space-y-2">
          <div>
            <span className="font-medium">Position:</span> Row {row + 1}, Column {col + 1}
          </div>

          <div>
            <span className="font-medium">Type:</span> {getCellDescription(cell.type, cell.colorRequirement)}
          </div>

          {hasWalls && (
            <div>
              <span className="font-medium">Walls:</span>
              <div className="flex space-x-2 mt-1">
                {cell.walls.top && <span className="px-2 py-1 bg-gray-200 rounded">Top</span>}
                {cell.walls.right && <span className="px-2 py-1 bg-gray-200 rounded">Right</span>}
                {cell.walls.bottom && <span className="px-2 py-1 bg-gray-200 rounded">Bottom</span>}
                {cell.walls.left && <span className="px-2 py-1 bg-gray-200 rounded">Left</span>}
              </div>
            </div>
          )}

          {placedShape && (
            <div>
              <span className="font-medium">Action Layer:</span>
              <div className="mt-1 px-3 py-2 bg-indigo-100 rounded">
                Card: {placedShape.cardValue} {getSuitSymbol(placedShape.cardSuit)} ({placedShape.cardSuit})
              </div>
            </div>
          )}

          {/* Preview of the cell */}
          <div className="mt-4">
            <span className="font-medium">Preview:</span>
            <div className="mt-2 flex justify-center">
              <div className={`w-12 h-12 flex items-center justify-center text-lg ${getCellColor(cell.type, cell.colorRequirement)} border-2 border-gray-400 rounded relative`}>
                {getCellIconWithStyle(cell.type)}
                {cell.type === CellType.Empty && getColorText(cell.colorRequirement)}

                {placedShape && (
                  <div className="absolute inset-0 bg-indigo-500 bg-opacity-40 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {placedShape.cardValue}{getSuitSymbol(placedShape.cardSuit)}
                    </span>
                  </div>
                )}

                {/* Wall indicators */}
                {cell.walls.top && <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800"></div>}
                {cell.walls.right && <div className="absolute top-0 right-0 bottom-0 w-1 bg-gray-800"></div>}
                {cell.walls.bottom && <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800"></div>}
                {cell.walls.left && <div className="absolute top-0 left-0 bottom-0 w-1 bg-gray-800"></div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex gap-4">
      <div className="overflow-auto">
        <div className="grid gap-px bg-gray-300 border-2 border-gray-400 rounded"
          style={{
            gridTemplateColumns: `repeat(${board[0].length}, minmax(0, 1fr))`,
            width: 'fit-content'
          }}
        >
          {board.map((row, rowIndex) => (
            row.map((cell, colIndex) => {
              const hasWalls = cell.walls.top || cell.walls.right || cell.walls.bottom || cell.walls.left;
              const placedShape = getPlacedShapeInfo(rowIndex, colIndex);

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`w-8 h-8 flex items-center justify-center text-sm font-bold cursor-pointer relative ${getCellColor(cell.type, cell.colorRequirement)}`}
                  onClick={() => onCellClick(rowIndex, colIndex)}
                  onMouseEnter={() => setHoveredCell({ row: rowIndex, col: colIndex })}
                  onMouseLeave={() => setHoveredCell(null)}
                >
                  {getCellIconWithStyle(cell.type)}
                  {cell.type === CellType.Empty && getColorText(cell.colorRequirement)}

                  {/* Action layer shape indicator */}
                  {placedShape && (
                    <div className="absolute inset-0 bg-indigo-500 bg-opacity-40 flex items-center justify-center z-10">
                      <span className="text-xs font-bold text-white">
                        {placedShape.cardValue}{getSuitSymbol(placedShape.cardSuit)}
                      </span>
                    </div>
                  )}

                  {/* Wall indicators */}
                  {cell.walls.top && <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800"></div>}
                  {cell.walls.right && <div className="absolute top-0 right-0 bottom-0 w-1 bg-gray-800"></div>}
                  {cell.walls.bottom && <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800"></div>}
                  {cell.walls.left && <div className="absolute top-0 left-0 bottom-0 w-1 bg-gray-800"></div>}
                </div>
              );
            })
          ))}
        </div>
      </div>

      {/* Tooltip area to the right */}
      <div className="w-64 h-96">
        {renderTooltipArea()}
      </div>
    </div>
  );
};

export default BoardDesigner;