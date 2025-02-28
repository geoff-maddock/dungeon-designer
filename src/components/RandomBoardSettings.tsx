import React from 'react';
import { CellType, ColorRequirement } from '../types';
import { Shuffle, Grid, MapPin } from 'lucide-react';

interface RandomBoardSettingsProps {
    settings: {
        [key in CellType | ColorRequirement]?: number;
    };
    wallCount: number;
    onSettingChange: (type: CellType | ColorRequirement, value: number) => void;
    onWallCountChange: (count: number) => void;
    onClose: () => void;
    onGenerate: () => void;
    onTrueRandom: () => void;
    onAdvancedGenerate: () => void; // Add this new prop
}

const RandomBoardSettings: React.FC<RandomBoardSettingsProps> = ({
    settings,
    wallCount,
    onSettingChange,
    onWallCountChange,
    onClose,
    onGenerate,
    onTrueRandom,
    onAdvancedGenerate // Add this prop
}) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Board Settings</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-medium mb-2">Cell Types</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {Object.values(CellType).filter(type => type !== CellType.Empty && type !== CellType.Wall).map(cellType => (
                                <div key={cellType} className="space-y-1">
                                    <label className="text-sm font-medium">{cellType.charAt(0).toUpperCase() + cellType.slice(1)}</label>
                                    <div className="flex items-center">
                                        <input
                                            type="number"
                                            min="0"
                                            max="50"
                                            value={settings[cellType] || 0}
                                            onChange={(e) => onSettingChange(cellType, parseInt(e.target.value) || 0)}
                                            className="w-full border rounded px-2 py-1 text-sm"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-medium mb-2">Walls</h3>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Wall Cells</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={wallCount}
                                onChange={(e) => onWallCountChange(parseInt(e.target.value) || 0)}
                                className="w-full border rounded px-2 py-1 text-sm"
                            />
                            <p className="text-xs text-gray-500">Percentage of the board (0-100)</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-medium mb-2">Color Requirements</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {Object.values(ColorRequirement).filter(color => color !== ColorRequirement.None).map(color => (
                                <div key={color} className="space-y-1">
                                    <label className="text-sm font-medium">{color.charAt(0).toUpperCase() + color.slice(1)}</label>
                                    <div className="flex items-center">
                                        <input
                                            type="number"
                                            min="0"
                                            max="50"
                                            value={settings[color] || 0}
                                            onChange={(e) => onSettingChange(color, parseInt(e.target.value) || 0)}
                                            className="w-full border rounded px-2 py-1 text-sm"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end space-x-2">
                    <button
                        onClick={onAdvancedGenerate} // Add this new button
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center"
                    >
                        <MapPin className="mr-1" size={18} /> Generate Maze
                    </button>
                    <button
                        onClick={onTrueRandom}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded flex items-center"
                    >
                        <Shuffle className="mr-1" size={18} /> True Random
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onGenerate}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
                    >
                        <Grid className="mr-1 inline" size={18} /> Standard Board
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RandomBoardSettings;