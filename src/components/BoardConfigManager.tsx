import React, { useState } from 'react';
import { Trash2, Download, Upload, Save } from 'lucide-react';
import { BoardConfig, CellType } from '../types';

interface BoardConfigManagerProps {
  configs: BoardConfig[];
  currentConfigName: string;
  onSaveConfig: (name: string) => void;
  onLoadConfig: (config: BoardConfig) => void;
  onDeleteConfig: (id: string) => void;
  onExportConfigs: () => void;
  onImportConfigs: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const BoardConfigManager: React.FC<BoardConfigManagerProps> = ({
  configs,
  currentConfigName,
  onSaveConfig,
  onLoadConfig,
  onDeleteConfig,
  onExportConfigs,
  onImportConfigs,
}) => {
  const [newName, setNewName] = useState(currentConfigName);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  const summarizeConfig = (cfg: BoardConfig) => {
    const parts: string[] = [`${cfg.boardSize}×${cfg.boardSize}`];
    const goalCount = cfg.cellTypeCounts?.[CellType.Goal];
    if (goalCount) parts.push(`${goalCount} goal${goalCount > 1 ? 's' : ''}`);
    if (cfg.mazeSettings?.goalPathLength) parts.push(`path ~${cfg.mazeSettings.goalPathLength}`);
    return parts.join(' · ');
  };

  return (
    <div className="space-y-4">
      {/* Save current settings as config */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Config Name</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Config name…"
            className="flex-1 border rounded px-2 py-1 text-sm"
          />
          <button
            onClick={() => { if (newName.trim()) onSaveConfig(newName.trim()); }}
            disabled={!newName.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-1 rounded flex items-center gap-1 text-sm"
          >
            <Save size={14} /> Save
          </button>
        </div>
        <p className="text-xs text-gray-400">
          Saves current board size, cell counts, color requirements, wall %, and maze settings.
        </p>
      </div>

      {/* Config list */}
      {configs.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No configs saved yet</p>
      ) : (
        <ul className="space-y-2">
          {configs.map(cfg => (
            <li
              key={cfg.id}
              className="flex items-start justify-between p-2 bg-gray-50 rounded border border-gray-100"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{cfg.name}</p>
                <p className="text-xs text-gray-400">{summarizeConfig(cfg)}</p>
                <p className="text-xs text-gray-300">{formatDate(cfg.createdAt)}</p>
              </div>
              <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                <button
                  onClick={() => onLoadConfig(cfg)}
                  className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-50"
                >
                  Load
                </button>
                <button
                  onClick={() => onDeleteConfig(cfg.id)}
                  className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                  title="Delete config"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Import / Export */}
      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={onExportConfigs}
          disabled={configs.length === 0}
          className="flex-1 flex items-center justify-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-50 px-2 py-1 rounded"
        >
          <Download size={13} /> Export
        </button>
        <label className="flex-1 flex items-center justify-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded cursor-pointer">
          <Upload size={13} /> Import
          <input
            type="file"
            accept=".json"
            onChange={onImportConfigs}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
};

export default BoardConfigManager;
