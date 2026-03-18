import { CardValue } from '../types';

// ---------------------------------------------------------------------------
// Static building configuration
// ---------------------------------------------------------------------------

export type CityDistrict =
    | 'Commons'
    | "Crafters' Row"
    | 'Merchant Quarter'
    | 'Noble District'
    | 'Special District';

export interface CityMilestone {
    /** Visit count at which this milestone triggers (or soul accumulation count for Graveyard). */
    threshold: number;
    label: string;
}

export interface CityBuildingConfig {
    rank: CardValue | 'wild';
    name: string;
    icon: string;
    district: CityDistrict;
    visitEffect: string;
    milestones: CityMilestone[];
    optionalSpend?: string;
    specialAbility?: string;
    visitCapDefault: number;       // 0 = no cap
    trackLayout?: 'row' | 'grid';  // grid = 2-row grid layout (Bank, Herbalist)
    isGloballyLimited?: boolean;
}

export const CITY_BUILDINGS: CityBuildingConfig[] = [
    // ── Commons ──────────────────────────────────────────────────────────────
    {
        rank: '2',
        name: 'The Stables',
        icon: '🐴',
        district: 'Commons',
        visitEffect: 'Gain 1 Supply.',
        milestones: [
            { threshold: 2, label: '+2 Supplies' },
            { threshold: 4, label: '+2 Supplies, +1 XP' },
        ],
        optionalSpend: 'Pay 1 Gold → gain 2 Supplies this visit instead of 1.',
        visitCapDefault: 4,
    },
    {
        rank: '3',
        name: 'The Tavern',
        icon: '🍺',
        district: 'Commons',
        visitEffect: 'Choose: heal 2 Wounds OR gain 1 Gold.',
        milestones: [
            { threshold: 2, label: 'Partial heal-all (1 Wound per wounded location)' },
            { threshold: 4, label: 'Fortune +1, heal 3 Wounds' },
        ],
        optionalSpend: 'Pay 2 Gold → gain both effects (heal AND gold).',
        visitCapDefault: 4,
    },
    {
        rank: '4',
        name: 'Market Square',
        icon: '🏪',
        district: 'Commons',
        visitEffect: 'Gain Gold = number of resource types held > 0 (min 1, max 4).',
        milestones: [
            { threshold: 3, label: '+3 Gold' },
            { threshold: 5, label: '+3 Gold, Fortune +1' },
        ],
        optionalSpend: 'Pay 2 Supplies → gain 4 Gold this visit.',
        visitCapDefault: 5,
    },

    // ── Crafters' Row ─────────────────────────────────────────────────────────
    {
        rank: '5',
        name: "The Herbalist",
        icon: '🌿',
        district: "Crafters' Row",
        visitEffect: 'Gain 1 Color Energy of your choice.',
        milestones: [
            { threshold: 3, label: 'Complete Row 1 → +1 Mana' },
            { threshold: 6, label: 'Complete Row 2 → gain 1 of each Color Energy' },
        ],
        optionalSpend: 'Pay 1 Supply → gain 2 Color Energies this visit.',
        visitCapDefault: 6,
        trackLayout: 'grid',
    },
    {
        rank: '6',
        name: 'The Blacksmith',
        icon: '⚒️',
        district: "Crafters' Row",
        visitEffect: 'Equip 1 Armor to any body location.',
        milestones: [
            { threshold: 2, label: 'Equip 2 Armor (split or stack)' },
            { threshold: 4, label: 'Equip 1 Armor to every body location not at max' },
        ],
        optionalSpend: 'Pay 3 Gold → equip 1 additional Armor on top of visit effect.',
        visitCapDefault: 4,
    },
    {
        rank: '7',
        name: "Mage's Workshop",
        icon: '🔮',
        district: "Crafters' Row",
        visitEffect: 'Gain 1 Mana.',
        milestones: [
            { threshold: 3, label: '+2 Mana, Arcana +1' },
            { threshold: 5, label: '+3 Mana, Arcana +2, +1 Color Energy of choice' },
        ],
        optionalSpend: 'Pay 2 Gold → gain +1 Mana on top of this visit.',
        visitCapDefault: 5,
    },
    {
        rank: '8',
        name: 'The Guild Hall',
        icon: '🏛️',
        district: "Crafters' Row",
        visitEffect: 'Gain 1 XP.',
        milestones: [
            { threshold: 2, label: '+2 XP total this visit (milestone doubling)' },
            { threshold: 4, label: '+3 XP, Champion +1' },
        ],
        optionalSpend: 'Pay 2 Gold → gain +1 XP on top of this visit.',
        visitCapDefault: 4,
    },

    // ── Merchant Quarter ──────────────────────────────────────────────────────
    {
        rank: '9',
        name: "Scholar's Archive",
        icon: '📚',
        district: 'Merchant Quarter',
        visitEffect: 'Choose: gain 2 XP OR advance Discovery +1.',
        milestones: [
            { threshold: 2, label: '+3 XP + Discovery +1 (both, regardless of choice)' },
            { threshold: 4, label: 'Discovery +2, gain 1 Scry Token' },
        ],
        optionalSpend: 'Pay 3 Mana → also advance Arcana +2 this visit.',
        visitCapDefault: 4,
    },
    {
        rank: '10',
        name: 'The Bank',
        icon: '💰',
        district: 'Merchant Quarter',
        visitEffect: 'Gain 3 Gold.',
        milestones: [
            { threshold: 3, label: 'Complete Row 1 → +4 Gold, Fortune +1' },
            { threshold: 6, label: 'Complete Row 2 → +5 Gold, Fortune +2' },
        ],
        optionalSpend:
            'Deposit: Pay 5 Gold (Small) or 10 Gold (Large) → earn Gold + Fortune per round. Max 3 deposits globally.',
        visitCapDefault: 6,
        trackLayout: 'grid',
        isGloballyLimited: true,
    },

    // ── Noble District ────────────────────────────────────────────────────────
    {
        rank: 'J',
        name: "Thieves' Guild",
        icon: '🗡️',
        district: 'Noble District',
        visitEffect: 'Gain 1 free resource (Gold, Supply, OR Mana). No cost.',
        milestones: [
            { threshold: 1, label: 'Slot 1: +1 Gold' },
            { threshold: 2, label: 'Slot 2: +1 Supply' },
            { threshold: 3, label: 'Slot 3: +1 Mana' },
            { threshold: 4, label: 'Slot 4: Fortune +1' },
        ],
        specialAbility: 'J♦ Face Card: Gain 2 free resources (instead of 1). Crown Heist: also advance 1 Scoring Track +1.',
        visitCapDefault: 4,
    },
    {
        rank: 'Q',
        name: 'Temple of the Fading Light',
        icon: '🕍',
        district: 'Noble District',
        visitEffect: 'Heal 3 Wounds (any locations) OR remove all wounds from 1 body location.',
        milestones: [
            { threshold: 2, label: 'Full reset of 2 body locations (remove all wounds)' },
            { threshold: 4, label: 'Full character heal (all wounds) + Fortune +1' },
        ],
        optionalSpend: 'Pay 3 Mana → also advance Arcana +1 this visit.',
        specialAbility: 'Q♦ Face Card: Royal Pardon — un-exhaust one exhausted city building (regain 1 visit slot).',
        visitCapDefault: 4,
    },
    {
        rank: 'K',
        name: 'The Royal Keep',
        icon: '👑',
        district: 'Noble District',
        visitEffect: 'Advance any 1 Scoring Track (Discovery / Champion / Arcana / Fortune) by 1.',
        milestones: [
            { threshold: 2, label: 'Any Scoring Track +1 AND +2 Gold' },
            { threshold: 4, label: 'All four Scoring Tracks +1 each' },
        ],
        optionalSpend: 'Pay 5 Gold → advance chosen track by 2 instead of 1.',
        specialAbility: 'K♦ Face Card: Crown Authority — this visit counts as 2 visits (mark 2 circles, apply effect twice).',
        visitCapDefault: 4,
        isGloballyLimited: true,
    },
    {
        rank: 'A',
        name: 'The Arcane Academy',
        icon: '🌟',
        district: 'Noble District',
        visitEffect: 'Gain any 2 Color Energies of choice AND Arcana +1.',
        milestones: [
            { threshold: 3, label: '1 of each Color Energy (all 6) + Arcana +1' },
            { threshold: 5, label: '+3 Mana, Arcana +3, Fortune +1' },
        ],
        optionalSpend: 'Pay 3 Mana → gain 2 additional Color Energies this visit.',
        visitCapDefault: 5,
        isGloballyLimited: true,
    },

    // ── Special District ──────────────────────────────────────────────────────
    {
        rank: 'wild',
        name: 'The Graveyard',
        icon: '⚰️',
        district: 'Special District',
        visitEffect:
            'Gain Soul Markers: ♦2–4 → 1 Soul | ♦5–8 → 2 Souls | ♦9–10 → 3 Souls | ♦J/Q/K → 4 Souls | ♦A → 5 Souls.',
        milestones: [
            { threshold: 5, label: '5 Souls accumulated → Discovery +1' },
            { threshold: 10, label: '10 Souls accumulated → Arcana +1 + gain 1 Mana' },
            { threshold: 15, label: '15 Souls accumulated → All four Scoring Tracks +1' },
        ],
        visitCapDefault: 0, // no cap
    },
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

export function getBuildingConfig(rank: CardValue | 'wild'): CityBuildingConfig | undefined {
    return CITY_BUILDINGS.find(b => b.rank === rank);
}

export function isExhausted(visits: number, visitCap: number): boolean {
    return visitCap > 0 && visits >= visitCap;
}

/** Returns souls gained from a Graveyard visit for a given card rank. */
export function soulsForRank(rank: CardValue): number {
    if (rank === '2' || rank === '3' || rank === '4') return 1;
    if (rank === '5' || rank === '6' || rank === '7' || rank === '8') return 2;
    if (rank === '9' || rank === '10') return 3;
    if (rank === 'J' || rank === 'Q' || rank === 'K') return 4;
    return 5; // A
}

/** Soul spend table: cost → description. */
export const SOUL_SPEND_TABLE: { cost: number; effect: string }[] = [
    { cost: 1, effect: 'Heal 1 Wound (any location)' },
    { cost: 2, effect: 'Gain 1 Supply or 1 Mana' },
    { cost: 3, effect: 'Gain 2 Gold' },
    { cost: 5, effect: 'Gain 1 XP or 1 Color Energy of choice' },
    { cost: 8, effect: 'Advance any Scoring Track +1' },
];
