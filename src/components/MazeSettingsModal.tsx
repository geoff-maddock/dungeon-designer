import React, { useState } from 'react';
import { MazeSettings } from '../types';

interface MazeSettingsModalProps {
    settings: MazeSettings;
    onSave: (settings: MazeSettings) => void;
    onClose: () => void;
}

const DEFAULT_MAZE_SETTINGS: MazeSettings = {
    goalCount: 1,
    goalPathLength: 20,
    placementStrategy: 'random',
};

const MazeSettingsModal: React.FC<MazeSettingsModalProps> = ({ settings, onSave, onClose }) => {
    const [local, setLocal] = useState<MazeSettings>({ ...settings });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Maze Settings</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>

                <p className="text-sm text-gray-500 mb-6">
                    Configure how the maze is generated. Goals will be placed at cells whose path
                    distance from the Entrance is closest to the specified length.
                </p>

                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium mb-1">Number of Goals</label>
                        <input
                            type="number"
                            min={1}
                            max={10}
                            value={local.goalCount}
                            onChange={e => setLocal({ ...local, goalCount: Math.max(1, parseInt(e.target.value) || 1) })}
                            className="w-full border rounded px-3 py-2 text-sm"
                        />
                        <p className="text-xs text-gray-400 mt-1">How many ⭐ Goal cells to place (1–10)</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Goal Path Length (spaces)</label>
                        <input
                            type="number"
                            min={5}
                            max={200}
                            value={local.goalPathLength}
                            onChange={e => setLocal({ ...local, goalPathLength: Math.max(5, parseInt(e.target.value) || 20) })}
                            className="w-full border rounded px-3 py-2 text-sm"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            Target number of steps from Entrance to each Goal along the maze path
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Populate Placement Strategy</label>
                        <div className="flex gap-6 mt-1">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="radio"
                                    name="placementStrategy"
                                    checked={local.placementStrategy !== 'depth-aware'}
                                    onChange={() => setLocal({ ...local, placementStrategy: 'random' })}
                                />
                                Random
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="radio"
                                    name="placementStrategy"
                                    checked={local.placementStrategy === 'depth-aware'}
                                    onChange={() => setLocal({ ...local, placementStrategy: 'depth-aware' })}
                                />
                                Depth-Aware
                            </label>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            Depth-Aware places easier items (Keys, Supplies, Mana) near the entrance and harder items (Encounters, Treasure, Relics) deeper in the maze.
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex justify-between items-center">
                    <button
                        onClick={() => setLocal({ ...DEFAULT_MAZE_SETTINGS })}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
                    >
                        Reset to Defaults
                    </button>
                    <div className="flex space-x-2">
                        <button onClick={onClose} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded">
                            Cancel
                        </button>
                        <button
                            onClick={() => onSave(local)}
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

export default MazeSettingsModal;
