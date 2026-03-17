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
    coloredItemPercentage: 30,
    difficultyZones: 3,
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
                        <div className="flex gap-6 mt-1 flex-wrap">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="radio"
                                    name="placementStrategy"
                                    checked={local.placementStrategy !== 'depth-aware' && local.placementStrategy !== 'dead-ends'}
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
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="radio"
                                    name="placementStrategy"
                                    checked={local.placementStrategy === 'dead-ends'}
                                    onChange={() => setLocal({ ...local, placementStrategy: 'dead-ends' })}
                                />
                                Dead Ends
                            </label>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            {local.placementStrategy === 'depth-aware' && 'Depth-Aware places easier items near the entrance and harder items deeper in the maze.'}
                            {local.placementStrategy === 'dead-ends' && 'Dead Ends places Treasure and Relics at dead-end locations first. Other items are spread evenly between the entrance and dead ends.'}
                            {(!local.placementStrategy || local.placementStrategy === 'random') && 'Random distributes all items uniformly across the maze.'}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            % of Items on a Colored Space: <span className="font-bold">{local.coloredItemPercentage ?? 30}%</span>
                        </label>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={local.coloredItemPercentage ?? 30}
                            onChange={e => setLocal({ ...local, coloredItemPercentage: parseInt(e.target.value) })}
                            className="w-full"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            Probability that each placed item cell gets a random color background. Energy cells always have a color regardless.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Difficulty Zones</label>
                        <input
                            type="number"
                            min={0}
                            max={5}
                            value={local.difficultyZones ?? 0}
                            onChange={e => setLocal({ ...local, difficultyZones: Math.max(0, Math.min(5, parseInt(e.target.value) || 0)) })}
                            className="w-full border rounded px-3 py-2 text-sm"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            Divides the maze into N difficulty bands radiating from the entrance (0 = disabled). Encounter cards are generated for each encounter cell based on its zone. Max 5.
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
