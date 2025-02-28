import React, { useState } from 'react';
import { ActionShape } from '../types';
import { rotateShape, flipShapeHorizontal } from '../utils/gameLogic';

interface ActionShapesProps {
  shapes: ActionShape[];
}

const ActionShapes: React.FC<ActionShapesProps> = ({ shapes }) => {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [transformedShapes, setTransformedShapes] = useState<Record<number, { shape: number[][], rotations: number, flipped: boolean }>>({});

  const toggleLevel = (level: number) => {
    setSelectedLevel(selectedLevel === level ? null : level);
  };

  const rotateShapePreview = (shapeId: number) => {
    setTransformedShapes(prev => {
      const current = prev[shapeId] || { shape: shapes.find(s => s.id === shapeId)?.shape || [[]], rotations: 0, flipped: false };
      const rotated = rotateShape(current.shape);
      return {
        ...prev,
        [shapeId]: {
          shape: rotated,
          rotations: (current.rotations + 1) % 4,
          flipped: current.flipped
        }
      };
    });
  };

  const flipShapePreview = (shapeId: number) => {
    setTransformedShapes(prev => {
      const current = prev[shapeId] || { shape: shapes.find(s => s.id === shapeId)?.shape || [[]], rotations: 0, flipped: false };
      const flipped = flipShapeHorizontal(current.shape);
      return {
        ...prev,
        [shapeId]: {
          shape: flipped,
          rotations: current.rotations,
          flipped: !current.flipped
        }
      };
    });
  };

  const resetShapePreview = (shapeId: number) => {
    setTransformedShapes(prev => {
      const newTransformed = { ...prev };
      delete newTransformed[shapeId];
      return newTransformed;
    });
  };

  const getDisplayShape = (shape: ActionShape) => {
    return transformedShapes[shape.id]?.shape || shape.shape;
  };

  const getLevelShapes = (level: number) => {
    return shapes.filter(shape => shape.value === level);
  };


  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 mb-4">
        {[1, 2, 3, 4, 5].map(level => (
          <button
            key={level}
            onClick={() => toggleLevel(level)}
            className={`px-3 py-1 rounded ${selectedLevel === level ? 'bg-indigo-600 text-white' : 'bg-gray-200'
              }`}
          >
            Level {level}
          </button>
        ))}
      </div>

      {selectedLevel && (
        <div>
          <h3 className="text-md font-medium mb-2">Level {selectedLevel} Shapes</h3>
          <p className="text-sm text-gray-600 mb-4">
            Card values: {getLevelShapes(selectedLevel)[0]?.cardValues.join(', ')}
          </p>

          <div className="space-y-4">
            {getLevelShapes(selectedLevel).map(shape => (
              <div key={shape.id} className="border rounded p-3 bg-gray-50">
                <p className="text-sm mb-2">Shape {shape.id}</p>

                <div className="grid gap-px bg-gray-200 w-fit mb-3">
                  {getDisplayShape(shape).map((row, r) => (
                    <div key={r} className="flex gap-px">
                      {row.map((cell, c) => (
                        <div
                          key={c}
                          className={`w-6 h-6 ${cell === 1 ? 'bg-indigo-500' : 'bg-white'}`}
                        ></div>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => rotateShapePreview(shape.id)}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded"
                  >
                    Rotate
                  </button>
                  <button
                    onClick={() => flipShapePreview(shape.id)}
                    className="bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs px-2 py-1 rounded"
                  >
                    Flip
                  </button>
                  <button
                    onClick={() => resetShapePreview(shape.id)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded"
                  >
                    Reset
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionShapes;