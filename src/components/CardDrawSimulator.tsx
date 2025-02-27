import React, { useState } from 'react';
import { CardValue, CardDraw, Board, ActionShape } from '../types';
import { findValidPlacement } from '../utils/gameLogic';

interface CardDrawSimulatorProps {
  board: Board;
  actionShapes: ActionShape[];
  onPlaceShape: (startRow: number, startCol: number, shape: number[][]) => void;
}

const CardDrawSimulator: React.FC<CardDrawSimulatorProps> = ({ 
  board, 
  actionShapes,
  onPlaceShape
}) => {
  const [drawnCards, setDrawnCards] = useState<CardDraw[]>([]);
  const [message, setMessage] = useState<string>('');
  
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
  const values: CardValue[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  
  const drawCard = () => {
    // Simple random card draw
    const randomSuit = suits[Math.floor(Math.random() * suits.length)];
    const randomValue = values[Math.floor(Math.random() * values.length)];
    
    const newCard: CardDraw = {
      value: randomValue,
      suit: randomSuit,
      isPlaced: false
    };
    
    setDrawnCards(prev => [...prev, newCard]);
    
    // Try to place the shape based on the card value
    tryPlaceShape(newCard);
  };
  
  const tryPlaceShape = (card: CardDraw) => {
    // Face cards trigger encounter
    if (['J', 'Q', 'K'].includes(card.value)) {
      setMessage(`Drew ${card.value} of ${card.suit} - Automatic encounter!`);
      return;
    }
    
    // Find shapes that match this card value
    const matchingShapes = actionShapes.filter(shape => 
      shape.cardValues.includes(card.value)
    );
    
    if (matchingShapes.length === 0) {
      setMessage(`No shapes available for card value ${card.value}`);
      return;
    }
    
    // Try each shape until we find a valid placement
    for (const shape of matchingShapes) {
      const placement = findValidPlacement(board, shape.shape);
      
      if (placement) {
        setMessage(`Placed shape for ${card.value} of ${card.suit} at position [${placement.row}, ${placement.col}]`);
        onPlaceShape(placement.row, placement.col, shape.shape);
        
        // Mark this card as placed
        setDrawnCards(prev => 
          prev.map((c, i) => 
            i === prev.length - 1 ? { ...c, isPlaced: true } : c
          )
        );
        return;
      }
    }
    
    setMessage(`Drew ${card.value} of ${card.suit} - No valid placement found!`);
  };
  
  const getCardColor = (suit: string) => {
    return suit === 'hearts' || suit === 'diamonds' ? 'text-red-600' : 'text-black';
  };
  
  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      default: return '';
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold mb-3">Card Draw Simulator</h2>
      
      <div className="mb-4">
        <button 
          onClick={drawCard}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
        >
          Draw Card
        </button>
      </div>
      
      {message && (
        <div className="mb-4 p-2 bg-gray-100 rounded">
          {message}
        </div>
      )}
      
      <div className="flex flex-wrap gap-2">
        {drawnCards.map((card, index) => (
          <div 
            key={index} 
            className={`w-12 h-16 border rounded flex items-center justify-center ${
              card.isPlaced ? 'opacity-50' : ''
            } ${getCardColor(card.suit)}`}
          >
            <div className="text-center">
              <div>{card.value}</div>
              <div>{getSuitSymbol(card.suit)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CardDrawSimulator;