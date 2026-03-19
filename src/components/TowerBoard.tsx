import React from 'react';
import { CardDraw } from '../types';
import DeckPanel from './DeckPanel';

interface TowerBoardProps {
  deck: CardDraw[];
  drawnCards: CardDraw[];
  deckCount: number;
  onDrawCard: () => CardDraw | null;
  onDeckCountChange: (n: number) => void;
  onResetDeck: () => void;
}

const TowerBoard: React.FC<TowerBoardProps> = ({
  deck,
  drawnCards,
  deckCount,
  onDrawCard,
  onDeckCountChange,
  onResetDeck,
}) => {
  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Tower Adventure Board</h1>
      <p className="mb-4">
        Welcome to the Tower! Here you will encounter various magical energies and traps. The more you explore, the more magic you accrue. At the top, you must battle a powerful wizard.
      </p>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <DeckPanel
          deck={deck}
          drawnCards={drawnCards}
          deckCount={deckCount}
          onDraw={onDrawCard}
          onReset={onResetDeck}
          onDeckCountChange={onDeckCountChange}
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        {/* Example cells */}
        <div className="bg-white p-4 rounded shadow">Cell 1</div>
        <div className="bg-white p-4 rounded shadow">Cell 2</div>
        <div className="bg-white p-4 rounded shadow">Cell 3</div>
        <div className="bg-white p-4 rounded shadow">Cell 4</div>
      </div>
    </div>
  );
};

export default TowerBoard;
