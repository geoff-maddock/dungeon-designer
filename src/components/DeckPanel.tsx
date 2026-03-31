import React, { useState } from 'react';
import { CardDraw } from '../types';

export interface DeckPanelProps {
    // Deck management
    deck: CardDraw[];
    drawnCards: CardDraw[];   // played-card history
    discardPile: CardDraw[];  // cards burned from hand at end of turn
    deckCount: number;
    onDeckCountChange: (n: number) => void;
    onReset: () => void;
    // Hand
    hand: CardDraw[];
    handSize: number;
    onHandSizeChange: (n: number) => void;
    /** Draw one card into the hand. Disabled when hand is full or deck is empty. */
    onDrawToHand: () => void;
    selectedHandIndex: number | null;
    onSelectHandCard: (idx: number | null) => void;
    // Plays
    playsPerTurn: number;
    playsRemaining: number;
    onPlaysPerTurnChange: (n: number) => void;
    // Turn management
    onEndTurn: () => void;
    // Misc
    /** Disable draw + play buttons (e.g. while an encounter is pending). */
    disabled?: boolean;
    /** Optional board-specific content rendered between controls and hand. */
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

/** Small card tile used in history / discard strips. */
export function CardTile({ card }: { card: CardDraw }) {
    return (
        <div className={`w-10 h-14 border rounded flex items-center justify-center text-xs ${getCardColor(card.suit)} shadow-sm bg-white flex-shrink-0`}>
            <div className="text-center leading-tight">
                <div className="font-bold">{card.value}</div>
                <div>{getSuitSymbol(card.suit)}</div>
            </div>
        </div>
    );
}

/** Larger selectable card tile used in the hand display. */
function HandCardTile({
    card, selected, disabled, onClick,
}: {
    card: CardDraw;
    selected: boolean;
    disabled?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-14 h-20 border-2 rounded-lg flex flex-col items-center justify-center shadow-sm bg-white transition-all
                ${selected
                    ? 'border-indigo-500 ring-2 ring-indigo-300 scale-105 shadow-md'
                    : 'border-gray-300 hover:border-indigo-300 hover:shadow'
                } ${getCardColor(card.suit)} disabled:opacity-50 disabled:cursor-not-allowed`}
            title={selected ? 'Selected — click a skill or target to play' : 'Click to select'}
        >
            <div className="text-lg font-bold leading-none">{card.value}</div>
            <div className="text-base leading-none mt-0.5">{getSuitSymbol(card.suit)}</div>
        </button>
    );
}

function Spinner({
    label, value, onDecrement, onIncrement, min = 1, max = 6,
}: {
    label: string; value: number;
    onDecrement: () => void; onIncrement: () => void;
    min?: number; max?: number;
}) {
    return (
        <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 whitespace-nowrap">{label}</span>
            <div className="flex border rounded overflow-hidden">
                <button onClick={onDecrement} disabled={value <= min}
                    className="px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-sm leading-none">−</button>
                <span className="px-2 py-0.5 text-sm font-medium">{value}</span>
                <button onClick={onIncrement} disabled={value >= max}
                    className="px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-sm leading-none">+</button>
            </div>
        </div>
    );
}

/**
 * Shared hand + deck controls. Used on every board.
 * Displays the current hand as large selectable card tiles, along with
 * discard pile and played-history strips.
 */
const DeckPanel: React.FC<DeckPanelProps> = ({
    deck, drawnCards, discardPile, deckCount, onDeckCountChange, onReset,
    hand, handSize, onHandSizeChange, onDrawToHand,
    selectedHandIndex, onSelectHandCard,
    playsPerTurn, playsRemaining, onPlaysPerTurnChange,
    onEndTurn,
    disabled = false,
    children,
}) => {
    const [historyOpen, setHistoryOpen] = useState(false);
    const canDraw = hand.length < handSize && deck.length > 0 && !disabled;
    const recentDiscard = [...discardPile].reverse().slice(0, 7);
    const historyCards = [...drawnCards].reverse().slice(0, 13);

    return (
        <div className="space-y-3">
            {/* Spinner row */}
            <div className="flex flex-wrap items-center gap-3">
                <Spinner label="Decks:" value={deckCount} min={1} max={3}
                    onDecrement={() => onDeckCountChange(deckCount - 1)}
                    onIncrement={() => onDeckCountChange(deckCount + 1)} />
                <Spinner label="Hand:" value={handSize} min={1} max={6}
                    onDecrement={() => onHandSizeChange(handSize - 1)}
                    onIncrement={() => onHandSizeChange(handSize + 1)} />
                <Spinner label="Plays:" value={playsPerTurn} min={1} max={6}
                    onDecrement={() => onPlaysPerTurnChange(playsPerTurn - 1)}
                    onIncrement={() => onPlaysPerTurnChange(playsPerTurn + 1)} />
            </div>

            {/* Action buttons + plays indicator */}
            <div className="flex flex-wrap items-center gap-2">
                <button onClick={onDrawToHand} disabled={!canDraw}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-sm font-medium disabled:opacity-40">
                    Draw ({deck.length} left)
                </button>
                <button onClick={onEndTurn}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded text-sm font-medium">
                    End Turn
                </button>
                <button onClick={onReset}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-medium">
                    Reset Deck
                </button>
                <div className="ml-auto flex items-center gap-1.5 text-xs">
                    <span className="text-gray-500">Plays:</span>
                    <span className={`font-bold ${playsRemaining > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                        {playsRemaining}/{playsPerTurn}
                    </span>
                </div>
            </div>

            {/* Board-specific guidance */}
            {children}

            {/* Hand */}
            <div>
                <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Hand ({hand.length}/{handSize})
                    </span>
                    {selectedHandIndex !== null && hand[selectedHandIndex] && (
                        <span className="text-xs text-indigo-600 font-medium">
                            ✦ {hand[selectedHandIndex].value}{getSuitSymbol(hand[selectedHandIndex].suit)} selected
                        </span>
                    )}
                </div>
                {hand.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">
                        {deck.length === 0 ? 'Deck empty — reset to continue.' : 'Click Draw to fill your hand.'}
                    </p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {hand.map((card, i) => (
                            <HandCardTile
                                key={i}
                                card={card}
                                selected={selectedHandIndex === i}
                                disabled={disabled}
                                onClick={() => onSelectHandCard(i)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Discard pile */}
            {recentDiscard.length > 0 && (
                <div>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                        Discard ({discardPile.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5 opacity-60">
                        {recentDiscard.map((card, i) => <CardTile key={i} card={card} />)}
                    </div>
                </div>
            )}

            {/* Played history (collapsible) */}
            {drawnCards.length > 0 && (
                <div>
                    <button onClick={() => setHistoryOpen(o => !o)}
                        className="text-xs text-gray-400 hover:text-gray-600 underline">
                        {historyOpen ? 'Hide' : 'Show'} played history ({drawnCards.length})
                    </button>
                    {historyOpen && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {historyCards.map((card, i) => <CardTile key={i} card={card} />)}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DeckPanel;
