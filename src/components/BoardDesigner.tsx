import React, { useState } from 'react';
import { Board, CellType, ColorRequirement } from '../types';

interface BoardDesignerProps {
  board: Board;
  onCellClick: (row: number, col: number) => void;
}

const BoardDesigner: React.FC<BoardDesignerProps> = ({ board, onCellClick }) => {
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

  const getCellIcon = (type: CellType): string => {
    switch (type) {
      case CellType.Entrance:
        return '🚪';
      case CellType.Key:
        return '🔑';
      case CellType.Supplies:
        return '🎒';
      case CellType.Mana:
        return '✨';
      case CellType.Encounter:
        return '👾';
      case CellType.Treasure:
        return '💎';
      case CellType.Relic:
        return '🏆';
      default:
        return '';
    }
  };

  const getColorText = (colorRequirement: ColorRequirement): JSX.Element | string => {
    const outlineStyle = {
      textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'
    };

    switch (colorRequirement) {
      case ColorRequirement.Red:
        return <span style={outlineStyle}>R</span>;
      case ColorRequirement.Orange:
        return <span style={outlineStyle}>O</span>;
      case ColorRequirement.Yellow:
        return <span style={outlineStyle}>Y</span>;
      case ColorRequirement.Green:
        return <span style={outlineStyle}>G</span>;
      case ColorRequirement.Blue:
        return <span style={outlineStyle}>B</span>;
      case ColorRequirement.Purple:
        return <span style={outlineStyle}>P</span>;
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
      default:
        return '';
    }
  };

  return (
    <div className="overflow-auto">
      <div
        className="grid gap-px bg-gray-300 border-2 border-gray-400 rounded"
        style={{
          gridTemplateColumns: `repeat(${board[0].length}, minmax(0, 1fr))`,
          width: 'fit-content'
        }}
      >
        {board.map((row, rowIndex) => (
          row.map((cell, colIndex) => {
            const hasWalls = cell.walls.top || cell.walls.right || cell.walls.bottom || cell.walls.left;

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

                {/* Wall indicators */}
                {cell.walls.top && <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800"></div>}
                {cell.walls.right && <div className="absolute top-0 right-0 bottom-0 w-1 bg-gray-800"></div>}
                {cell.walls.bottom && <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800"></div>}
                {cell.walls.left && <div className="absolute top-0 left-0 bottom-0 w-1 bg-gray-800"></div>}

                {/* Tooltip */}
                {hoveredCell && hoveredCell.row === rowIndex && hoveredCell.col === colIndex && (
                  <div className="absolute z-10 bg-black bg-opacity-80 text-white text-xs rounded py-1 px-2 -mt-8 whitespace-nowrap">
                    {getCellDescription(cell.type, cell.colorRequirement)}
                    {hasWalls && (
                      <div className="mt-1">
                        {cell.walls.top && <span className="mr-1">↑</span>}
                        {cell.walls.right && <span className="mr-1">→</span>}
                        {cell.walls.bottom && <span className="mr-1">↓</span>}
                        {cell.walls.left && <span>←</span>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ))}
      </div>
    </div>
  );
};

export default BoardDesigner;