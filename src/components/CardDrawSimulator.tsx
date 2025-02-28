import React, { useState, useEffect } from 'react';
import { CardValue, CardDraw, Board, ActionShape, PlacedShape, CellType } from '../types';
import {
  findValidPlacement,
  rotateShape,
  flipShapeHorizontal, // Add this
  flipShapeVertical,   // Add this
  createStandardDeck,
  shuffleDeck
} from '../utils/gameLogic';

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
  const [deck, setDeck] = useState<CardDraw[]>([]);
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

  // Initialize and shuffle deck when deckCount changes
  useEffect(() => {
    initializeDeck();
  }, [deckCount]);

  const initializeDeck = () => {
    // Create a new deck with the specified count
    let newDeck: CardDraw[] = [];

    // Add the specified number of standard decks
    for (let i = 0; i < deckCount; i++) {
      const standardDeck = createStandardDeck();
      newDeck = [...newDeck, ...standardDeck];
    }

    // Shuffle the deck
    newDeck = shuffleDeck(newDeck);

    setDeck(newDeck);
  };

  const drawCard = () => {
    if (deck.length === 0) {
      setMessage("Deck is empty! Reset to continue drawing.");
      return;
    }

    // Take the top card from the deck
    const newCard = deck[0];

    // Remove the card from the deck
    const newDeck = [...deck.slice(1)];
    setDeck(newDeck);

    setDrawnCards(prev => [...prev, newCard]);

    // Try to place the shape based on the card value
    tryPlaceShape(newCard);
  };

  const handleResetDeck = () => {
    setDrawnCards([]);
    setMessage('Deck has been reset. All placed shapes have been cleared.');
    setPlacedShapes([]);
    initializeDeck(); // Re-initialize the deck
    onResetDeck();    // Call the parent's reset function
  };

  const handleDeckCountChange = (newCount: number) => {
    if (newCount >= 1 && newCount <= 3) { // Limit to 1-3 decks
      setDeckCount(newCount);
    }
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

    // Try each shape with different orientations
    for (const shapeObj of matchingShapes) {
      let shape = shapeObj.shape;
      let placement: { row: number, col: number } | null = null;
      let transformations: string[] = [];

      // Original orientation
      placement = findValidPlacement(board, shape, placedShapes);
      if (placement) {
        transformations.push("original");
      }

      // Try all possible orientations (4 rotations × 2 flips)
      // First, try rotations of the original shape
      if (!placement) {
        // Rotate 90°
        shape = rotateShape(shape);
        placement = findValidPlacement(board, shape, placedShapes);
        if (placement) transformations.push("rotated 90°");
      }

      if (!placement) {
        // Rotate 180° (90° twice)
        shape = rotateShape(shape);
        placement = findValidPlacement(board, shape, placedShapes);
        if (placement) transformations.push("rotated 180°");
      }

      if (!placement) {
        // Rotate 270° (90° three times)
        shape = rotateShape(shape);
        placement = findValidPlacement(board, shape, placedShapes);
        if (placement) transformations.push("rotated 270°");
      }

      // Now try the horizontal flip
      if (!placement) {
        // Reset to original shape and flip horizontally
        shape = flipShapeHorizontal(shapeObj.shape);
        placement = findValidPlacement(board, shape, placedShapes);
        if (placement) transformations.push("flipped horizontally");
      }

      if (!placement) {
        // Rotate flipped shape 90°
        shape = rotateShape(shape);
        placement = findValidPlacement(board, shape, placedShapes);
        if (placement) transformations.push("flipped horizontally, rotated 90°");
      }

      if (!placement) {
        // Rotate flipped shape 180°
        shape = rotateShape(shape);
        placement = findValidPlacement(board, shape, placedShapes);
        if (placement) transformations.push("flipped horizontally, rotated 180°");
      }

      if (!placement) {
        // Rotate flipped shape 270°
        shape = rotateShape(shape);
        placement = findValidPlacement(board, shape, placedShapes);
        if (placement) transformations.push("flipped horizontally, rotated 270°");
      }

      // Finally, try the vertical flip (which is different from horizontal flip + 180° rotation)
      if (!placement) {
        // Reset to original shape and flip vertically
        shape = flipShapeVertical(shapeObj.shape);
        placement = findValidPlacement(board, shape, placedShapes);
        if (placement) transformations.push("flipped vertically");
      }

      if (placement) {
        // Process cell actions for each covered cell
        const actionsMessage = resolveCellActions(board, shape, placement.row, placement.col);

        setMessage(`Placed shape for ${card.value} of ${card.suit} (${transformations[0]}). ${actionsMessage}`);

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

    setMessage(`Drew ${card.value} of ${card.suit} - No valid placement found even with rotations and flips.`);
  };

  // Add this helper function to resolve cell actions
  const resolveCellActions = (board: Board, shape: number[][], startRow: number, startCol: number): string => {
    const actions: string[] = [];

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[0].length; c++) {
        if (shape[r][c] === 1) {
          const boardRow = startRow + r;
          const boardCol = startCol + c;
          const cell = board[boardRow][boardCol];

          switch (cell.type) {
            case CellType.Key:
              actions.push("Picked up a Key");
              break;
            case CellType.Supplies:
              actions.push("Collected Supplies");
              break;
            case CellType.Mana:
              actions.push("Gained Mana");
              break;
            case CellType.Encounter:
              actions.push("Resolved an Encounter");
              break;
            case CellType.Treasure:
              actions.push("Found Treasure");
              break;
            case CellType.Relic:
              actions.push("Discovered a Relic");
              break;
          }
        }
      }
    }

    return actions.length > 0 ? `Actions: ${actions.join(', ')}` : '';
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
          disabled={deck.length === 0}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          Draw Card ({deck.length})
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
            className={`w-12 h-16 border rounded flex items-center justify-center ${card.isPlaced ? 'opacity-25' : ''} ${getCardColor(card.suit)}`}
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