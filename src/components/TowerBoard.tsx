import React from 'react';
import { CardDraw } from '../types';
import DeckPanel from './DeckPanel';

interface TowerBoardProps {
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

const TowerBoard: React.FC<TowerBoardProps> = ({
  deck, drawnCards, discardPile, deckCount,
  hand, handSize, playsPerTurn, playsRemaining,
  selectedHandIndex, onDrawToHand, onSelectHandCard,
  onPlayCard, onEndTurn, onHandSizeChange, onPlaysPerTurnChange,
  onDeckCountChange, onResetDeck,
}) => {
  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Tower Adventure Board</h1>
      <p className="mb-4">
        Welcome to the Tower! Here you will encounter various magical energies and traps. The more you explore, the more magic you accrue. At the top, you must battle a powerful wizard.
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

export default TowerBoard;
