import React, { useState, useEffect, useRef } from 'react';
import { CardDraw, Board, TurnRecord, TurnEvent, MovementStep } from '../types';
import {
  createStandardDeck,
  shuffleDeck,
  getCardMoveCount,
  findEntrance,
  getValidNeighbors,
  simulateMovement,
} from '../utils/gameLogic';

interface CardDrawSimulatorProps {
  board: Board;
  /** Called with each cell in the movement path so the parent can render overlays. */
  onMovePath: (path: { row: number; col: number }[], card: CardDraw, turnIndex: number) => void;
  onResetDeck: () => void;
}

/** State held while waiting for the player to resolve an encounter mid-turn. */
interface PendingEncounter {
  card: CardDraw;
  turnIndex: number;
  pathSoFar: MovementStep[];
  eventsSoFar: TurnEvent[];
  currentRow: number;
  currentCol: number;
  remainingSteps: number;
  /** All cells visited across the whole session — shared mutable reference. */
  visitedCells: Set<string>;
  collectedCells: Set<string>;
}

const CardDrawSimulator: React.FC<CardDrawSimulatorProps> = ({
  board,
  onMovePath,
  onResetDeck,
}) => {
  const [deckCount, setDeckCount] = useState<number>(1);
  const [drawnCards, setDrawnCards] = useState<CardDraw[]>([]);
  const [deck, setDeck] = useState<CardDraw[]>([]);
  const [turnHistory, setTurnHistory] = useState<TurnRecord[]>([]);
  const [pendingEncounter, setPendingEncounter] = useState<PendingEncounter | null>(null);

  /**
   * Items and encounters collected across all turns this session.
   * Stored in a ref so it can be mutated inside simulateMovement without
   * triggering re-renders.
   */
  const collectedCellsRef = useRef<Set<string>>(new Set());
  /** All cells visited across every turn — prevents any cross-turn backtracking. */
  const globalVisitedRef = useRef<Set<string>>(new Set());
  /**
   * All visited cells in visit order across all turns. Used by findResumePosition
   * to locate the most-recently-visited cell that still has open neighbours,
   * so a dead end on one draw never permanently blocks future draws.
   */
  const pathOrderRef = useRef<{ row: number; col: number }[]>([]);
  /** Incremented once per rank-card draw to give each turn a unique index. */
  const turnIndexRef = useRef<number>(-1);

  // Initialize / reshuffle deck when deckCount changes.
  useEffect(() => {
    initializeDeck();
  }, [deckCount]);

  const initializeDeck = () => {
    let newDeck: CardDraw[] = [];
    for (let i = 0; i < deckCount; i++) {
      newDeck = [...newDeck, ...createStandardDeck()];
    }
    setDeck(shuffleDeck(newDeck));
  };

  const handleDeckCountChange = (newCount: number) => {
    if (newCount >= 1 && newCount <= 3) setDeckCount(newCount);
  };

  /**
   * Walk the full path history in reverse and return the most recently visited
   * cell that still has at least one valid unvisited neighbour.
   * Returns null only when every reachable cell has been explored.
   */
  const findResumePosition = (): { row: number; col: number } | null => {
    for (let i = pathOrderRef.current.length - 1; i >= 0; i--) {
      const { row, col } = pathOrderRef.current[i];
      if (getValidNeighbors(board, row, col, globalVisitedRef.current).length > 0) {
        return { row, col };
      }
    }
    return null;
  };

  // -------------------------------------------------------------------------
  // Core draw logic
  // -------------------------------------------------------------------------

  const drawCard = () => {
    if (pendingEncounter) return; // must resolve encounter first
    if (deck.length === 0) return;

    const [newCard, ...rest] = deck;
    setDeck(rest);
    setDrawnCards(prev => [...prev, newCard]);

    const moveCount = getCardMoveCount(newCard.value);

    if (moveCount === null) {
      // Face card — automatic encounter, no movement
      const record: TurnRecord = {
        card: newCard,
        stepsAllowed: 0,
        path: [],
        events: [{
          type: 'face_card_encounter',
          message: `Drew ${newCard.value} of ${newCard.suit} — Automatic encounter!`,
        }],
      };
      setTurnHistory(prev => [record, ...prev]);
      return;
    }

    // First rank card: start from the entrance (which counts as space 1).
    // All subsequent draws: find the most recently visited cell in path history
    // that still has valid unvisited neighbours.  This lets the player resume
    // anywhere on their trail, so a dead end never permanently blocks progress.
    const isFirstDraw = pathOrderRef.current.length === 0;
    let startRow: number;
    let startCol: number;
    let pathPrefix: MovementStep[];
    let stepsToMove: number;

    if (isFirstDraw) {
      const entrance = findEntrance(board);
      if (!entrance) return;
      startRow = entrance.row;
      startCol = entrance.col;
      globalVisitedRef.current.add(`${startRow},${startCol}`);
      pathOrderRef.current.push({ row: startRow, col: startCol });
      pathPrefix = [{ row: startRow, col: startCol, cellType: board[startRow][startCol].type }];
      stepsToMove = moveCount - 1; // entrance already counts as space 1
    } else {
      const resumePos = findResumePosition();
      if (!resumePos) {
        // Entire reachable area has been fully explored.
        setTurnHistory(prev => [{
          card: newCard,
          stepsAllowed: moveCount,
          path: [],
          events: [{ type: 'dead_end', message: 'No valid moves remaining — the entire reachable area has been explored.' }],
        }, ...prev]);
        return;
      }
      startRow = resumePos.row;
      startCol = resumePos.col;
      pathPrefix = [];
      stepsToMove = moveCount;
    }

    const result = simulateMovement(
      board,
      startRow,
      startCol,
      stepsToMove,
      globalVisitedRef.current,
      collectedCellsRef.current
    );

    // Extend the ordered path history with newly visited cells.
    for (const step of result.path) {
      pathOrderRef.current.push({ row: step.row, col: step.col });
    }

    const fullPath = [...pathPrefix, ...result.path];
    turnIndexRef.current++;
    const turnIndex = turnIndexRef.current;
    onMovePath(fullPath.map(s => ({ row: s.row, col: s.col })), newCard, turnIndex);

    if (result.pausedAtEncounter) {
      const lastStep = result.path[result.path.length - 1];
      setPendingEncounter({
        card: newCard,
        turnIndex,
        pathSoFar: fullPath,
        eventsSoFar: result.events,
        currentRow: lastStep.row,
        currentCol: lastStep.col,
        remainingSteps: result.remainingSteps,
        visitedCells: globalVisitedRef.current,
        collectedCells: collectedCellsRef.current,
      });
    } else {
      const record: TurnRecord = {
        card: newCard,
        stepsAllowed: moveCount,
        path: fullPath,
        events: result.events,
      };
      setTurnHistory(prev => [record, ...prev]);
    }
  };

  // -------------------------------------------------------------------------
  // Encounter resolution
  // -------------------------------------------------------------------------

  const resolveEncounter = (won: boolean) => {
    if (!pendingEncounter) return;
    const pe = pendingEncounter;

    const outcomeEvent: TurnEvent = won
      ? { type: 'encounter_won', message: 'Encounter won — continuing movement.' }
      : { type: 'encounter_lost', message: 'Encounter lost — movement ends.' };

    if (!won || pe.remainingSteps === 0) {
      // Turn ends — encounter cell is already in pathOrderRef from when it was entered.
      const record: TurnRecord = {
        card: pe.card,
        stepsAllowed: getCardMoveCount(pe.card.value) ?? 0,
        path: pe.pathSoFar,
        events: [...pe.eventsSoFar, outcomeEvent],
      };
      setTurnHistory(prev => [record, ...prev]);
      setPendingEncounter(null);
      return;
    }

    // Won — resume movement from encounter cell
    const result = simulateMovement(
      board,
      pe.currentRow,
      pe.currentCol,
      pe.remainingSteps,
      pe.visitedCells,
      pe.collectedCells
    );

    // Extend path history with cells visited while continuing after the encounter.
    for (const step of result.path) {
      pathOrderRef.current.push({ row: step.row, col: step.col });
    }

    const extendedPath = [...pe.pathSoFar, ...result.path];
    onMovePath(result.path.map(s => ({ row: s.row, col: s.col })), pe.card, pe.turnIndex);

    if (result.pausedAtEncounter) {
      const lastStep = result.path[result.path.length - 1];
      setPendingEncounter({
        ...pe,
        pathSoFar: extendedPath,
        eventsSoFar: [...pe.eventsSoFar, outcomeEvent, ...result.events],
        currentRow: lastStep.row,
        currentCol: lastStep.col,
        remainingSteps: result.remainingSteps,
      });
    } else {
      const record: TurnRecord = {
        card: pe.card,
        stepsAllowed: getCardMoveCount(pe.card.value) ?? 0,
        path: extendedPath,
        events: [...pe.eventsSoFar, outcomeEvent, ...result.events],
      };
      setTurnHistory(prev => [record, ...prev]);
      setPendingEncounter(null);
    }
  };

  // -------------------------------------------------------------------------
  // Reset
  // -------------------------------------------------------------------------

  const handleResetDeck = () => {
    setDrawnCards([]);
    setTurnHistory([]);
    setPendingEncounter(null);
    collectedCellsRef.current = new Set();
    globalVisitedRef.current = new Set();
    pathOrderRef.current = [];
    turnIndexRef.current = -1;
    initializeDeck();
    onResetDeck();
  };

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  const getCardColor = (suit: string) =>
    suit === 'hearts' || suit === 'diamonds' ? 'text-red-600' : 'text-gray-900';

  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      default: return '';
    }
  };

  const eventColor = (type: TurnEvent['type']) => {
    switch (type) {
      case 'face_card_encounter': return 'text-red-700 font-semibold';
      case 'encounter_found':     return 'text-orange-600 font-semibold';
      case 'encounter_won':       return 'text-green-600';
      case 'encounter_lost':      return 'text-red-600';
      case 'item_collected':      return 'text-blue-600';
      case 'dead_end':            return 'text-gray-500 italic';
      case 'completed':           return 'text-gray-500 italic';
      default:                    return 'text-gray-700';
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-4">

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="text-sm">Decks:</span>
          <div className="flex border rounded overflow-hidden">
            <button
              onClick={() => handleDeckCountChange(deckCount - 1)}
              disabled={deckCount <= 1}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-sm"
            >-</button>
            <span className="px-3 py-1 text-sm">{deckCount}</span>
            <button
              onClick={() => handleDeckCountChange(deckCount + 1)}
              disabled={deckCount >= 3}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-sm"
            >+</button>
          </div>
        </div>

        <button
          onClick={drawCard}
          disabled={deck.length === 0 || !!pendingEncounter}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded text-sm disabled:opacity-40"
        >
          Draw Card ({deck.length})
        </button>

        <button
          onClick={handleResetDeck}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded text-sm"
        >
          Reset
        </button>
      </div>

      {/* Encounter resolution prompt */}
      {pendingEncounter && (
        <div className="border-2 border-orange-500 rounded p-3 bg-orange-50">
          <p className="font-semibold text-orange-800 mb-2">
            ⚔ Encounter! Resolve it, then record the outcome:
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => resolveEncounter(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded text-sm"
            >
              Won — keep moving ({pendingEncounter.remainingSteps} step{pendingEncounter.remainingSteps !== 1 ? 's' : ''} left)
            </button>
            <button
              onClick={() => resolveEncounter(false)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded text-sm"
            >
              Lost — end turn
            </button>
          </div>
        </div>
      )}

      {/* Recently drawn cards */}
      {drawnCards.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {[...drawnCards].reverse().slice(0, 13).map((card, index) => (
            <div
              key={index}
              className={`w-10 h-14 border rounded flex items-center justify-center text-xs ${getCardColor(card.suit)}`}
            >
              <div className="text-center leading-tight">
                <div className="font-bold">{card.value}</div>
                <div>{getSuitSymbol(card.suit)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Turn history */}
      {turnHistory.length > 0 && (
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {turnHistory.map((turn, i) => (
            <div key={i} className="border rounded p-2 text-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className={`font-bold ${getCardColor(turn.card.suit)}`}>
                  {turn.card.value}{getSuitSymbol(turn.card.suit)}
                </span>
                {turn.stepsAllowed > 0 && (
                  <span className="text-gray-500 text-xs">
                    {turn.path.length} / {turn.stepsAllowed} space{turn.stepsAllowed !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <ul className="space-y-0.5">
                {turn.events.map((ev, j) => (
                  <li key={j} className={`text-xs ${eventColor(ev.type)}`}>{ev.message}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CardDrawSimulator;