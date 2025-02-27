// Updated CardDrawSimulator.tsx
import React, { useState, useEffect } from 'react';
import { CardValue, CardDraw, Board, ActionShape, PlacedShape } from '../types';
import { findValidPlacement, rotateShape } from '../utils/gameLogic';

interface CardDrawSimulatorProps {
  board: Board;
  actionShapes: ActionShape[];
  onPlaceShape: (startRow: number, startCol: number, shape: number[][], cardValue: CardValue, cardSuit: string) => void;
  onResetDeck: () => void;
}

const CardDrawSimulator: React.FC<CardDrawSimulatorProps> = ({
  board,
  actionShapes,
  onPlaceShape,
  onResetDeck
}) => {
  const [deckCount, setDeckCount] = useState<number>(1);
  const [drawnCards, setDrawnCards] = useState<CardDraw[]>([]);
  const [message, setMessage] = useState<string>('');
  const [placedShapes, setPlacedShapes] = useState<PlacedShape[]>([]);
  const [remainingCards, setRemainingCards] = useState<number>(52); // Standard deck size
  const [uncoveredCells, setUncoveredCells] = useState<number>(0);

  useEffect(() => {
    // Calculate total available cells (excluding walls)
    const totalCells = board.flat().filter(cell => cell.type !== 'wall').length;

    // Calculate covered cells
    const coveredCells = new Set<string>();
    placedShapes.forEach(shape => {
      for (let r = 0; r < shape.shape.length; r++) {
        for (let c = 0; c < shape.shape[0].length; c++) {
          if (shape.shape[r][c] === 1) {
            coveredCells.add(`${shape.startRow + r},${shape.startCol + c}`);
          }
        }
      }
    });

    setUncoveredCells(totalCells - coveredCells.size);
  }, [board, placedShapes]);

  // Initialize deck when deckCount changes
  useEffect(() => {
    setRemainingCards(52 * deckCount);
  }, [deckCount]);

  const suits = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
  const values: CardValue[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

  const handleDeckCountChange = (newCount: number) => {
    if (newCount >= 1 && newCount <= 3) { // Limit to 1-3 decks
      setDeckCount(newCount);
      handleResetDeck(); // Reset when changing deck count
    }
  };

  const drawCard = () => {
    if (remainingCards <= 0) {
      setMessage("Deck is empty! Reset to continue drawing.");
      return;
    }

    // Simple random card draw
    const randomSuit = suits[Math.floor(Math.random() * suits.length)];
    const randomValue = values[Math.floor(Math.random() * values.length)];

    const newCard: CardDraw = {
      value: randomValue,
      suit: randomSuit,
      isPlaced: false
    };

    setDrawnCards(prev => [...prev, newCard]);
    setRemainingCards(prev => prev - 1);

    // Try to place the shape based on the card value
    tryPlaceShape(newCard);
  };

  const handleResetDeck = () => {
    setDrawnCards([]);
    setMessage('Deck has been reset. All placed shapes have been cleared.');
    setPlacedShapes([]);
    setRemainingCards(52 * deckCount);
    onResetDeck(); // Call the parent's reset function
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

    // Try each shape with different rotations
    for (const shapeObj of matchingShapes) {
      // Try original orientation
      let shape = shapeObj.shape;
      let placement = findValidPlacement(board, shape, placedShapes);

      // If not found, try rotating 90 degrees
      if (!placement) {
        shape = rotateShape(shape);
        placement = findValidPlacement(board, shape, placedShapes);
      }

      // If not found, try rotating 180 degrees
      if (!placement) {
        shape = rotateShape(shape);
        placement = findValidPlacement(board, shape, placedShapes);
      }

      // If not found, try rotating 270 degrees
      if (!placement) {
        shape = rotateShape(shape);
        placement = findValidPlacement(board, shape, placedShapes);
      }

      if (placement) {
        setMessage(`Placed shape for ${card.value} of ${card.suit} at position [${placement.row}, ${placement.col}]`);

        // Record the placed shape
        const newPlacedShape: PlacedShape = {
          shape,
          startRow: placement.row,
          startCol: placement.col,
          cardValue: card.value,
          cardSuit: card.suit
        };

        setPlacedShapes(prev => [...prev, newPlacedShape]);

        // Update the board
        onPlaceShape(placement.row, placement.col, shape, card.value, card.suit);

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

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <span className="mr-2">Decks:</span>
          <div className="flex border rounded">
            <button
              onClick={() => handleDeckCountChange(deckCount - 1)}
              disabled={deckCount <= 1}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
            >
              -
            </button>
            <span className="px-3 py-1">{deckCount}</span>
            <button
              onClick={() => handleDeckCountChange(deckCount + 1)}
              disabled={deckCount >= 3}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
            >
              +
            </button>
          </div>
        </div>
        <div className="text-sm">
          <span className="font-medium">Uncovered Cells: </span>
          <span className="text-indigo-700 font-bold">{uncoveredCells}</span>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={drawCard}
          disabled={remainingCards <= 0}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          Draw Card ({remainingCards})
        </button>
        <button
          onClick={handleResetDeck}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center"
        >
          Reset Deck
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
            className={`w-12 h-16 border rounded flex items-center justify-center ${card.isPlaced ? 'opacity-50' : ''} ${getCardColor(card.suit)}`}
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