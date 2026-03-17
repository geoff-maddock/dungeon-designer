import React from 'react';
import { EncounterCard } from '../types';

interface EncounterPanelProps {
    cards: EncounterCard[];
    difficultyZones: number;
    onHoverCard?: (key: string | null) => void;
}

// Zone index → visual theme
const ZONE_STYLES = [
    { bg: 'bg-green-50', border: 'border-green-400', badge: 'bg-green-500', label: 'Zone 1' },
    { bg: 'bg-yellow-50', border: 'border-yellow-400', badge: 'bg-yellow-500', label: 'Zone 2' },
    { bg: 'bg-orange-50', border: 'border-orange-400', badge: 'bg-orange-500', label: 'Zone 3' },
    { bg: 'bg-red-50', border: 'border-red-400', badge: 'bg-red-500', label: 'Zone 4' },
    { bg: 'bg-purple-50', border: 'border-purple-400', badge: 'bg-purple-500', label: 'Zone 5' },
];

function zoneStyle(zone: number) {
    return ZONE_STYLES[Math.min(zone, ZONE_STYLES.length - 1)];
}

/** Convert row/col to a readable grid reference like "C4" */
function cellRef(row: number, col: number): string {
    const letter = String.fromCharCode(65 + (col % 26));
    return `${letter}${row + 1}`;
}

const EncounterPanel: React.FC<EncounterPanelProps> = ({ cards, difficultyZones, onHoverCard }) => {
    if (cards.length === 0) return null;

    // Group cards by zone for a cleaner layout
    const byZone: EncounterCard[][] = Array.from({ length: difficultyZones }, () => []);
    for (const card of cards) {
        const idx = Math.min(card.zone, difficultyZones - 1);
        byZone[idx].push(card);
    }

    return (
        <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                ⚔️ Encounter Cards
            </h3>
            <div className="flex flex-wrap gap-2">
                {cards.map((card, i) => {
                    const style = zoneStyle(card.zone);
                    return (
                        <div
                            key={i}
                            className={`relative flex flex-col rounded border-2 ${style.border} ${style.bg} w-28 text-xs shadow-sm overflow-hidden cursor-pointer`}
                            onMouseEnter={() => onHoverCard?.(`${card.row},${card.col}`)}
                            onMouseLeave={() => onHoverCard?.(null)}
                        >
                            {/* Zone badge header */}
                            <div className={`${style.badge} text-white font-bold text-center py-0.5 text-xs`}>
                                {zoneStyle(card.zone).label}
                            </div>

                            {/* Icon + name */}
                            <div className="flex flex-col items-center pt-1 pb-0.5 gap-0">
                                <span className="text-xl leading-tight">👾</span>
                                <span className="font-semibold text-gray-800 leading-tight text-center px-1">
                                    {card.monsterName}
                                </span>
                            </div>

                            {/* Stats */}
                            <div className="px-1.5 pb-1.5 pt-0.5 space-y-0.5 border-t border-gray-200 mt-1">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Str</span>
                                    <span className="font-mono font-semibold text-gray-700">{card.strength}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">XP</span>
                                    <span className="font-semibold text-blue-700">{card.xp}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Gold</span>
                                    <span className="font-semibold text-yellow-700">💰{card.gold}</span>
                                </div>
                            </div>

                            {/* Cell reference */}
                            <div className="text-right text-gray-400 pr-1 pb-0.5 text-xs leading-none">
                                {cellRef(card.row, card.col)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default EncounterPanel;
