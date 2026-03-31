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

// ---------------------------------------------------------------------------
// Class Skill State types
// ---------------------------------------------------------------------------

// --- Alchemist ---
export interface PotionRackState {
  rowsFilled: [number, number, number]; // Low/Mid/High rows, each 0–3
}
export interface TransmutationLadderState {
  steps: (number | null)[]; // length 5; null = empty, number = placed card value
}
export interface VolatileFlaskState {
  storedValue: number | null;
}

// --- Bard ---
export interface SongbookState {
  ballad: number;
  chorus: number;
}
export interface CrescendoState {
  columns: [number[], number[], number[]]; // A/B/C, up to 4 values each
  locked: [boolean, boolean, boolean];
}
export interface AudienceMeterState {
  audience: number; // 0–10
}

// --- Druid ---
export interface SacredGroveState {
  zonesFilled: [number, number, number]; // Forest/Water/Stone, each 0–4
}
export interface BeastFormsState {
  wolf: boolean;
  bear: boolean;
  hawk: boolean;
}
export interface SeasonWheelState {
  segmentsFilled: number; // 0–4; reaching 4 = cash-out + reset
}

// --- Knight ---
export interface ArmsAndOathRowsState {
  honorRow: (number | null)[]; // length 5, ascending constraint
  mightRow: (number | null)[]; // length 5, descending constraint
}
export type OathType = 'Defend' | 'Slay' | 'Guard' | 'Conquer';
export interface OathBoardState {
  activeOath: OathType | null;
  oathTrackSteps: number; // 0–4
}
export interface FortressState {
  tier1: number | null;
  tier2: number | null;
  tier3: number | null;
}

// --- Necromancer ---
export interface GraveLedgerState {
  skeleton: number; // 0–4 steps advanced
  ghost: number;
  wraith: number;
}
export interface CryptCapacityState {
  controlLevel: number; // 1–5
  doubleUsedThisRound: boolean;
}
export interface SoulRingsState {
  ring1: boolean[]; // length 6, positions 1–6
  ring2: boolean[];
}

// --- Ranger ---
export interface TrailMapState {
  currentNode: number; // -1 = not started, 0–6 = node index
}
export interface QuarryBoardState {
  beastCount: number;      // 0–3 low values placed
  raiderCount: number;     // 0–3 mid values placed
  spiritValues: number[];  // up to 3 values; complete when sum >= 15
}
export interface SurvivalKitState {
  rations: boolean;
  arrows: boolean;
  torch: boolean;
  rope: boolean;
}

// Aggregate skill state — flat object, one field per skill (18 total)
export interface ClassSkillState {
  potionRack: PotionRackState;
  transmutationLadder: TransmutationLadderState;
  volatileFlask: VolatileFlaskState;
  songbook: SongbookState;
  crescendo: CrescendoState;
  audienceMeter: AudienceMeterState;
  sacredGrove: SacredGroveState;
  beastForms: BeastFormsState;
  seasonWheel: SeasonWheelState;
  armsAndOathRows: ArmsAndOathRowsState;
  oathBoard: OathBoardState;
  fortress: FortressState;
  graveLedger: GraveLedgerState;
  cryptCapacity: CryptCapacityState;
  soulRings: SoulRingsState;
  trailMap: TrailMapState;
  quarryBoard: QuarryBoardState;
  survivalKit: SurvivalKitState;
}

export const DEFAULT_SKILL_STATE: ClassSkillState = {
  potionRack: { rowsFilled: [0, 0, 0] },
  transmutationLadder: { steps: [null, null, null, null, null] },
  volatileFlask: { storedValue: null },
  songbook: { ballad: 0, chorus: 0 },
  crescendo: { columns: [[], [], []], locked: [false, false, false] },
  audienceMeter: { audience: 0 },
  sacredGrove: { zonesFilled: [0, 0, 0] },
  beastForms: { wolf: false, bear: false, hawk: false },
  seasonWheel: { segmentsFilled: 0 },
  armsAndOathRows: {
    honorRow: [null, null, null, null, null],
    mightRow: [null, null, null, null, null],
  },
  oathBoard: { activeOath: null, oathTrackSteps: 0 },
  fortress: { tier1: null, tier2: null, tier3: null },
  graveLedger: { skeleton: 0, ghost: 0, wraith: 0 },
  cryptCapacity: { controlLevel: 1, doubleUsedThisRound: false },
  soulRings: {
    ring1: [false, false, false, false, false, false],
    ring2: [false, false, false, false, false, false],
  },
  trailMap: { currentNode: -1 },
  quarryBoard: { beastCount: 0, raiderCount: 0, spiritValues: [] },
  survivalKit: { rations: false, arrows: false, torch: false, rope: false },
};

export interface CharacterState {
  name: string;
  body: BodyLocation[];
  attributes: CharacterAttributes;
  resources: CharacterResources;
  energies: ColorEnergies;
  scoring: Record<ScoringCategory, number>;
  classes: ClassProgress[];
  wounds: number;    // global wound counter (0-10), shown as hearts
  skillStates: ClassSkillState;
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
  skillStates: DEFAULT_SKILL_STATE,
};

// ---------------------------------------------------------------------------
// Shared deck + dungeon session types
// ---------------------------------------------------------------------------

export interface SharedDeckState {
  deck: CardDraw[];
  drawnCards: CardDraw[];   // history of all played cards
  discardPile: CardDraw[];  // cards burned from hand at end of turn
  hand: CardDraw[];         // cards currently held by the player
  handSize: number;         // max cards that can be held (default 2)
  playsPerTurn: number;     // how many cards can be played per turn (default 1)
  playsRemaining: number;   // plays left this turn
  deckCount: number;
}

export const DEFAULT_SHARED_DECK: SharedDeckState = {
  deck: [],        // populated at runtime via createStandardDeck() + shuffleDeck()
  drawnCards: [],
  discardPile: [],
  hand: [],
  handSize: 2,
  playsPerTurn: 1,
  playsRemaining: 1,
  deckCount: 1,
};

/** Serialisable snapshot of per-session dungeon traversal state.
 *  Stored in localStorage so navigating away and back preserves progress. */
export interface DungeonSessionState {
  turnHistory: TurnRecord[];
  globalVisited: string[];          // Set<"row,col"> serialised as array
  collectedCells: string[];
  pathOrder: { row: number; col: number }[];
  turnIndex: number;
}

export const DEFAULT_DUNGEON_SESSION: DungeonSessionState = {
  turnHistory: [],
  globalVisited: [],
  collectedCells: [],
  pathOrder: [],
  turnIndex: -1,
};

// ---------------------------------------------------------------------------
// City Board types
// ---------------------------------------------------------------------------

export interface CityBuildingState {
  rank: CardValue | 'wild';
  visits: number;
  visitCap: number;         // 0 = no cap (Graveyard)
  depositLevel?: 0 | 1 | 2; // Bank only: 0=none, 1=small (5g/round), 2=large (10g/round)
  scryTokens?: number;      // Scholar's Archive only
  soulsGained?: number;     // Graveyard only — total souls ever accumulated (for milestones)
  soulsAvailable?: number;  // Graveyard only — current spendable pool
}

export interface CityBoardState {
  buildings: CityBuildingState[];   // 14 entries (13 rank-based + Graveyard)
  globalDepositCount: number;       // shared across all players; default cap is 3
}

export const DEFAULT_CITY_BOARD: CityBoardState = {
  globalDepositCount: 0,
  buildings: [
    { rank: '2', visits: 0, visitCap: 4 },              // Stables
    { rank: '3', visits: 0, visitCap: 4 },              // Tavern
    { rank: '4', visits: 0, visitCap: 5 },              // Market Square
    { rank: '5', visits: 0, visitCap: 6 },              // Herbalist
    { rank: '6', visits: 0, visitCap: 4 },              // Blacksmith
    { rank: '7', visits: 0, visitCap: 5 },              // Mage's Workshop
    { rank: '8', visits: 0, visitCap: 4 },              // Guild Hall
    { rank: '9', visits: 0, visitCap: 4 },              // Scholar's Archive
    { rank: '10', visits: 0, visitCap: 6, depositLevel: 0 }, // The Bank
    { rank: 'J', visits: 0, visitCap: 4 },              // Thieves' Guild
    { rank: 'Q', visits: 0, visitCap: 4 },              // Temple of the Fading Light
    { rank: 'K', visits: 0, visitCap: 4 },              // Royal Keep
    { rank: 'A', visits: 0, visitCap: 5, scryTokens: 0 }, // Arcane Academy (scryTokens from Archive)
    { rank: 'wild', visits: 0, visitCap: 0, soulsGained: 0, soulsAvailable: 0 }, // Graveyard
  ],
};