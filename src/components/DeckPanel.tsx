import React from 'react';
import { CardDraw } from '../types';

export interface DeckPanelProps {
    deck: CardDraw[];
    drawnCards: CardDraw[];
    deckCount: number;
    /** Disable the Draw button (e.g. while an encounter is pending). */
    disabled?: boolean;
    onDraw: () => void;
    onReset: () => void;
    onDeckCountChange: (n: number) => void;
    /** Optional board-specific content rendered below the controls. */
    children?: React.ReactNode;
}

export function getCardColor(suit: string) {
    return suit === 'hearts' || suit === 'diamonds' ? 'text-red-600' : 'text-gray-900';
}

export function getSuitSymbol(suit: string) {
    switch (suit) {
        case 'hearts': return '♥';
        case 'diamonds': return '♦';
        case 'clubs': return '♣';
        case 'spades': return '♠';
        default: return '';
    }
}

/** Mini card tile used in the drawn-cards strip. */
export function CardTile({ card }: { card: CardDraw }) {
    return (
        <div
            className={`w-10 h-14 border rounded flex items-center justify-center text-xs ${getCardColor(card.suit)} shadow-sm bg-white`}
        >
            <div className="text-center leading-tight">
                <div className="font-bold">{card.value}</div>
                <div>{getSuitSymbol(card.suit)}</div>
            </div>
        </div>
    );
}

/**
 * Shared deck controls + drawn-card strip.
 * Used on every board that needs access to the shared deck.
 */
const DeckPanel: React.FC<DeckPanelProps> = ({
    deck,
    drawnCards,
    deckCount,
    disabled = false,
    onDraw,
    onReset,
    onDeckCountChange,
    children,
}) => {
    // Show last 13 drawn cards most-recent-first
    const recentDrawn = [...drawnCards].reverse().slice(0, 13);

    return (
        <div className="space-y-3">
            {/* Controls row */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Deck count spinner */}
                <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-600">Decks:</span>
                    <div className="flex border rounded overflow-hidden">
                        <button
                            onClick={() => onDeckCountChange(deckCount - 1)}
                            disabled={deckCount <= 1}
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-sm"
                        >
                            −
                        </button>
                        <span className="px-3 py-1 text-sm font-medium">{deckCount}</span>
                        <button
                            onClick={() => onDeckCountChange(deckCount + 1)}
                            disabled={deckCount >= 3}
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-sm"
                        >
                            +
                        </button>
                    </div>
                </div>

                <button
                    onClick={onDraw}
                    disabled={deck.length === 0 || disabled}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded text-sm disabled:opacity-40"
                >
                    Draw Card ({deck.length} left)
                </button>

                <button
                    onClick={onReset}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded text-sm"
                >
                    Reset Deck
                </button>
            </div>

            {/* Board-specific content (encounter prompts, guidance, etc.) */}
            {children}

            {/* Drawn cards strip */}
            {recentDrawn.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {recentDrawn.map((card, i) => (
                        <CardTile key={i} card={card} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default DeckPanel;
