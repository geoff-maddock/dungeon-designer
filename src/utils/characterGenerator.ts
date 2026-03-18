import { CharacterState, DEFAULT_CHARACTER } from '../types';

const FANTASY_NAMES = [
    'Aldric', 'Brynn', 'Caelum', 'Dara', 'Elara', 'Finn', 'Gwen', 'Hadyn',
    'Isolde', 'Jorah', 'Kyra', 'Lorne', 'Mira', 'Navi', 'Oryn', 'Petra',
    'Quinn', 'Runa', 'Sable', 'Toren', 'Ula', 'Vera', 'Wren', 'Xan',
    'Yara', 'Zeph',
];

function rand(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Returns the milestone values for a scoring track. */
export function getScoringMilestones(max: number = 35): number[] {
    const milestones: number[] = [];
    for (let i = 5; i <= 20; i += 5) milestones.push(i);
    for (let i = 23; i <= max; i += 3) milestones.push(i);
    return milestones;
}
// Result: [5, 10, 15, 20, 23, 26, 29, 32, 35]

/** Randomly distributes `total` points among `count` slots, each between `min` and `max`. */
function distributeStats(count: number, total: number, min: number, max: number): number[] {
    const stats = Array(count).fill(min);
    let remaining = total - min * count;
    while (remaining > 0) {
        const i = rand(0, count - 1);
        if (stats[i] < max) {
            stats[i]++;
            remaining--;
        }
    }
    return stats;
}

export function generateRandomCharacter(): CharacterState {
    const name = FANTASY_NAMES[rand(0, FANTASY_NAMES.length - 1)];

    // Distribute 12–16 points among 4 attributes, each capped at 7
    const attrTotal = rand(12, 16);
    const [brawn, agility, mind, spirit] = distributeStats(4, attrTotal, 1, 7);

    return {
        name,
        body: DEFAULT_CHARACTER.body.map(loc => ({
            ...loc,
            hits: 0,
            armor: 0,
        })),
        attributes: { brawn, agility, mind, spirit },
        resources: {
            xp: rand(0, 5),
            gold: rand(0, 10),
            supplies: rand(0, 5),
            mana: rand(0, 5),
        },
        energies: {
            red: rand(0, 2),
            orange: rand(0, 2),
            yellow: rand(0, 2),
            green: rand(0, 2),
            blue: rand(0, 2),
            purple: rand(0, 2),
        },
        scoring: { discovery: 0, champion: 0, arcana: 0, fortune: 0 },
        wounds: 0,
        classes: DEFAULT_CHARACTER.classes.map(cls => ({ ...cls, level: 0 })),
    };
}
