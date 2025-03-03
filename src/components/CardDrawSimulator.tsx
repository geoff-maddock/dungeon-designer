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
  const [unplaceableCount, setUnplaceableCount] = useState<number>(0);
  const [lastFailureReason, setLastFailureReason] = useState<string>('');

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
    setUnplaceableCount(0); // Reset the unplaceable count
    setLastFailureReason(''); // Reset the failure reason
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

    // Track failure reasons for debugging
    const failureReasons: string[] = [];
    let isPlaced = false;

    // Try each shape with different orientations
    for (const shapeObj of matchingShapes) {
      let shape = shapeObj.shape;
      let found = false;

      // Try original shape
      let placement = findValidPlacement(board, shape, placedShapes);
      if (placement) {
        // Place shape and return
        found = true;
      }

      // Try rotations
      if (!found) {
        // Rotate 90°
        shape = rotateShape(shape);
        placement = findValidPlacement(board, shape, placedShapes);
        if (placement) found = true;
      }

      if (!found) {
        // Rotate 180°
        shape = rotateShape(shape);
        placement = findValidPlacement(board, shape, placedShapes);
        if (placement) found = true;
      }

      if (!found) {
        // Rotate 270°
        shape = rotateShape(shape);
        placement = findValidPlacement(board, shape, placedShapes);
        if (placement) found = true;
      }

      // Try flipping horizontally
      if (!found) {
        shape = flipShapeHorizontal(shapeObj.shape); // Start with original
        placement = findValidPlacement(board, shape, placedShapes);
        if (placement) found = true;
      }

      // Try flipping horizontally + rotations
      if (!found) {
        // Rotate flipped 90°
        shape = rotateShape(shape);
        placement = findValidPlacement(board, shape, placedShapes);
        if (placement) found = true;
      }

      if (!found) {
        // Rotate flipped 180°
        shape = rotateShape(shape);
        placement = findValidPlacement(board, shape, placedShapes);
        if (placement) found = true;
      }

      if (!found) {
        // Rotate flipped 270°
        shape = rotateShape(shape);
        placement = findValidPlacement(board, shape, placedShapes);
        if (placement) found = true;
      }

      // Try flipping vertically
      if (!found) {
        shape = flipShapeVertical(shapeObj.shape); // Start with original
        placement = findValidPlacement(board, shape, placedShapes);
        if (placement) found = true;
      }

      if (found && placement) {
        // Process cell actions for each covered cell
        const actionsMessage = resolveCellActions(board, shape, placement.row, placement.col);

        // Place the shape and return
        setMessage(`Placed shape for ${card.value} of ${card.suit}. ${actionsMessage}`);

        const newPlacedShape = {
          shape,
          startRow: placement.row,
          startCol: placement.col,
          cardValue: card.value,
          cardSuit: card.suit
        };

        setPlacedShapes(prev => [...prev, newPlacedShape]);
        onPlaceShape(placement.row, placement.col, shape, card.value, card.suit);

        // Mark card as placed
        setDrawnCards(prev =>
          prev.map((c, i) =>
            i === prev.length - 1 ? { ...c, isPlaced: true } : c
          )
        );

        return; // Shape successfully placed, exit the function
      } else {
        // If we couldn't place this shape, get diagnostic information
        const reason = checkPlacementFailureReason(board, shapeObj.shape, placedShapes);
        failureReasons.push(`Shape ${shapeObj.id}: ${reason}`);
      }
    }

    // If we get here, no valid placement was found
    setUnplaceableCount(prev => prev + 1);
    const failureReason = failureReasons.length > 0 ? failureReasons[0] : "Unknown reason";
    setLastFailureReason(failureReason);
    setMessage(`Drew ${card.value} of ${card.suit} - No valid placement found! Reason: ${failureReason}`);
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
            case CellType.Lock:
              actions.push("Unlocked a Lock");
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

  const checkPlacementFailureReason = (board: Board, shape: number[][], placedShapes: PlacedShape[]): string => {
    const size = board.length;

    // Check if shape is too big for the board
    if (shape.length > size || shape[0].length > size) {
      return "Shape is too large for the board";
    }

    let adjacencyFound = false;
    let overlapsEntrance = false;
    let validPositionExists = false;

    // Check for any valid position
    for (let startRow = 0; startRow <= size - shape.length; startRow++) {
      for (let startCol = 0; startCol <= size - shape[0].length; startCol++) {
        // First check if the shape would fit at this position (no walls or overlaps)
        let fits = true;
        let currentOverlapsEntrance = false;

        // Check if it fits (no walls or overlaps)
        for (let r = 0; r < shape.length && fits; r++) {
          for (let c = 0; c < shape[0].length && fits; c++) {
            if (shape[r][c] === 1) {
              const boardRow = startRow + r;
              const boardCol = startCol + c;
              const cellType = board[boardRow][boardCol].type;

              // Check for entrance
              if (cellType === CellType.Entrance) {
                currentOverlapsEntrance = true;
              }

              // Check for wall
              if (cellType === CellType.Wall) {
                fits = false;
                break;
              }

              // Check for overlap with existing shapes
              for (const placedShape of placedShapes) {
                const placedRow = boardRow - placedShape.startRow;
                const placedCol = boardCol - placedShape.startCol;

                if (
                  placedRow >= 0 &&
                  placedRow < placedShape.shape.length &&
                  placedCol >= 0 &&
                  placedCol < placedShape.shape[0].length &&
                  placedShape.shape[placedRow][placedCol] === 1
                ) {
                  fits = false;
                  break;
                }
              }
            }
          }
        }

        // If it fits, now check for adjacency
        if (fits) {
          validPositionExists = true;

          // First shape needs to cover entrance
          if (placedShapes.length === 0) {
            if (currentOverlapsEntrance) {
              return "Valid placement found";
            }
            continue; // Skip adjacency check for first shape if it doesn't cover entrance
          }

          overlapsEntrance = overlapsEntrance || currentOverlapsEntrance;

          // Now check if any cell of the shape is adjacent to any cell of any existing shape
          let isAdjacent = false;

          // Check each cell of the shape
          for (let r = 0; r < shape.length && !isAdjacent; r++) {
            for (let c = 0; c < shape[0].length && !isAdjacent; c++) {
              if (shape[r][c] === 1) {
                const boardRow = startRow + r;
                const boardCol = startCol + c;

                // Check all four adjacent directions
                const directions = [[-1, 0], [0, 1], [1, 0], [0, -1]];

                for (const [dr, dc] of directions) {
                  const adjRow = boardRow + dr;
                  const adjCol = boardCol + dc;

                  // Skip if out of bounds
                  if (adjRow < 0 || adjRow >= size || adjCol < 0 || adjCol >= size) {
                    continue;
                  }

                  // Check if adjacent to any existing placed shape
                  for (const placedShape of placedShapes) {
                    const placedRow = adjRow - placedShape.startRow;
                    const placedCol = adjCol - placedShape.startCol;

                    if (
                      placedRow >= 0 &&
                      placedRow < placedShape.shape.length &&
                      placedCol >= 0 &&
                      placedCol < placedShape.shape[0].length &&
                      placedShape.shape[placedRow][placedCol] === 1
                    ) {
                      isAdjacent = true;
                      adjacencyFound = true;
                      break;
                    }
                  }

                  if (isAdjacent) break;
                }
              }
            }
          }

          // If this position is valid and adjacent, we've found a valid placement
          if (isAdjacent) {
            return "Valid placement found";
          }
        }
      }
    }

    // Determine the reason why no valid placement was found
    if (!validPositionExists) {
      return "No position exists where the shape fits without overlapping walls or existing shapes";
    }

    if (placedShapes.length === 0 && !overlapsEntrance) {
      return "First shape must cover the entrance";
    }

    if (!adjacencyFound) {
      return "Shape must be adjacent to existing shapes";
    }

    // If we get here, we might have a wall boundary issue
    return "Shape placement blocked by wall boundaries";
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
        <div className="flex flex-col text-sm text-right">
          <div>
            <span className="font-medium">Uncovered Cells: </span>
            <span className="text-indigo-700 font-bold">{uncoveredCells}</span>
          </div>
          <div>
            <span className="font-medium">Unplaceable Shapes: </span>
            <span className={`font-bold ${unplaceableCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {unplaceableCount}
            </span>
          </div>
        </div>
      </div>

      {/* Add additional info for the last failure reason if one exists */}
      {lastFailureReason && (
        <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          <div className="font-semibold">Last Placement Failure:</div>
          <div>{lastFailureReason}</div>
        </div>
      )}

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