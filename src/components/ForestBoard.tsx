import React from 'react';
import { CardDraw } from '../types';
import DeckPanel from './DeckPanel';

interface ForestBoardProps {
  deck: CardDraw[];
  drawnCards: CardDraw[];
  discardPile: CardDraw[];
  deckCount: number;
  hand: CardDraw[];
  handSize: number;
  playsPerTurn: number;
  playsRemaining: number;
  selectedHandIndex: number | null;
  onDrawToHand: () => void;
  onSelectHandCard: (idx: number | null) => void;
  onPlayCard: (idx: number) => void;
  onEndTurn: () => void;
  onHandSizeChange: (n: number) => void;
  onPlaysPerTurnChange: (n: number) => void;
  onDeckCountChange: (n: number) => void;
  onResetDeck: () => void;
}

const ForestBoard: React.FC<ForestBoardProps> = ({
  deck, drawnCards, discardPile, deckCount,
  hand, handSize, playsPerTurn, playsRemaining,
  selectedHandIndex, onDrawToHand, onSelectHandCard,
  onPlayCard, onEndTurn, onHandSizeChange, onPlaysPerTurnChange,
  onDeckCountChange, onResetDeck,
}) => {
  return (
    <div className="p-4 bg-green-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Forest Adventure Board</h1>
      <p className="mb-4">
        Welcome to the Enchanted Forest! Here you can gather resources that can be collected and used to improve your abilities, heal your character, or sell for gold. The more you explore specific areas, the more special bonuses you will earn. Beware, there is a small chance of encountering danger.
      </p>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <DeckPanel
          deck={deck} drawnCards={drawnCards} discardPile={discardPile} deckCount={deckCount}
          hand={hand} handSize={handSize} playsPerTurn={playsPerTurn} playsRemaining={playsRemaining}
          selectedHandIndex={selectedHandIndex}
          onDrawToHand={onDrawToHand} onSelectHandCard={onSelectHandCard}
          onEndTurn={onEndTurn} onHandSizeChange={onHandSizeChange}
          onPlaysPerTurnChange={onPlaysPerTurnChange}
          onReset={onResetDeck} onDeckCountChange={onDeckCountChange}
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded shadow">Cell 1</div>
        <div className="bg-white p-4 rounded shadow">Cell 2</div>
        <div className="bg-white p-4 rounded shadow">Cell 3</div>
        <div className="bg-white p-4 rounded shadow">Cell 4</div>
      </div>
    </div>
  );
};

export default ForestBoard;
