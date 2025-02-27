import React from 'react';
import { ActionShape } from '../types';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react';

interface ActionShapesProps {
  shapes: ActionShape[];
}

const ActionShapes: React.FC<ActionShapesProps> = ({ shapes }) => {
  const getDiceIcon = (value: number) => {
    switch (value) {
      case 1: return <Dice1 size={20} />;
      case 2: return <Dice2 size={20} />;
      case 3: return <Dice3 size={20} />;
      case 4: return <Dice4 size={20} />;
      case 5: return <Dice5 size={20} />;
      case 6: return <Dice6 size={20} />;
      default: return null;
    }
  };

  // Group shapes by value
  const shapesByValue = shapes.reduce((acc, shape) => {
    if (!acc[shape.value]) {
      acc[shape.value] = [];
    }
    acc[shape.value].push(shape);
    return acc;
  }, {} as Record<number, ActionShape[]>);

  return (
    <div className="space-y-4">
      {Object.entries(shapesByValue).map(([value, valueShapes]) => (
        <div key={value} className="border rounded p-2">
          <div className="flex items-center mb-2">
            {getDiceIcon(parseInt(value))}
            <span className="ml-2 font-semibold">Value: {value}</span>
            <span className="ml-2 text-sm text-gray-600">
              ({valueShapes[0].cardValues.join(', ')})
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {valueShapes.map((shape) => (
              <div key={shape.id} className="grid gap-px bg-gray-200 w-fit">
                {shape.shape.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex">
                    {row.map((cell, cellIndex) => (
                      <div 
                        key={`${rowIndex}-${cellIndex}`}
                        className={`w-6 h-6 ${cell ? 'bg-indigo-500' : 'bg-transparent'}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActionShapes;