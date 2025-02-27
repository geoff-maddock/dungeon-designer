import React, { useState } from 'react';
import { Board, CellType, ColorRequirement } from '../types';

interface BoardDesignerProps {
  board: Board;
  onCellClick: (row: number, col: number) => void;
}

const BoardDesigner: React.FC<BoardDesignerProps> = ({ board, onCellClick }) => {
  const [hoveredCell, setHoveredCell] = useState<{ row: number, col: number } | null>(null);

  const getCellColor = (type: CellType, colorRequirement: ColorRequirement): string => {
    // Base color based on cell type
    let baseColor = 'bg-white';
    
    switch (type) {
      case CellType.Wall:
        return 'bg-gray-800';
      case CellType.Entrance:
        return 'bg-green-500';
      case CellType.Key:
        return 'bg-yellow-300';
      case CellType.Supplies:
        return 'bg-blue-300';
      case CellType.Mana:
        return 'bg-purple-300';
      case CellType.Encounter:
        return 'bg-red-500';
      case CellType.Treasure:
        return 'bg-amber-300';
      case CellType.Relic:
        return 'bg-indigo-500';
      default:
        baseColor = 'bg-white';
    }
    
    // If there's a color requirement, apply a tint
    if (colorRequirement !== ColorRequirement.None) {
      switch (colorRequirement) {
        case ColorRequirement.Red:
          return type === CellType.Empty ? 'bg-red-200' : baseColor + ' ring-2 ring-red-500';
        case ColorRequirement.Orange:
          return type === CellType.Empty ? 'bg-orange-200' : baseColor + ' ring-2 ring-orange-500';
        case ColorRequirement.Yellow:
          return type === CellType.Empty ? 'bg-yellow-200' : baseColor + ' ring-2 ring-yellow-500';
        case ColorRequirement.Green:
          return type === CellType.Empty ? 'bg-green-200' : baseColor + ' ring-2 ring-green-500';
        case ColorRequirement.Blue:
          return type === CellType.Empty ? 'bg-blue-200' : baseColor + ' ring-2 ring-blue-500';
        case ColorRequirement.Purple:
          return type === CellType.Empty ? 'bg-purple-200' : baseColor + ' ring-2 ring-purple-500';
        default:
          return baseColor;
      }
    }
    
    return baseColor;
  };

  const getCellIcon = (type: CellType): string => {
    switch (type) {
      case CellType.Entrance:
        return '⮕';
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

  const getColorText = (colorRequirement: ColorRequirement): string => {
    switch (colorRequirement) {
      case ColorRequirement.Red:
        return 'R';
      case ColorRequirement.Orange:
        return 'O';
      case ColorRequirement.Yellow:
        return 'Y';
      case ColorRequirement.Green:
        return 'G';
      case ColorRequirement.Blue:
        return 'B';
      case ColorRequirement.Purple:
        return 'P';
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
                {getCellIcon(cell.type)}
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