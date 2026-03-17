import React, { useState } from 'react';
import { CellType, ColorRequirement } from '../types';

interface RandomBoardSettingsProps {
    settings: {
        [key in CellType | ColorRequirement]?: number;
    };
    wallCount: number;
    defaultSettings: { [key in CellType | ColorRequirement]?: number };
    defaultWallCount: number;
    onSave: (settings: { [key in CellType | ColorRequirement]?: number }, wallCount: number) => void;
    onClose: () => void;
}

const RandomBoardSettings: React.FC<RandomBoardSettingsProps> = ({
    settings,
    wallCount,
    defaultSettings,
    defaultWallCount,
    onSave,
    onClose,
}) => {
    const [localSettings, setLocalSettings] = useState({ ...settings });
    const [localWallCount, setLocalWallCount] = useState(wallCount);

    const handleSettingChange = (type: CellType | ColorRequirement, value: number) => {
        setLocalSettings(prev => ({ ...prev, [type]: value }));
    };

    const handleResetToDefaults = () => {
        setLocalSettings({ ...defaultSettings });
        setLocalWallCount(defaultWallCount);
    };

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
                                    <input
                                        type="number"
                                        min="0"
                                        max="50"
                                        value={localSettings[cellType] ?? 0}
                                        onChange={(e) => handleSettingChange(cellType, parseInt(e.target.value) || 0)}
                                        className="w-full border rounded px-2 py-1 text-sm"
                                    />
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
                                value={localWallCount}
                                onChange={(e) => setLocalWallCount(parseInt(e.target.value) || 0)}
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
                                    <input
                                        type="number"
                                        min="0"
                                        max="50"
                                        value={localSettings[color] ?? 0}
                                        onChange={(e) => handleSettingChange(color, parseInt(e.target.value) || 0)}
                                        className="w-full border rounded px-2 py-1 text-sm"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-between items-center">
                    <button
                        onClick={handleResetToDefaults}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
                    >
                        Reset to Defaults
                    </button>
                    <div className="flex space-x-2">
                        <button
                            onClick={onClose}
                            className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onSave(localSettings, localWallCount)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RandomBoardSettings;
