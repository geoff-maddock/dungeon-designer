export enum CellType {
  Empty = 'empty',
  Wall = 'wall',
  Entrance = 'entrance',
  Key = 'key',
  Supplies = 'supplies',
  Mana = 'mana',
  Encounter = 'encounter',
  Treasure = 'treasure',
  Relic = 'relic',
  Lock = 'lock',
  Goal = 'goal',
  Energy = 'energy',
  Trap = 'trap',
  LostSoul = 'lostsoul'
}

export enum ColorRequirement {
  None = 'none',
  Red = 'red',
  Orange = 'orange',
  Yellow = 'yellow',
  Green = 'green',
  Blue = 'blue',
  Purple = 'purple'
}

// Add to src/types.ts
export interface PlacedShape {
  shape: number[][];
  startRow: number;
  startCol: number;
  cardValue: CardValue;
  cardSuit: string;
}

export interface Cell {
  type: CellType;
  colorRequirement: ColorRequirement;
  walls: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };
  traversed?: boolean; // Add this property
}

export type Board = Cell[][];

export interface ActionShape {
  id: number;
  value: number;
  shape: number[][];
  cardValues: string[];
}

export type CardValue =
  | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10'
  | 'J' | 'Q' | 'K' | 'A';

export interface CardDraw {
  value: CardValue;
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  isPlaced: boolean;
}

export interface MazeSettings {
  goalCount: number;
  goalPathLength: number;
  placementStrategy?: 'random' | 'depth-aware' | 'dead-ends';
  coloredItemPercentage?: number;
  difficultyZones?: number;
}

/** A generated encounter card for a single Encounter cell on the board. */
export interface EncounterCard {
  row: number;
  col: number;
  zone: number;        // 0-indexed difficulty zone (0 = easiest)
  monsterName: string;
  strength: string;    // e.g. "2/3/4" — increasing values per difficulty tier
  xp: number;
  gold: number;
}

export interface BoardConfig {
  id: string;
  name: string;
  boardSize: number;
  cellTypeCounts: { [key in CellType]?: number };
  colorRequirementCounts: { [key in ColorRequirement]?: number };
  wallPercentage: number;
  mazeSettings: MazeSettings;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Movement / card-draw simulation types
// ---------------------------------------------------------------------------

/** A single cell visited during a movement turn. */
export interface MovementStep {
  row: number;
  col: number;
  cellType: CellType;
}

export type TurnEventType =
  | 'entrance'
  | 'item_collected'
  | 'encounter_found'
  | 'encounter_won'
  | 'encounter_lost'
  | 'trap_hit'
  | 'trap_evaded'
  | 'goal_reached'
  | 'dead_end'
  | 'completed'
  | 'face_card_encounter';

export interface TurnEvent {
  type: TurnEventType;
  message: string;
  row?: number;
  col?: number;
  /** The numeric value of the card used for this turn (used for trap/encounter resolution). */
  cardNumericValue?: number;
  /** For energy cells, which color energy was gained. */
  colorRequirement?: ColorRequirement;
  /** For encounter events, the XP reward for a win. */
  encounterXp?: number;
  /** For encounter events, the gold reward for a win. */
  encounterGold?: number;
  /** Number of wounds taken (trap or encounter failure). */
  woundsDealt?: number;
}

/** Full record of one card-draw turn. */
export interface TurnRecord {
  card: CardDraw;
  stepsAllowed: number;
  path: MovementStep[];
  events: TurnEvent[];
}

// ---------------------------------------------------------------------------
// Character Board types
// ---------------------------------------------------------------------------

export interface BodyLocation {
  name: 'Head' | 'Torso' | 'Left Arm' | 'Right Arm' | 'Left Leg' | 'Right Leg';
  woundSlots: number;
  hits: number;       // circles filled on this body part (armored or not)
  armorSlots: number; // kept for compat; effective cap is woundSlots
  armor: number;      // how many circles are outlined in blue (armored)
}

export interface CharacterAttributes {
  brawn: number;
  agility: number;
  mind: number;
  spirit: number;
}

export interface CharacterResources {
  xp: number;
  gold: number;
  supplies: number;
  mana: number;
}

export interface ColorEnergies {
  red: number;
  orange: number;
  yellow: number;
  green: number;
  blue: number;
  purple: number;
}

export type ScoringCategory = 'discovery' | 'champion' | 'arcana' | 'fortune';

export type CharacterClass =
  | 'Alchemist'
  | 'Bard'
  | 'Druid'
  | 'Knight'
  | 'Necromancer'
  | 'Ranger';

export interface ClassProgress {
  className: CharacterClass;
  level: number; // 0–9
}

export interface CharacterState {
  name: string;
  body: BodyLocation[];
  attributes: CharacterAttributes;
  resources: CharacterResources;
  energies: ColorEnergies;
  scoring: Record<ScoringCategory, number>;
  classes: ClassProgress[];
  wounds: number;    // global wound counter (0-10), shown as hearts
}

export const DEFAULT_CHARACTER: CharacterState = {
  name: 'Hero',
  body: [
    { name: 'Head', woundSlots: 2, hits: 0, armorSlots: 2, armor: 0 },
    { name: 'Torso', woundSlots: 4, hits: 0, armorSlots: 4, armor: 0 },
    { name: 'Left Arm', woundSlots: 2, hits: 0, armorSlots: 2, armor: 0 },
    { name: 'Right Arm', woundSlots: 2, hits: 0, armorSlots: 2, armor: 0 },
    { name: 'Left Leg', woundSlots: 2, hits: 0, armorSlots: 2, armor: 0 },
    { name: 'Right Leg', woundSlots: 2, hits: 0, armorSlots: 2, armor: 0 },
  ],
  attributes: { brawn: 3, agility: 3, mind: 3, spirit: 3 },
  resources: { xp: 0, gold: 0, supplies: 0, mana: 0 },
  energies: { red: 0, orange: 0, yellow: 0, green: 0, blue: 0, purple: 0 },
  scoring: { discovery: 0, champion: 0, arcana: 0, fortune: 0 },
  wounds: 0,
  classes: [
    { className: 'Alchemist', level: 0 },
    { className: 'Bard', level: 0 },
    { className: 'Druid', level: 0 },
    { className: 'Knight', level: 0 },
    { className: 'Necromancer', level: 0 },
    { className: 'Ranger', level: 0 },
  ],
};