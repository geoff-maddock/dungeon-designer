import {
  CardValue,
  CharacterState,
  ScoringCategory,
  FortressState,
  ArmsAndOathRowsState,
} from '../types';

// ---------------------------------------------------------------------------
// Level gating
// ---------------------------------------------------------------------------

export const SKILL_UNLOCK_LEVELS = [1, 4, 7] as const;
export type SkillSlot = 1 | 2 | 3;

export function isSkillUnlocked(classLevel: number, slot: SkillSlot): boolean {
  return classLevel >= SKILL_UNLOCK_LEVELS[slot - 1];
}

// ---------------------------------------------------------------------------
// Card value helpers
// ---------------------------------------------------------------------------

/** Returns the numeric value for skill mini-game use (2–10), or null for J/Q/K/A. */
export function cardNumericValue(cv: CardValue): number | null {
  if (cv === 'J' || cv === 'Q' || cv === 'K' || cv === 'A') return null;
  return parseInt(cv, 10);
}

export type CardBand = 'low' | 'mid' | 'high';

/** 2–4 = low, 5–7 = mid, 8–10 = high. */
export function cardBand(numericValue: number): CardBand {
  if (numericValue <= 4) return 'low';
  if (numericValue <= 7) return 'mid';
  return 'high';
}

/** Maps card value to a Soul Ring position 1–6: (value % 6) + 1. */
export function soulRingPosition(v: number): number {
  return (v % 6) + 1;
}

// ---------------------------------------------------------------------------
// Reward helpers
// ---------------------------------------------------------------------------

export interface SkillReward {
  supplies?: number;
  mana?: number;
  gold?: number;
  xp?: number;
  scoring?: Partial<Record<ScoringCategory, number>>;
}

/** Immutably merges a reward into the character's resources and scoring. */
export function applyReward(
  character: CharacterState,
  reward: SkillReward
): CharacterState {
  const resources = { ...character.resources };
  if (reward.supplies) resources.supplies = (resources.supplies ?? 0) + reward.supplies;
  if (reward.mana) resources.mana = (resources.mana ?? 0) + reward.mana;
  if (reward.gold) resources.gold = (resources.gold ?? 0) + reward.gold;
  if (reward.xp) resources.xp = (resources.xp ?? 0) + reward.xp;

  const scoring = { ...character.scoring };
  if (reward.scoring) {
    for (const [k, v] of Object.entries(reward.scoring) as [ScoringCategory, number][]) {
      scoring[k] = (scoring[k] ?? 0) + v;
    }
  }

  return { ...character, resources, scoring };
}

// ---------------------------------------------------------------------------
// Skill configs — static data, no state refs
// ---------------------------------------------------------------------------

export interface PotionRowConfig {
  band: CardBand;
  label: string;
  reward: SkillReward;
}

export const POTION_RACK_CONFIG: { rows: PotionRowConfig[] } = {
  rows: [
    { band: 'low', label: 'Minor (2–4)', reward: { supplies: 1 } },
    { band: 'mid', label: 'Greater (5–7)', reward: { mana: 1, gold: 1 } },
    { band: 'high', label: 'Grand (8–10)', reward: { scoring: { arcana: 1 } } },
  ],
};

export interface LadderStepReward {
  ascending: SkillReward;
}

export const TRANSMUTATION_LADDER_CONFIG = {
  stepCount: 5,
  stepReward: { gold: 1 } as SkillReward,         // gain on each ascending placement
  cashOutReward: { gold: 2, scoring: { arcana: 1 } } as SkillReward,
  costToDescend: { mana: 1 } as SkillReward,       // cost if value is lower than previous
};

export const VOLATILE_FLASK_CONFIG = {
  manaReward: (v: number): SkillReward => ({ mana: Math.ceil(v / 2) }),
  arcanaReward: (v: number): SkillReward => ({
    scoring: { arcana: Math.round(v / 3) },
  }),
  idleReward: { scoring: { arcana: 1 } } as SkillReward,
};

export interface SongbookZoneConfig {
  minTotal: number;
  maxTotal: number;
  label: string;
  reward: SkillReward;
  cost?: SkillReward;
}

export const SONGBOOK_CONFIG: SongbookZoneConfig[] = [
  { minTotal: 0, maxTotal: 9, label: 'Weak', reward: { supplies: 1 } },
  { minTotal: 10, maxTotal: 18, label: 'Sweet Spot', reward: { scoring: { champion: 1 } } },
  { minTotal: 19, maxTotal: 999, label: 'Strained', reward: {}, cost: { mana: 1 } },
];

export function songbookZone(total: number): SongbookZoneConfig {
  return SONGBOOK_CONFIG.find(z => total >= z.minTotal && total <= z.maxTotal)
    ?? SONGBOOK_CONFIG[2];
}

export interface CrescendoThreshold {
  maxSum: number;
  reward: SkillReward;
}

export const CRESCENDO_CONFIG = {
  unlockCost: { gold: 1 } as SkillReward,
  thresholds: [
    { maxSum: 10, reward: { scoring: { champion: 1 } } },
    { maxSum: 18, reward: { scoring: { champion: 1 }, supplies: 1 } },
    { maxSum: Infinity, reward: { scoring: { champion: 2 } } },
  ] as CrescendoThreshold[],
};

export function crescendoReward(sum: number): SkillReward {
  return (
    CRESCENDO_CONFIG.thresholds.find(t => sum <= t.maxSum)?.reward ??
    CRESCENDO_CONFIG.thresholds[2].reward
  );
}

export const AUDIENCE_METER_CONFIG = {
  max: 10,
  milestones: [
    { threshold: 5, label: 'Free copy once/round' },
    { threshold: 10, reward: { scoring: { champion: 2 } }, label: 'Acclaim' },
  ],
};

export interface GroveZoneConfig {
  band: CardBand;
  label: string;
  slots: number;
  reward: SkillReward;
}

export const SACRED_GROVE_CONFIG: GroveZoneConfig[] = [
  { band: 'low', label: 'Forest', slots: 4, reward: { supplies: 2 } },
  { band: 'mid', label: 'Water', slots: 4, reward: { mana: 2 } },
  { band: 'high', label: 'Stone', slots: 4, reward: { scoring: { arcana: 1, discovery: 1 } } },
];

export interface BeastFormConfig {
  name: string;
  valueBandMin: number;
  valueBandMax: number;
  resourceCost: SkillReward;
  passiveLabel: string;
}

export const BEAST_FORMS_CONFIG: BeastFormConfig[] = [
  {
    name: 'Wolf',
    valueBandMin: 2,
    valueBandMax: 5,
    resourceCost: { supplies: 1 },
    passiveLabel: '+1 Brawn in combat',
  },
  {
    name: 'Bear',
    valueBandMin: 4,
    valueBandMax: 7,
    resourceCost: { mana: 1 },
    passiveLabel: '+1 armor slot',
  },
  {
    name: 'Hawk',
    valueBandMin: 6,
    valueBandMax: 10,
    resourceCost: { gold: 1 },
    passiveLabel: 'Draw-again trigger',
  },
];

export const SEASON_WHEEL_CONFIG = {
  segments: [
    { name: 'Spring', reward: { supplies: 1 } as SkillReward },
    { name: 'Summer', reward: { mana: 1 } as SkillReward },
    { name: 'Autumn', reward: { gold: 1 } as SkillReward },
    { name: 'Winter', reward: { scoring: { discovery: 1 } } as SkillReward },
  ],
  cycleReward: { scoring: { arcana: 2 } } as SkillReward,
};

export const ARMS_AND_OATH_ROWS_CONFIG = {
  honorStepReward: { scoring: { champion: 1 } } as SkillReward,
  mightStepReward: { supplies: 1 } as SkillReward,
  rowCompleteReward: { scoring: { champion: 2 } } as SkillReward,
  rowLength: 5,
};

export interface OathConfig {
  name: string;
  trigger: string;
  reward: SkillReward;
}

export const OATH_BOARD_CONFIG: OathConfig[] = [
  { name: 'Defend', trigger: 'Collect a Lost Soul', reward: { scoring: { champion: 1, discovery: 1 } } },
  { name: 'Slay', trigger: 'Win an encounter', reward: { scoring: { champion: 1 } } },
  { name: 'Guard', trigger: 'End turn on Entrance', reward: { mana: 1 } },
  { name: 'Conquer', trigger: 'Pick up a Relic', reward: { scoring: { arcana: 1 } } },
];

export const FORTRESS_CONFIG = {
  tier1Range: { min: 5, max: 10 },
  tierCost: { gold: 1 } as SkillReward,
  completeReward: { scoring: { champion: 2, fortune: 2 } } as SkillReward,
};

export const GRAVE_LEDGER_CONFIG = {
  columns: [
    {
      name: 'Skeleton',
      seedBand: 'low' as CardBand,
      stepReward: { mana: 1 } as SkillReward,
      cashOutReward: { mana: 2 } as SkillReward,
    },
    {
      name: 'Ghost',
      seedBand: 'mid' as CardBand,
      stepReward: { scoring: { arcana: 1 } } as SkillReward,
      cashOutReward: { scoring: { arcana: 2 } } as SkillReward,
    },
    {
      name: 'Wraith',
      seedBand: 'high' as CardBand,
      stepReward: { scoring: { arcana: 2 } } as SkillReward,
      cashOutReward: { scoring: { arcana: 3 } } as SkillReward,
    },
  ],
  maxSteps: 4,
};

export const CRYPT_CAPACITY_CONFIG = {
  maxControl: 5,
  doubleRewardLabel: 'Advance All rewards doubled (once/round)',
};

export const SOUL_RINGS_CONFIG = {
  ringSize: 6,
  rewards: [
    // positions 1-3
    { mana: 1 } as SkillReward,
    { gold: 1 } as SkillReward,
    { mana: 1 } as SkillReward,
    // positions 4-6
    { scoring: { arcana: 1 } } as SkillReward,
    { scoring: { arcana: 1 } } as SkillReward,
    { scoring: { arcana: 1 } } as SkillReward,
  ],
};

export interface TrailNodeConfig {
  name: string;
  threshold: number; // card value must be >= this
  reward: SkillReward;
}

export const TRAIL_MAP_NODES: TrailNodeConfig[] = [
  { name: 'Forest', threshold: 2, reward: { supplies: 1 } },
  { name: 'Ruins', threshold: 3, reward: { scoring: { discovery: 1 } } },
  { name: 'Quarry', threshold: 4, reward: { gold: 1 } },
  { name: 'Shrine', threshold: 5, reward: { mana: 1 } },
  { name: 'Den', threshold: 6, reward: { supplies: 1 } },
  { name: 'Watchpoint', threshold: 7, reward: { scoring: { discovery: 1 } } },
  { name: 'Summit', threshold: 8, reward: { scoring: { discovery: 2, champion: 1 } } },
];

export interface QuarryTrackConfig {
  name: string;
  count: number;
  requirement: string;
  reward: SkillReward;
}

export const QUARRY_BOARD_CONFIG: QuarryTrackConfig[] = [
  {
    name: 'Beast',
    count: 3,
    requirement: '3 low values (2–4)',
    reward: { supplies: 2, scoring: { champion: 1 } },
  },
  {
    name: 'Raider',
    count: 3,
    requirement: '3 mid values (5–7)',
    reward: { gold: 2, scoring: { champion: 1 } },
  },
  {
    name: 'Spirit',
    count: 3,
    requirement: '3 values summing ≥ 15',
    reward: { scoring: { arcana: 1, discovery: 2 } },
  },
];

export interface SurvivalSlotConfig {
  name: string;
  minValue: number;
  maxValue: number;
  spendEffect: string;
  spendReward?: SkillReward;
}

export const SURVIVAL_KIT_CONFIG: SurvivalSlotConfig[] = [
  { name: 'Rations', minValue: 2, maxValue: 4, spendEffect: '+2 Supplies', spendReward: { supplies: 2 } },
  { name: 'Arrows', minValue: 5, maxValue: 7, spendEffect: '+1 combat bonus (this turn)' },
  { name: 'Torch', minValue: 4, maxValue: 7, spendEffect: 'Reveal next drawn card value' },
  { name: 'Rope', minValue: 7, maxValue: 10, spendEffect: 'Jump to any visited Trail node' },
];

// ---------------------------------------------------------------------------
// Constraint validators (pure, no side effects)
// ---------------------------------------------------------------------------

/** Returns the last filled value in a row (skipping nulls), or null if empty. */
function lastFilledValue(row: (number | null)[]): number | null {
  for (let i = row.length - 1; i >= 0; i--) {
    if (row[i] !== null) return row[i] as number;
  }
  return null;
}

/** Returns index of the first null slot, or -1 if row is full. */
export function nextOpenSlot(row: (number | null)[]): number {
  return row.findIndex(v => v === null);
}

export function canPlaceOnHonorRow(
  state: ArmsAndOathRowsState,
  newValue: number
): boolean {
  const last = lastFilledValue(state.honorRow);
  if (last === null) return true;
  return newValue > last;
}

export function canPlaceOnMightRow(
  state: ArmsAndOathRowsState,
  newValue: number
): boolean {
  const last = lastFilledValue(state.mightRow);
  if (last === null) return true;
  return newValue < last;
}

export function canPlaceFortressTier(
  fortress: FortressState,
  tier: 1 | 2 | 3,
  value: number
): boolean {
  if (tier === 1) return value >= FORTRESS_CONFIG.tier1Range.min && value <= FORTRESS_CONFIG.tier1Range.max;
  if (tier === 2) return fortress.tier1 !== null && value < fortress.tier1;
  if (tier === 3) return fortress.tier2 !== null && value < fortress.tier2;
  return false;
}

/** Count active undead in the Grave Ledger (columns with steps > 0). */
export function activeUndeadCount(skeleton: number, ghost: number, wraith: number): number {
  return (skeleton > 0 ? 1 : 0) + (ghost > 0 ? 1 : 0) + (wraith > 0 ? 1 : 0);
}
