import React, { useState, useEffect, useRef } from 'react';
import { CardDraw, Board, TurnRecord, TurnEvent, MovementStep, CharacterState, EncounterCard, CellType, ColorRequirement, DungeonSessionState, DEFAULT_DUNGEON_SESSION } from '../types';
import {
  getCardMoveCount,
  findEntrance,
  getValidNeighbors,
  simulateMovement,
} from '../utils/gameLogic';
import DeckPanel from './DeckPanel';

interface CardDrawSimulatorProps {
  // Shared deck (managed in App.tsx)
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
  // Dungeon session persistence
  session: DungeonSessionState;
  onSessionChange: (s: DungeonSessionState) => void;
  // Board-specific
  board: Board;
  character: CharacterState;
  encounterCards: EncounterCard[];
  onCharacterChange: (updated: CharacterState) => void;
  /** Called with each cell in the movement path so the parent can render overlays. */
  onMovePath: (path: { row: number; col: number }[], card: CardDraw, turnIndex: number) => void;
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
  /** The encounter card data for the current encounter cell, if found. */
  encounterCard: EncounterCard | null;
  /** Numeric value of the card used for this turn. */
  cardNumericValue: number;
}

/** State held while waiting for the player to resolve a trap mid-turn. */
interface PendingTrap {
  card: CardDraw;
  turnIndex: number;
  pathSoFar: MovementStep[];
  eventsSoFar: TurnEvent[];
  currentRow: number;
  currentCol: number;
  remainingSteps: number;
  visitedCells: Set<string>;
  collectedCells: Set<string>;
  cardNumericValue: number;
}

const CardDrawSimulator: React.FC<CardDrawSimulatorProps> = ({
  deck,
  drawnCards,
  discardPile,
  deckCount,
  hand,
  handSize,
  playsPerTurn,
  playsRemaining,
  selectedHandIndex,
  onDrawToHand,
  onSelectHandCard,
  onPlayCard,
  onEndTurn,
  onHandSizeChange,
  onPlaysPerTurnChange,
  onDeckCountChange,
  onResetDeck,
  session,
  onSessionChange,
  board,
  character,
  encounterCards,
  onCharacterChange,
  onMovePath,
}) => {
  const [turnHistory, setTurnHistory] = useState<TurnRecord[]>(() => session.turnHistory);
  const [pendingEncounter, setPendingEncounter] = useState<PendingEncounter | null>(null);
  const [pendingTrap, setPendingTrap] = useState<PendingTrap | null>(null);

  /**
   * Items and encounters collected across all turns this session.
   * Stored in a ref so it can be mutated inside simulateMovement without
   * triggering re-renders.
   */
  const collectedCellsRef = useRef<Set<string>>(new Set(session.collectedCells));
  /** All cells visited across every turn — prevents any cross-turn backtracking. */
  const globalVisitedRef = useRef<Set<string>>(new Set(session.globalVisited));
  /**
   * All visited cells in visit order across all turns. Used by findResumePosition
   * to locate the most-recently-visited cell that still has open neighbours,
   * so a dead end on one draw never permanently blocks future draws.
   */
  const pathOrderRef = useRef<{ row: number; col: number }[]>(session.pathOrder ?? []);
  /** Incremented once per rank-card draw to give each turn a unique index. */
  const turnIndexRef = useRef<number>(session.turnIndex ?? -1);

  // Persist session whenever turnHistory changes
  useEffect(() => {
    onSessionChange({
      turnHistory,
      globalVisited: [...globalVisitedRef.current],
      collectedCells: [...collectedCellsRef.current],
      pathOrder: pathOrderRef.current,
      turnIndex: turnIndexRef.current,
    });
  }, [turnHistory]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const playToBoard = (newCard: CardDraw) => {
    if (pendingEncounter) return;
    if (pendingTrap) return;

    const moveCount = getCardMoveCount(newCard.value);

    if (moveCount === null) {
      // Face card — automatic encounter, no movement.
      // Peek at top deck card for the combat roll (does not consume it).
      turnIndexRef.current++;
      const turnIndex = turnIndexRef.current;
      const randomEncounter = encounterCards.length > 0
        ? encounterCards[Math.floor(Math.random() * encounterCards.length)]
        : null;

      const combatCard = deck.length > 0 ? deck[0] : null;
      const combatNumericValue = combatCard ? getCardNumericValueHelper(combatCard.value) : 0;

      setPendingEncounter({
        card: newCard,
        turnIndex,
        pathSoFar: [],
        eventsSoFar: [{
          type: 'face_card_encounter',
          message: `Drew ${newCard.value} of ${newCard.suit} — Automatic encounter!${randomEncounter ? ` Facing ${randomEncounter.monsterName}.` : ''
            }${combatCard ? ` Combat card: ${combatCard.value} of ${combatCard.suit} (${combatNumericValue}).` : ''}`,
        }],
        currentRow: -1,
        currentCol: -1,
        remainingSteps: 0,
        visitedCells: globalVisitedRef.current,
        collectedCells: collectedCellsRef.current,
        encounterCard: randomEncounter,
        cardNumericValue: combatNumericValue,
      });
      return;
    }

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
      stepsToMove = moveCount - 1;
    } else {
      const resumePos = findResumePosition();
      if (!resumePos) {
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

    const cardNumericValue = getCardNumericValueHelper(newCard.value);
    const result = simulateMovement(
      board, startRow, startCol, stepsToMove,
      globalVisitedRef.current, collectedCellsRef.current, cardNumericValue
    );

    for (const step of result.path) {
      pathOrderRef.current.push({ row: step.row, col: step.col });
    }

    const fullPath = [...pathPrefix, ...result.path];
    turnIndexRef.current++;
    const turnIndex = turnIndexRef.current;
    onMovePath(fullPath.map(s => ({ row: s.row, col: s.col })), newCard, turnIndex);
    applyEventCharacterChanges(result.events);

    if (result.pausedAtEncounter) {
      const lastStep = result.path[result.path.length - 1];
      const ec = encounterCards.find(c => c.row === lastStep.row && c.col === lastStep.col) ?? null;
      setPendingEncounter({
        card: newCard, turnIndex, pathSoFar: fullPath, eventsSoFar: result.events,
        currentRow: lastStep.row, currentCol: lastStep.col,
        remainingSteps: result.remainingSteps,
        visitedCells: globalVisitedRef.current, collectedCells: collectedCellsRef.current,
        encounterCard: ec, cardNumericValue,
      });
    } else if (result.pausedAtTrap) {
      const lastStep = result.path[result.path.length - 1];
      setPendingTrap({
        card: newCard, turnIndex, pathSoFar: fullPath, eventsSoFar: result.events,
        currentRow: lastStep.row, currentCol: lastStep.col,
        remainingSteps: result.remainingSteps,
        visitedCells: globalVisitedRef.current, collectedCells: collectedCellsRef.current,
        cardNumericValue,
      });
    } else {
      setTurnHistory(prev => [{
        card: newCard, stepsAllowed: moveCount, path: fullPath, events: result.events,
      }, ...prev]);
    }
  };

  // -------------------------------------------------------------------------
  // Character update helpers
  // -------------------------------------------------------------------------

  /** Returns the numeric value of a card (A=1, 2-10 face value, J/Q/K=0). */
  const getCardNumericValueHelper = (value: string): number => {
    if (value === 'A') return 1;
    if (value === 'J' || value === 'Q' || value === 'K') return 0;
    return parseInt(value, 10);
  };

  /**
   * Apply immediate character stat changes from a list of events.
   * Handles item_collected (resources/energies) and goal_reached.
   */
  const applyEventCharacterChanges = (events: TurnEvent[]) => {
    let updated = { ...character };
    let changed = false;

    for (const ev of events) {
      if (ev.type === 'item_collected') {
        // Determine what the cell gives the player based on cell type (from message)
        // The message includes the cellType string
        if (ev.message.includes(CellType.Treasure)) {
          updated = { ...updated, resources: { ...updated.resources, gold: updated.resources.gold + 1 } };
          changed = true;
        } else if (ev.message.includes(CellType.Mana)) {
          updated = { ...updated, resources: { ...updated.resources, mana: updated.resources.mana + 1 } };
          changed = true;
        } else if (ev.message.includes(CellType.Supplies)) {
          updated = { ...updated, resources: { ...updated.resources, supplies: updated.resources.supplies + 1 } };
          changed = true;
        } else if (ev.message.includes(CellType.Energy)) {
          // Identify the color from colorRequirement
          const color = ev.colorRequirement;
          if (color && color !== ColorRequirement.None && color in updated.energies) {
            updated = {
              ...updated,
              energies: {
                ...updated.energies,
                [color]: updated.energies[color as keyof typeof updated.energies] + 1,
              },
            };
            changed = true;
          }
        }
      } else if (ev.type === 'goal_reached') {
        updated = {
          ...updated,
          resources: { ...updated.resources, xp: updated.resources.xp + 5 },
          scoring: { ...updated.scoring, discovery: updated.scoring.discovery + 5 },
        };
        changed = true;
      }
    }

    if (changed) onCharacterChange(updated);
  };

  /** Apply a wound to the character (distributes across body locations). */
  const applyWounds = (char: CharacterState, count: number): CharacterState => {
    let updated = { ...char, body: char.body.map(loc => ({ ...loc, hits: loc.hits ?? 0 })) };
    for (let i = 0; i < count; i++) {
      // Find the first body location with an available hit slot (Torso first, then others)
      const torso = updated.body.find(loc => loc.name === 'Torso' && loc.hits < loc.woundSlots);
      const target = torso ?? updated.body.find(loc => loc.hits < loc.woundSlots);
      if (target) {
        updated = {
          ...updated,
          body: updated.body.map(loc =>
            loc.name === target.name ? { ...loc, hits: loc.hits + 1 } : loc
          ),
        };
      }
    }
    // Recompute global wound count from body state
    const newWounds = Math.min(10, updated.body.reduce(
      (sum, loc) => sum + Math.max(0, loc.hits - loc.armor), 0
    ));
    return { ...updated, wounds: newWounds };
  };

  // -------------------------------------------------------------------------
  // Trap resolution (auto-resolved based on card vs agility)
  // -------------------------------------------------------------------------

  const resolveTrap = () => {
    if (!pendingTrap) return;
    const pt = pendingTrap;
    const agility = character.attributes.agility;
    const trapTriggered = pt.cardNumericValue > agility;

    let outcomeEvent: TurnEvent;
    if (trapTriggered) {
      outcomeEvent = {
        type: 'trap_hit',
        message: `Trap triggered! Card ${pt.cardNumericValue} > Agility ${agility} — took 1 wound. Movement ends.`,
        row: pt.currentRow,
        col: pt.currentCol,
        woundsDealt: 1,
      };
      // Apply 1 wound
      onCharacterChange(applyWounds(character, 1));
      // Turn ends
      const record: TurnRecord = {
        card: pt.card,
        stepsAllowed: getCardMoveCount(pt.card.value) ?? 0,
        path: pt.pathSoFar,
        events: [...pt.eventsSoFar, outcomeEvent],
      };
      setTurnHistory(prev => [record, ...prev]);
      setPendingTrap(null);
    } else {
      outcomeEvent = {
        type: 'trap_evaded',
        message: `Trap evaded! Card ${pt.cardNumericValue} ≤ Agility ${agility} — continuing movement.`,
        row: pt.currentRow,
        col: pt.currentCol,
      };

      if (pt.remainingSteps === 0) {
        const record: TurnRecord = {
          card: pt.card,
          stepsAllowed: getCardMoveCount(pt.card.value) ?? 0,
          path: pt.pathSoFar,
          events: [...pt.eventsSoFar, outcomeEvent],
        };
        setTurnHistory(prev => [record, ...prev]);
        setPendingTrap(null);
        return;
      }

      // Resume movement
      const result = simulateMovement(
        board,
        pt.currentRow,
        pt.currentCol,
        pt.remainingSteps,
        pt.visitedCells,
        pt.collectedCells,
        pt.cardNumericValue
      );
      for (const step of result.path) {
        pathOrderRef.current.push({ row: step.row, col: step.col });
      }
      applyEventCharacterChanges(result.events);
      const extendedPath = [...pt.pathSoFar, ...result.path];
      onMovePath(result.path.map(s => ({ row: s.row, col: s.col })), pt.card, pt.turnIndex);

      if (result.pausedAtEncounter) {
        const lastStep = result.path[result.path.length - 1];
        const ec = encounterCards.find(c => c.row === lastStep.row && c.col === lastStep.col) ?? null;
        setPendingTrap(null);
        setPendingEncounter({
          card: pt.card,
          turnIndex: pt.turnIndex,
          pathSoFar: extendedPath,
          eventsSoFar: [...pt.eventsSoFar, outcomeEvent, ...result.events],
          currentRow: lastStep.row,
          currentCol: lastStep.col,
          remainingSteps: result.remainingSteps,
          visitedCells: pt.visitedCells,
          collectedCells: pt.collectedCells,
          encounterCard: ec,
          cardNumericValue: pt.cardNumericValue,
        });
      } else if (result.pausedAtTrap) {
        const lastStep = result.path[result.path.length - 1];
        setPendingTrap({
          ...pt,
          pathSoFar: extendedPath,
          eventsSoFar: [...pt.eventsSoFar, outcomeEvent, ...result.events],
          currentRow: lastStep.row,
          currentCol: lastStep.col,
          remainingSteps: result.remainingSteps,
        });
      } else {
        const record: TurnRecord = {
          card: pt.card,
          stepsAllowed: getCardMoveCount(pt.card.value) ?? 0,
          path: extendedPath,
          events: [...pt.eventsSoFar, outcomeEvent, ...result.events],
        };
        setTurnHistory(prev => [record, ...prev]);
        setPendingTrap(null);
      }
    }
  };

  // -------------------------------------------------------------------------
  // Encounter resolution
  // -------------------------------------------------------------------------

  /**
   * Resolve a pending encounter automatically.
   * Wounds dealt = number of STR values that exceed the attack roll.
   * Win = zero wounds dealt;
   * Loss = one or more wounds.
   */
  const resolveEncounter = () => {
    if (!pendingEncounter) return;
    const pe = pendingEncounter;

    let xpGain = 0;
    let goldGain = 0;
    let woundsDealt = 0;
    let won = false;
    let outcomeMessage = '';

    if (pe.encounterCard) {
      const ec = pe.encounterCard;
      const strengthValues = ec.strength.split('/').map(Number);
      const attackRoll = pe.cardNumericValue + character.attributes.brawn;
      woundsDealt = strengthValues.filter(s => s > attackRoll).length;
      won = woundsDealt === 0;

      if (won) {
        xpGain = ec.xp;
        goldGain = ec.gold;
        outcomeMessage = `Encounter won! Attack ${attackRoll} (card ${pe.cardNumericValue} + Brawn ${character.attributes.brawn}) vs STR ${ec.strength}. +${xpGain} XP, +${goldGain} Gold, +1 Champion point.`;
      } else {
        xpGain = Math.floor(ec.xp / 2);
        outcomeMessage = `Encounter lost! Attack ${attackRoll} (card ${pe.cardNumericValue} + Brawn ${character.attributes.brawn}) failed vs STR ${ec.strength}. Took ${woundsDealt} wound${woundsDealt > 1 ? 's' : ''}. +${xpGain} XP.`;
      }
    } else {
      // No encounter card data — treat as a win with no rewards.
      won = true;
      outcomeMessage = 'Encounter resolved — continuing movement.';
    }

    const outcomeEvent: TurnEvent = {
      type: won ? 'encounter_won' : 'encounter_lost',
      message: outcomeMessage,
      woundsDealt: woundsDealt > 0 ? woundsDealt : undefined,
      encounterXp: xpGain > 0 ? xpGain : undefined,
      encounterGold: goldGain > 0 ? goldGain : undefined,
    };

    // Apply character stat changes
    let updatedChar = character;
    if (woundsDealt > 0) updatedChar = applyWounds(updatedChar, woundsDealt);
    if (xpGain > 0) updatedChar = { ...updatedChar, resources: { ...updatedChar.resources, xp: updatedChar.resources.xp + xpGain } };
    if (goldGain > 0) updatedChar = { ...updatedChar, resources: { ...updatedChar.resources, gold: updatedChar.resources.gold + goldGain } };
    if (won && pe.encounterCard) {
      updatedChar = { ...updatedChar, scoring: { ...updatedChar.scoring, champion: updatedChar.scoring.champion + 1 } };
    }
    if (updatedChar !== character) onCharacterChange(updatedChar);

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
      pe.collectedCells,
      pe.cardNumericValue
    );

    // Extend path history with cells visited while continuing after the encounter.
    for (const step of result.path) {
      pathOrderRef.current.push({ row: step.row, col: step.col });
    }

    applyEventCharacterChanges(result.events);
    const extendedPath = [...pe.pathSoFar, ...result.path];
    onMovePath(result.path.map(s => ({ row: s.row, col: s.col })), pe.card, pe.turnIndex);

    if (result.pausedAtEncounter) {
      const lastStep = result.path[result.path.length - 1];
      const ec = encounterCards.find(c => c.row === lastStep.row && c.col === lastStep.col) ?? null;
      setPendingEncounter({
        ...pe,
        pathSoFar: extendedPath,
        eventsSoFar: [...pe.eventsSoFar, outcomeEvent, ...result.events],
        currentRow: lastStep.row,
        currentCol: lastStep.col,
        remainingSteps: result.remainingSteps,
        encounterCard: ec,
      });
    } else if (result.pausedAtTrap) {
      const lastStep = result.path[result.path.length - 1];
      setPendingEncounter(null);
      setPendingTrap({
        card: pe.card,
        turnIndex: pe.turnIndex,
        pathSoFar: extendedPath,
        eventsSoFar: [...pe.eventsSoFar, outcomeEvent, ...result.events],
        currentRow: lastStep.row,
        currentCol: lastStep.col,
        remainingSteps: result.remainingSteps,
        visitedCells: pe.visitedCells,
        collectedCells: pe.collectedCells,
        cardNumericValue: pe.cardNumericValue,
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
    setTurnHistory([]);
    setPendingEncounter(null);
    setPendingTrap(null);
    collectedCellsRef.current = new Set();
    globalVisitedRef.current = new Set();
    pathOrderRef.current = [];
    turnIndexRef.current = -1;
    onSessionChange(DEFAULT_DUNGEON_SESSION);
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
      case 'encounter_found': return 'text-orange-600 font-semibold';
      case 'encounter_won': return 'text-green-600 font-semibold';
      case 'encounter_lost': return 'text-red-600 font-semibold';
      case 'trap_hit': return 'text-red-700 font-semibold';
      case 'trap_evaded': return 'text-teal-600';
      case 'goal_reached': return 'text-yellow-600 font-semibold';
      case 'item_collected': return 'text-blue-600';
      case 'dead_end': return 'text-gray-500 italic';
      case 'completed': return 'text-gray-500 italic';
      default: return 'text-gray-700';
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const encounterPrompt = pendingEncounter && (() => {
    const ec = pendingEncounter.encounterCard;
    const attackRoll = pendingEncounter.cardNumericValue + character.attributes.brawn;
    const strengthValues = ec ? ec.strength.split('/').map(Number) : [];
    const woundsPreview = strengthValues.filter(s => s > attackRoll).length;
    const willWin = !ec || woundsPreview === 0;
    return (
      <div className="border-2 border-orange-500 rounded p-3 bg-orange-50">
        <p className="font-semibold text-orange-800 mb-1">⚔ Encounter!</p>
        {ec && (
          <div className="text-sm text-orange-700 mb-2 space-y-0.5">
            <div><span className="font-medium">{ec.monsterName}</span> — STR: {ec.strength}</div>
            <div>Combat card: {pendingEncounter.cardNumericValue} + Brawn {character.attributes.brawn} = <span className="font-bold">{attackRoll}</span></div>
            <div>Reward: {ec.xp} XP / {ec.gold} Gold</div>
            <div className={willWin ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
              {willWin
                ? `✓ Victory — attack ${attackRoll} beats all STR values`
                : `✗ Defeat — ${woundsPreview} wound${woundsPreview !== 1 ? 's' : ''} (${woundsPreview} STR value${woundsPreview !== 1 ? 's' : ''} exceed attack ${attackRoll})`
              }
            </div>
          </div>
        )}
        <button
          onClick={resolveEncounter}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-1.5 rounded text-sm"
        >
          Resolve Encounter{pendingEncounter.remainingSteps > 0 && willWin ? ` (${pendingEncounter.remainingSteps} step${pendingEncounter.remainingSteps !== 1 ? 's' : ''} left)` : ''}
        </button>
      </div>
    );
  })();

  return (
    <div className="space-y-4">
      <DeckPanel
        deck={deck}
        drawnCards={drawnCards}
        discardPile={discardPile}
        deckCount={deckCount}
        hand={hand}
        handSize={handSize}
        playsPerTurn={playsPerTurn}
        playsRemaining={playsRemaining}
        selectedHandIndex={selectedHandIndex}
        onDrawToHand={onDrawToHand}
        onSelectHandCard={onSelectHandCard}
        onEndTurn={onEndTurn}
        onHandSizeChange={onHandSizeChange}
        onPlaysPerTurnChange={onPlaysPerTurnChange}
        onDeckCountChange={onDeckCountChange}
        onReset={handleResetDeck}
        disabled={!!pendingEncounter || !!pendingTrap}
      >
        {/* Play to dungeon button */}
        {selectedHandIndex !== null && hand[selectedHandIndex] && !pendingEncounter && !pendingTrap && (
          <button
            onClick={() => {
              const card = hand[selectedHandIndex];
              playToBoard(card);
              onPlayCard(selectedHandIndex);
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded text-sm font-medium"
          >
            Play {hand[selectedHandIndex].value} to Dungeon
          </button>
        )}
        {/* Trap resolution prompt */}
        {pendingTrap && (
          <div className="border-2 border-yellow-600 rounded p-3 bg-yellow-50">
            <p className="font-semibold text-yellow-800 mb-1">
              💣 Trap! Card value: {pendingTrap.cardNumericValue} vs your Agility: {character.attributes.agility}
            </p>
            <p className="text-sm text-yellow-700 mb-2">
              {pendingTrap.cardNumericValue > character.attributes.agility
                ? `Trap triggered — card (${pendingTrap.cardNumericValue}) beats agility (${character.attributes.agility}). You take 1 wound and movement ends.`
                : `Trap evaded — card (${pendingTrap.cardNumericValue}) ≤ agility (${character.attributes.agility}). You may continue.`}
            </p>
            <button
              onClick={resolveTrap}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-1.5 rounded text-sm"
            >
              Resolve Trap
            </button>
          </div>
        )}
        {/* Encounter resolution prompt */}
        {encounterPrompt}
      </DeckPanel>

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