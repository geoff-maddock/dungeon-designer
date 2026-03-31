import {
  isSkillUnlocked,
  cardNumericValue,
  cardBand,
  soulRingPosition,
  applyReward,
  canPlaceOnHonorRow,
  canPlaceOnMightRow,
  canPlaceFortressTier,
  SKILL_UNLOCK_LEVELS,
} from '../utils/skillLogic';
import { DEFAULT_CHARACTER, DEFAULT_SKILL_STATE } from '../types';

// ---------------------------------------------------------------------------
// isSkillUnlocked
// ---------------------------------------------------------------------------

describe('isSkillUnlocked', () => {
  test('unlock levels are [1, 4, 7]', () => {
    expect(SKILL_UNLOCK_LEVELS).toEqual([1, 4, 7]);
  });

  test('level 0 — all slots locked', () => {
    expect(isSkillUnlocked(0, 1)).toBe(false);
    expect(isSkillUnlocked(0, 2)).toBe(false);
    expect(isSkillUnlocked(0, 3)).toBe(false);
  });

  test('level 1 — slot 1 unlocked, slots 2 and 3 locked', () => {
    expect(isSkillUnlocked(1, 1)).toBe(true);
    expect(isSkillUnlocked(1, 2)).toBe(false);
    expect(isSkillUnlocked(1, 3)).toBe(false);
  });

  test('level 4 — slots 1 and 2 unlocked, slot 3 locked', () => {
    expect(isSkillUnlocked(4, 1)).toBe(true);
    expect(isSkillUnlocked(4, 2)).toBe(true);
    expect(isSkillUnlocked(4, 3)).toBe(false);
  });

  test('level 7 — all slots unlocked', () => {
    expect(isSkillUnlocked(7, 1)).toBe(true);
    expect(isSkillUnlocked(7, 2)).toBe(true);
    expect(isSkillUnlocked(7, 3)).toBe(true);
  });

  test('level 9 (max) — all slots unlocked', () => {
    expect(isSkillUnlocked(9, 1)).toBe(true);
    expect(isSkillUnlocked(9, 2)).toBe(true);
    expect(isSkillUnlocked(9, 3)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// cardNumericValue
// ---------------------------------------------------------------------------

describe('cardNumericValue', () => {
  test('returns integer 2–10 for numeric cards', () => {
    expect(cardNumericValue('2')).toBe(2);
    expect(cardNumericValue('5')).toBe(5);
    expect(cardNumericValue('10')).toBe(10);
  });

  test('returns null for J, Q, K, A', () => {
    expect(cardNumericValue('J')).toBeNull();
    expect(cardNumericValue('Q')).toBeNull();
    expect(cardNumericValue('K')).toBeNull();
    expect(cardNumericValue('A')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// cardBand
// ---------------------------------------------------------------------------

describe('cardBand', () => {
  test('2, 3, 4 → low', () => {
    expect(cardBand(2)).toBe('low');
    expect(cardBand(3)).toBe('low');
    expect(cardBand(4)).toBe('low');
  });

  test('5, 6, 7 → mid', () => {
    expect(cardBand(5)).toBe('mid');
    expect(cardBand(6)).toBe('mid');
    expect(cardBand(7)).toBe('mid');
  });

  test('8, 9, 10 → high', () => {
    expect(cardBand(8)).toBe('high');
    expect(cardBand(9)).toBe('high');
    expect(cardBand(10)).toBe('high');
  });
});

// ---------------------------------------------------------------------------
// soulRingPosition
// ---------------------------------------------------------------------------

describe('soulRingPosition', () => {
  test('v=2 → position 3', () => expect(soulRingPosition(2)).toBe(3));
  test('v=5 → position 6', () => expect(soulRingPosition(5)).toBe(6));
  test('v=6 → position 1', () => expect(soulRingPosition(6)).toBe(1));
  test('v=10 → position 5', () => expect(soulRingPosition(10)).toBe(5));
  test('v=7 → position 2', () => expect(soulRingPosition(7)).toBe(2));
});

// ---------------------------------------------------------------------------
// applyReward
// ---------------------------------------------------------------------------

describe('applyReward', () => {
  const baseChar = {
    ...DEFAULT_CHARACTER,
    resources: { xp: 0, gold: 0, supplies: 0, mana: 0 },
    scoring: { discovery: 0, champion: 0, arcana: 0, fortune: 0 },
  };

  test('applies supply reward', () => {
    const result = applyReward(baseChar, { supplies: 2 });
    expect(result.resources.supplies).toBe(2);
  });

  test('applies mana reward', () => {
    const result = applyReward(baseChar, { mana: 3 });
    expect(result.resources.mana).toBe(3);
  });

  test('applies scoring reward', () => {
    const result = applyReward(baseChar, { scoring: { arcana: 1 } });
    expect(result.scoring.arcana).toBe(1);
  });

  test('accumulates onto existing values', () => {
    const char = {
      ...baseChar,
      resources: { ...baseChar.resources, gold: 5 },
      scoring: { ...baseChar.scoring, champion: 3 },
    };
    const result = applyReward(char, { gold: 2, scoring: { champion: 1 } });
    expect(result.resources.gold).toBe(7);
    expect(result.scoring.champion).toBe(4);
  });

  test('applies multiple reward fields simultaneously', () => {
    const result = applyReward(baseChar, { supplies: 1, mana: 2, gold: 3, scoring: { discovery: 1 } });
    expect(result.resources.supplies).toBe(1);
    expect(result.resources.mana).toBe(2);
    expect(result.resources.gold).toBe(3);
    expect(result.scoring.discovery).toBe(1);
  });

  test('does not mutate the original character', () => {
    const original = { ...baseChar };
    applyReward(baseChar, { gold: 99 });
    expect(baseChar.resources.gold).toBe(original.resources.gold);
  });
});

// ---------------------------------------------------------------------------
// canPlaceOnHonorRow
// ---------------------------------------------------------------------------

describe('canPlaceOnHonorRow', () => {
  const emptyRow = { honorRow: [null, null, null, null, null], mightRow: [null, null, null, null, null] };
  const partialRow = { honorRow: [3, null, null, null, null], mightRow: [null, null, null, null, null] };

  test('empty row accepts any value', () => {
    expect(canPlaceOnHonorRow(emptyRow, 2)).toBe(true);
    expect(canPlaceOnHonorRow(emptyRow, 10)).toBe(true);
  });

  test('accepts value strictly greater than last filled slot', () => {
    expect(canPlaceOnHonorRow(partialRow, 4)).toBe(true);
    expect(canPlaceOnHonorRow(partialRow, 10)).toBe(true);
  });

  test('rejects value equal to last filled slot', () => {
    expect(canPlaceOnHonorRow(partialRow, 3)).toBe(false);
  });

  test('rejects value less than last filled slot', () => {
    expect(canPlaceOnHonorRow(partialRow, 2)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// canPlaceOnMightRow
// ---------------------------------------------------------------------------

describe('canPlaceOnMightRow', () => {
  const emptyRow = { honorRow: [null, null, null, null, null], mightRow: [null, null, null, null, null] };
  const partialRow = { honorRow: [null, null, null, null, null], mightRow: [8, null, null, null, null] };

  test('empty row accepts any value', () => {
    expect(canPlaceOnMightRow(emptyRow, 10)).toBe(true);
  });

  test('accepts value strictly less than last filled slot', () => {
    expect(canPlaceOnMightRow(partialRow, 7)).toBe(true);
    expect(canPlaceOnMightRow(partialRow, 2)).toBe(true);
  });

  test('rejects value equal to last filled slot', () => {
    expect(canPlaceOnMightRow(partialRow, 8)).toBe(false);
  });

  test('rejects value greater than last filled slot', () => {
    expect(canPlaceOnMightRow(partialRow, 9)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// canPlaceFortressTier
// ---------------------------------------------------------------------------

describe('canPlaceFortressTier', () => {
  const empty = { tier1: null, tier2: null, tier3: null };

  test('tier 1 accepts values 5–10', () => {
    expect(canPlaceFortressTier(empty, 1, 5)).toBe(true);
    expect(canPlaceFortressTier(empty, 1, 10)).toBe(true);
    expect(canPlaceFortressTier(empty, 1, 4)).toBe(false);
  });

  test('tier 2 must be less than tier 1 value', () => {
    const withTier1 = { ...empty, tier1: 8 };
    expect(canPlaceFortressTier(withTier1, 2, 7)).toBe(true);
    expect(canPlaceFortressTier(withTier1, 2, 8)).toBe(false);
  });

  test('tier 3 must be less than tier 2 value', () => {
    const withTiers = { tier1: 8, tier2: 5, tier3: null };
    expect(canPlaceFortressTier(withTiers, 3, 4)).toBe(true);
    expect(canPlaceFortressTier(withTiers, 3, 5)).toBe(false);
  });

  test('tier 2 requires tier 1 to be set', () => {
    expect(canPlaceFortressTier(empty, 2, 5)).toBe(false);
  });

  test('tier 3 requires tier 2 to be set', () => {
    const withTier1 = { ...empty, tier1: 8 };
    expect(canPlaceFortressTier(withTier1, 3, 3)).toBe(false);
  });
});
