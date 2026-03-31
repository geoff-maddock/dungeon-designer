import React from 'react';
import { CharacterState, BodyLocation, ScoringCategory, CharacterClass, DEFAULT_CHARACTER, CardDraw, ClassSkillState } from '../types';
import { generateRandomCharacter, getScoringMilestones } from '../utils/characterGenerator';
import { cardNumericValue } from '../utils/skillLogic';
import DeckPanel, { getCardColor, getSuitSymbol } from './DeckPanel';
import ClassSkillBoard from './ClassSkillBoard';

interface CharacterBoardProps {
    character: CharacterState;
    onChange: (updated: CharacterState) => void;
    // Shared deck
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
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SCORING_MAX = 35;
const SCORING_MILESTONES = getScoringMilestones(SCORING_MAX);

const COLOR_STYLES: Record<keyof CharacterState['energies'], string> = {
    red: 'bg-red-500',
    orange: 'bg-orange-400',
    yellow: 'bg-yellow-400',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
};

const COLOR_LABEL_STYLES: Record<keyof CharacterState['energies'], string> = {
    red: 'text-red-700',
    orange: 'text-orange-600',
    yellow: 'text-yellow-600',
    green: 'text-green-700',
    blue: 'text-blue-700',
    purple: 'text-purple-700',
};

const SCORING_COLORS: Record<ScoringCategory, string> = {
    discovery: 'bg-sky-400',
    champion: 'bg-amber-400',
    arcana: 'bg-violet-400',
    fortune: 'bg-emerald-400',
};

const SCORING_LABEL_COLORS: Record<ScoringCategory, string> = {
    discovery: 'text-sky-700',
    champion: 'text-amber-700',
    arcana: 'text-violet-700',
    fortune: 'text-emerald-700',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** A small +/- counter */
function Counter({
    value,
    onIncrement,
    onDecrement,
}: {
    value: number;
    onIncrement: () => void;
    onDecrement: () => void;
}) {
    return (
        <div className="flex items-center gap-1">
            <button
                onClick={onDecrement}
                disabled={value <= 0}
                className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-40 text-sm font-bold leading-none"
            >
                −
            </button>
            <span className="w-6 text-center font-semibold text-sm">{value}</span>
            <button
                onClick={onIncrement}
                className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 text-sm font-bold leading-none"
            >
                +
            </button>
        </div>
    );
}

/** A horizontal 0‑to‑max pip track that sets value on click */
function PipTrack({
    value,
    max,
    activeClass,
    onSet,
}: {
    value: number;
    max: number;
    activeClass: string;
    onSet: (v: number) => void;
}) {
    return (
        <div className="flex gap-1 flex-wrap">
            {Array.from({ length: max + 1 }, (_, i) => (
                <button
                    key={i}
                    title={`Set to ${i}`}
                    onClick={() => onSet(i)}
                    className={`w-5 h-5 rounded-full border-2 transition-colors ${i <= value
                        ? `${activeClass} border-transparent`
                        : 'bg-white border-gray-300 hover:border-gray-500'
                        }`}
                />
            ))}
        </div>
    );
}

// ---------------------------------------------------------------------------
// BodyPartCard
// ---------------------------------------------------------------------------

function getBodyPenaltyLabel(name: BodyLocation['name']): string {
    switch (name) {
        case 'Head': return '−2 Mind';
        case 'Torso': return '−2 Spirit';
        case 'Left Arm': case 'Right Arm': return '−2 Brawn';
        case 'Left Leg': case 'Right Leg': return '−1 Agility';
    }
}

function BodyPartCard({
    loc,
    onHitsChange,
    onArmorChange,
}: {
    loc: BodyLocation;
    onHitsChange: (newHits: number) => void;
    onArmorChange: (newArmor: number) => void;
}) {
    const isFull = loc.hits >= loc.woundSlots;

    function handleCircleClick(i: number) {
        // Fill to i+1 if unfilled; clear back to i if already filled
        onHitsChange(i < loc.hits ? i : Math.min(i + 1, loc.woundSlots));
    }

    return (
        <div className={`rounded border p-1.5 text-center min-w-[56px] ${isFull ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'}`}>
            {/* Name */}
            <div className="text-[10px] font-semibold text-gray-500 mb-1 leading-tight">
                {loc.name}
            </div>

            {/* Hit circles */}
            <div className="flex gap-0.5 justify-center mb-1.5 flex-wrap">
                {Array.from({ length: loc.woundSlots }, (_, i) => {
                    const isArmored = i < loc.armor;
                    const isHit = i < loc.hits;
                    let cls = 'w-4 h-4 rounded-full border-2 transition-colors cursor-pointer ';
                    if (isHit && isArmored) {
                        cls += 'bg-blue-400 border-blue-500';        // armored hit — blocked
                    } else if (isHit && !isArmored) {
                        cls += 'bg-red-500 border-red-600';           // unarmored hit — wound
                    } else if (!isHit && isArmored) {
                        cls += 'bg-white border-blue-400 hover:bg-blue-50'; // armored, empty
                    } else {
                        cls += 'bg-white border-gray-300 hover:border-gray-500'; // normal, empty
                    }
                    return (
                        <button
                            key={i}
                            onClick={() => handleCircleClick(i)}
                            className={cls}
                            title={`${isArmored ? 'Armored' : 'Unarmored'} slot ${i + 1}`}
                        />
                    );
                })}
            </div>

            {/* Armor counter */}
            <div className="flex items-center justify-center gap-0.5">
                <span className="text-[11px] mr-0.5">🛡️</span>
                <button
                    onClick={() => onArmorChange(Math.max(0, loc.armor - 1))}
                    disabled={loc.armor <= 0}
                    className="w-4 h-4 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 rounded text-xs font-bold leading-none flex items-center justify-center"
                >−</button>
                <span className="w-4 text-center text-xs text-blue-600 font-semibold">{loc.armor}</span>
                <button
                    onClick={() => onArmorChange(Math.min(loc.woundSlots, loc.armor + 1))}
                    disabled={loc.armor >= loc.woundSlots}
                    className="w-4 h-4 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 rounded text-xs font-bold leading-none flex items-center justify-center"
                >+</button>
            </div>

            {/* Full indicator with penalty label */}
            {isFull && (
                <div className="text-[9px] text-red-600 font-bold mt-1 leading-tight">
                    FULL<br /><span className="font-normal">{getBodyPenaltyLabel(loc.name)}</span>
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// WoundTrack
// ---------------------------------------------------------------------------

const MAX_WOUNDS = 10;

function WoundTrack({
    wounds,
    onSet,
}: {
    wounds: number;
    onSet: (v: number) => void;
}) {
    return (
        <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">Wounds</span>
                <span className="text-xs text-red-500 font-medium">{wounds} / {MAX_WOUNDS}</span>
            </div>
            <div className="flex gap-0.5">
                {Array.from({ length: MAX_WOUNDS }, (_, i) => (
                    <button
                        key={i}
                        onClick={() => onSet(i < wounds ? i : i + 1)}
                        className={`text-lg leading-none transition-colors ${i < wounds
                            ? 'text-red-500 hover:text-red-300'
                            : 'text-gray-200 hover:text-red-300'
                            }`}
                        title={`${i + 1} wound${i + 1 !== 1 ? 's' : ''}`}
                    >♥</button>
                ))}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// BodyDiagram
// ---------------------------------------------------------------------------

/** Global wound count = total unblocked hits across all body parts, max 10. */
function computeWounds(body: BodyLocation[]): number {
    return Math.min(MAX_WOUNDS, body.reduce((sum, loc) => sum + Math.max(0, loc.hits - loc.armor), 0));
}

function BodyDiagram({
    body,
    wounds,
    onBodyChange,
    onWoundsChange,
}: {
    body: BodyLocation[];
    wounds: number;
    onBodyChange: (updated: BodyLocation[]) => void;
    onWoundsChange: (w: number) => void;
}) {
    function updateLoc(name: string, patch: Partial<BodyLocation>) {
        const newBody = body.map(loc => loc.name === name ? { ...loc, ...patch } : loc);
        onBodyChange(newBody);
    }

    const headLoc = body.find(l => l.name === 'Head')!;
    const torsoLoc = body.find(l => l.name === 'Torso')!;
    const lArmLoc = body.find(l => l.name === 'Left Arm')!;
    const rArmLoc = body.find(l => l.name === 'Right Arm')!;
    const lLegLoc = body.find(l => l.name === 'Left Leg')!;
    const rLegLoc = body.find(l => l.name === 'Right Leg')!;

    return (
        <div className="bg-white rounded-lg shadow p-3">
            <h3 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">Body</h3>

            {/* Legend */}
            <div className="flex flex-wrap gap-2 text-[10px] text-gray-400 mb-2">
                <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-full bg-white border-2 border-blue-400" />
                    Armored
                </span>
                <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-full bg-blue-400 border-2 border-blue-500" />
                    Blocked
                </span>
                <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-full bg-red-500 border-2 border-red-600" />
                    Wound
                </span>
            </div>

            {/* Humanoid body layout */}
            <div className="flex flex-col items-center gap-1.5">
                {/* Head */}
                <BodyPartCard
                    loc={headLoc}
                    onHitsChange={h => updateLoc('Head', { hits: h })}
                    onArmorChange={a => updateLoc('Head', { armor: a })}
                />
                {/* Arms + Torso */}
                <div className="flex items-start gap-1">
                    <BodyPartCard
                        loc={lArmLoc}
                        onHitsChange={h => updateLoc('Left Arm', { hits: h })}
                        onArmorChange={a => updateLoc('Left Arm', { armor: a })}
                    />
                    <BodyPartCard
                        loc={torsoLoc}
                        onHitsChange={h => updateLoc('Torso', { hits: h })}
                        onArmorChange={a => updateLoc('Torso', { armor: a })}
                    />
                    <BodyPartCard
                        loc={rArmLoc}
                        onHitsChange={h => updateLoc('Right Arm', { hits: h })}
                        onArmorChange={a => updateLoc('Right Arm', { armor: a })}
                    />
                </div>
                {/* Legs */}
                <div className="flex gap-1">
                    <BodyPartCard
                        loc={lLegLoc}
                        onHitsChange={h => updateLoc('Left Leg', { hits: h })}
                        onArmorChange={a => updateLoc('Left Leg', { armor: a })}
                    />
                    <BodyPartCard
                        loc={rLegLoc}
                        onHitsChange={h => updateLoc('Right Leg', { hits: h })}
                        onArmorChange={a => updateLoc('Right Leg', { armor: a })}
                    />
                </div>
            </div>

            {/* Global wound track */}
            <WoundTrack wounds={wounds} onSet={onWoundsChange} />
        </div>
    );
}

function CharacterHeader({
    name,
    onNameChange,
    onRandomize,
    onReset,
}: {
    name: string;
    onNameChange: (n: string) => void;
    onRandomize: () => void;
    onReset: () => void;
}) {
    return (
        <header className="bg-stone-800 text-white p-4 shadow-md flex items-center gap-4 flex-shrink-0">
            <h2 className="text-xl font-bold whitespace-nowrap">Character Board</h2>
            <input
                type="text"
                value={name}
                onChange={e => onNameChange(e.target.value)}
                className="px-3 py-1 rounded text-black font-semibold text-lg flex-1 max-w-xs"
                placeholder="Character Name"
            />
            <div className="flex gap-2 ml-auto">
                <button
                    onClick={onReset}
                    className="bg-stone-500 hover:bg-stone-600 text-white px-4 py-1 rounded font-medium"
                >
                    ↺ Reset
                </button>
                <button
                    onClick={onRandomize}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-1 rounded font-medium"
                >
                    🎲 Randomize
                </button>
            </div>
        </header>
    );
}

// ---------------------------------------------------------------------------
// AttributeTracks
// ---------------------------------------------------------------------------

const ATTR_KEYS: (keyof CharacterState['attributes'])[] = ['brawn', 'agility', 'mind', 'spirit'];
const ATTR_LABELS: Record<keyof CharacterState['attributes'], string> = {
    brawn: 'Brawn',
    agility: 'Agility',
    mind: 'Mind',
    spirit: 'Spirit',
};

function AttributeTracks({
    attributes,
    onChange,
}: {
    attributes: CharacterState['attributes'];
    onChange: (updated: CharacterState['attributes']) => void;
}) {
    return (
        <div className="bg-white rounded-lg shadow p-3">
            <h3 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">Attributes</h3>
            <div className="space-y-2">
                {ATTR_KEYS.map(key => (
                    <div key={key} className="flex items-center gap-2">
                        <span className="w-14 text-xs font-medium text-gray-600">{ATTR_LABELS[key]}</span>
                        <PipTrack
                            value={attributes[key]}
                            max={10}
                            activeClass="bg-indigo-500"
                            onSet={v => onChange({ ...attributes, [key]: v })}
                        />
                        <span className="text-xs text-gray-500 w-4">{attributes[key]}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// ResourceCounters
// ---------------------------------------------------------------------------

const RESOURCE_KEYS: (keyof CharacterState['resources'])[] = ['xp', 'gold', 'supplies', 'mana'];
const RESOURCE_LABELS: Record<keyof CharacterState['resources'], string> = {
    xp: 'XP', gold: 'Gold', supplies: 'Supplies', mana: 'Mana',
};
const RESOURCE_ICONS: Record<keyof CharacterState['resources'], string> = {
    xp: '⭐', gold: '🪙', supplies: '🎒', mana: '✨',
};

function ResourceCounters({
    resources,
    onChange,
}: {
    resources: CharacterState['resources'];
    onChange: (updated: CharacterState['resources']) => void;
}) {
    return (
        <div className="bg-white rounded-lg shadow p-3">
            <h3 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">Resources</h3>
            <div className="grid grid-cols-2 gap-2">
                {RESOURCE_KEYS.map(key => (
                    <div key={key} className="flex items-center gap-2">
                        <span className="text-base">{RESOURCE_ICONS[key]}</span>
                        <span className="text-xs font-medium text-gray-600 w-12">{RESOURCE_LABELS[key]}</span>
                        <Counter
                            value={resources[key]}
                            onIncrement={() => onChange({ ...resources, [key]: resources[key] + 1 })}
                            onDecrement={() => onChange({ ...resources, [key]: Math.max(0, resources[key] - 1) })}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// EnergyCounters
// ---------------------------------------------------------------------------

const ENERGY_KEYS: (keyof CharacterState['energies'])[] = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];

function EnergyCounters({
    energies,
    onChange,
}: {
    energies: CharacterState['energies'];
    onChange: (updated: CharacterState['energies']) => void;
}) {
    return (
        <div className="bg-white rounded-lg shadow p-3">
            <h3 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">Color Energies</h3>
            <div className="grid grid-cols-2 gap-2">
                {ENERGY_KEYS.map(key => (
                    <div key={key} className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${COLOR_STYLES[key]} flex-shrink-0`} />
                        <span className={`text-xs font-medium w-10 capitalize ${COLOR_LABEL_STYLES[key]}`}>{key}</span>
                        <Counter
                            value={energies[key]}
                            onIncrement={() => onChange({ ...energies, [key]: energies[key] + 1 })}
                            onDecrement={() => onChange({ ...energies, [key]: Math.max(0, energies[key] - 1) })}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// ScoringTracks
// ---------------------------------------------------------------------------

const SCORING_KEYS: ScoringCategory[] = ['discovery', 'champion', 'arcana', 'fortune'];
const SCORING_LABELS: Record<ScoringCategory, string> = {
    discovery: 'Discovery',
    champion: 'Champion',
    arcana: 'Arcana',
    fortune: 'Fortune',
};

function ScoringTrack({
    category,
    value,
    onSet,
}: {
    category: ScoringCategory;
    value: number;
    onSet: (v: number) => void;
}) {
    const activeColor = SCORING_COLORS[category];

    return (
        <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold w-16 ${SCORING_LABEL_COLORS[category]}`}>
                {SCORING_LABELS[category]}
            </span>
            <div className="flex gap-0.5 flex-wrap">
                {Array.from({ length: SCORING_MAX + 1 }, (_, i) => {
                    const isMilestone = SCORING_MILESTONES.includes(i);
                    return (
                        <button
                            key={i}
                            title={isMilestone ? `Milestone at ${i}` : `${i}`}
                            onClick={() => onSet(i)}
                            className={`
                h-4 transition-colors border
                ${isMilestone ? 'w-5 rounded' : 'w-3 rounded-sm'}
                ${i > 0 && i <= value
                                    ? `${activeColor} border-transparent`
                                    : isMilestone
                                        ? 'bg-gray-200 border-gray-400 hover:bg-gray-300'
                                        : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                                }
              `}
                        />
                    );
                })}
            </div>
            <span className="text-xs text-gray-500 w-5">{value}</span>
        </div>
    );
}

function ScoringTracks({
    scoring,
    onChange,
}: {
    scoring: CharacterState['scoring'];
    onChange: (updated: CharacterState['scoring']) => void;
}) {
    return (
        <div className="bg-white rounded-lg shadow p-3">
            <h3 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">
                Scoring <span className="text-gray-400 font-normal normal-case text-xs">(◆ = milestone)</span>
            </h3>
            <div className="space-y-2">
                {SCORING_KEYS.map(cat => (
                    <ScoringTrack
                        key={cat}
                        category={cat}
                        value={scoring[cat]}
                        onSet={v => onChange({ ...scoring, [cat]: v })}
                    />
                ))}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// ClassPanel
// ---------------------------------------------------------------------------

const CLASS_NAMES: CharacterClass[] = ['Alchemist', 'Bard', 'Druid', 'Knight', 'Necromancer', 'Ranger'];
const CLASS_ICONS: Record<CharacterClass, string> = {
    Alchemist: '⚗️',
    Bard: '🎵',
    Druid: '🌿',
    Knight: '🛡️',
    Necromancer: '💀',
    Ranger: '🏹',
};

/** Black face cards (J/Q/K of ♠/♣) level up these classes */
const BLACK_FACE_CLASSES = new Set<CharacterClass>(['Alchemist', 'Necromancer', 'Ranger']);
/** Red face cards (J/Q/K of ♥/♦) level up these classes */
const RED_FACE_CLASSES = new Set<CharacterClass>(['Bard', 'Druid', 'Knight']);

function isFaceCard(value: string) {
    return value === 'J' || value === 'Q' || value === 'K';
}

function isBlackSuit(suit: string) {
    return suit === 'spades' || suit === 'clubs';
}

/** XP cost to gain one level at the given target level. */
function xpCostForLevel(targetLevel: number): number {
    if (targetLevel <= 3) return 1;
    if (targetLevel <= 6) return 2;
    return 3; // 7–9
}

/** Total XP cost to go from fromLevel to toLevel (cumulative). */
function xpCostToReach(fromLevel: number, toLevel: number): number {
    let cost = 0;
    for (let l = fromLevel + 1; l <= toLevel; l++) cost += xpCostForLevel(l);
    return cost;
}

function ClassRow({
    className,
    level,
    onLevelUpByXP,
    levelUpCard,
    onLevelUp,
    skillStates,
    onSkillStatesChange,
    character,
    onCharacterChange,
    lastDrawnValue,
    selectedCard,
    onCardPlayed,
}: {
    className: CharacterClass;
    level: number;
    onLevelUpByXP: (targetLevel: number) => void;
    levelUpCard?: CardDraw;
    onLevelUp?: () => void;
    skillStates: ClassSkillState;
    onSkillStatesChange: (updated: ClassSkillState) => void;
    character: CharacterState;
    onCharacterChange: (updated: CharacterState) => void;
    lastDrawnValue?: number | null;
    selectedCard?: CardDraw | null;
    onCardPlayed?: () => void;
}) {
    const cardLabel = levelUpCard
        ? `${levelUpCard.value}${getSuitSymbol(levelUpCard.suit)}`
        : null;
    const cardColor = levelUpCard ? getCardColor(levelUpCard.suit) : '';
    const xp = character.resources.xp;

    return (
        <div className="flex items-start gap-2 py-2 border-b border-gray-100 last:border-0">
            {/* Class name */}
            <div className="w-28 flex-shrink-0">
                <div className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <span>{CLASS_ICONS[className]}</span>
                    <span>{className}</span>
                </div>
                <div className="text-xs text-gray-400">Lv {level}</div>
                {levelUpCard && onLevelUp && (
                    <button
                        onClick={onLevelUp}
                        className="mt-1 text-xs bg-amber-500 hover:bg-amber-600 text-white px-2 py-0.5 rounded whitespace-nowrap"
                        title={`Spend ${cardLabel} to level up ${className}`}
                    >
                        ↑ Level up
                        <span className={`ml-1 font-bold ${cardColor}`}>{cardLabel}</span>
                    </button>
                )}
            </div>

            {/* Level pips (9 levels, 1–9; 0 = none) */}
            <div className="flex gap-1 mt-1 flex-wrap">
                {Array.from({ length: 9 }, (_, i) => {
                    const pip = i + 1;
                    const filled = pip <= level;
                    const cost = filled ? 0 : xpCostToReach(level, pip);
                    const affordable = !filled && xp >= cost;
                    const costLabel = filled
                        ? `Level ${pip} (gained)`
                        : affordable
                            ? `Level ${pip} — spend ${cost} XP (have ${xp})`
                            : `Level ${pip} — need ${cost} XP (have ${xp})`;
                    return (
                        <button
                            key={i}
                            title={costLabel}
                            disabled={filled || !affordable}
                            onClick={() => !filled && affordable && onLevelUpByXP(pip)}
                            className={[
                                'w-6 h-6 rounded-full border-2 text-xs font-bold transition-colors',
                                filled
                                    ? 'bg-stone-600 border-stone-600 text-white cursor-default'
                                    : affordable
                                        ? 'bg-white border-green-500 text-green-700 hover:bg-green-50 cursor-pointer'
                                        : 'bg-white border-gray-200 text-gray-300 cursor-not-allowed opacity-50',
                            ].join(' ')}
                        >
                            {filled ? pip : cost}
                        </button>
                    );
                })}
            </div>

            {/* Skill/minigame area */}
            <div className="flex-1 min-w-0 ml-2">
                <ClassSkillBoard
                    className={className}
                    level={level}
                    skillStates={skillStates}
                    onSkillStatesChange={onSkillStatesChange}
                    character={character}
                    onCharacterChange={onCharacterChange}
                    lastDrawnValue={lastDrawnValue}
                    selectedCard={selectedCard}
                    onCardPlayed={onCardPlayed}
                />
            </div>
        </div>
    );
}

function ClassPanel({
    classes,
    onChange,
    levelUpCard,
    onSpendCard,
    skillStates,
    onSkillStatesChange,
    character,
    onCharacterChange,
    lastDrawnValue,
    selectedCard,
    onCardPlayed,
}: {
    classes: CharacterState['classes'];
    onChange: (updated: CharacterState['classes']) => void;
    levelUpCard: CardDraw | undefined;
    onSpendCard: () => void;
    skillStates: ClassSkillState;
    onSkillStatesChange: (updated: ClassSkillState) => void;
    character: CharacterState;
    onCharacterChange: (updated: CharacterState) => void;
    lastDrawnValue?: number | null;
    selectedCard?: CardDraw | null;
    onCardPlayed?: () => void;
}) {
    function setLevel(className: CharacterClass, level: number) {
        onChange(classes.map(c => c.className === className ? { ...c, level } : c));
    }

    function handleLevelUpByXP(className: CharacterClass, targetLevel: number) {
        const entry = classes.find(c => c.className === className)!;
        if (targetLevel <= entry.level) return;
        const cost = xpCostToReach(entry.level, targetLevel);
        if (character.resources.xp < cost) return;
        const newClasses = classes.map(c => c.className === className ? { ...c, level: targetLevel } : c);
        onCharacterChange({
            ...character,
            classes: newClasses,
            resources: { ...character.resources, xp: character.resources.xp - cost },
        });
    }

    return (
        <div className="bg-white rounded-lg shadow p-3 h-full">
            <h3 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">Class Levels &amp; Skills</h3>
            <div className="text-xs text-gray-500 mb-2">XP available: <span className="font-semibold text-gray-700">{character.resources.xp}</span> — costs: Lv 1–3 = 1 XP · Lv 4–6 = 2 XP · Lv 7–9 = 3 XP</div>
            <div>
                {CLASS_NAMES.map(name => {
                    const entry = classes.find(c => c.className === name)!;
                    // Determine if the levelUpCard can level up this class
                    let canLevelUp = false;
                    if (levelUpCard && isFaceCard(levelUpCard.value)) {
                        const isBlack = isBlackSuit(levelUpCard.suit);
                        canLevelUp = isBlack
                            ? BLACK_FACE_CLASSES.has(name as CharacterClass)
                            : RED_FACE_CLASSES.has(name as CharacterClass);
                    }
                    return (
                        <ClassRow
                            key={name}
                            className={name}
                            level={entry.level}
                            onLevelUpByXP={targetLevel => handleLevelUpByXP(name, targetLevel)}
                            levelUpCard={canLevelUp ? levelUpCard : undefined}
                            onLevelUp={canLevelUp ? () => {
                                setLevel(name, Math.min(9, entry.level + 1));
                                onSpendCard();
                            } : undefined}
                            skillStates={skillStates}
                            onSkillStatesChange={onSkillStatesChange}
                            character={character}
                            onCharacterChange={onCharacterChange}
                            lastDrawnValue={lastDrawnValue}
                            selectedCard={selectedCard}
                            onCardPlayed={onCardPlayed}
                        />
                    );
                })}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// CharacterBoard (root)
// ---------------------------------------------------------------------------

const CharacterBoard: React.FC<CharacterBoardProps> = ({
    character,
    onChange,
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
}) => {
    // Derive the selected card from hand
    const selectedCard: CardDraw | null =
        selectedHandIndex !== null ? (hand[selectedHandIndex] ?? null) : null;

    // Face card level-up offer: only when the selected hand card is a face card
    const levelUpCard: CardDraw | undefined =
        selectedCard && isFaceCard(selectedCard.value) ? selectedCard : undefined;

    // Consume the selected hand card (used for both level-up and skill plays)
    const handleSpendCard = () => {
        if (selectedHandIndex !== null) onPlayCard(selectedHandIndex);
    };

    function update<K extends keyof CharacterState>(key: K, value: CharacterState[K]) {
        onChange({ ...character, [key]: value });
    }

    return (
        <div className="flex flex-col h-full bg-stone-100 overflow-hidden">
            <CharacterHeader
                name={character.name}
                onNameChange={n => update('name', n)}
                onRandomize={() => onChange(generateRandomCharacter())}
                onReset={() => onChange(DEFAULT_CHARACTER)}
            />

            <div className="flex flex-1 overflow-auto gap-4 p-4">
                {/* ── LEFT PANEL ── */}
                <div className="flex flex-col gap-4 w-96 flex-shrink-0">
                    <BodyDiagram
                        body={character.body}
                        wounds={character.wounds}
                        onBodyChange={newBody => {
                            const newWounds = computeWounds(newBody);
                            onChange({ ...character, body: newBody, wounds: newWounds });
                        }}
                        onWoundsChange={w => onChange({ ...character, wounds: w })}
                    />
                    <AttributeTracks
                        attributes={character.attributes}
                        onChange={a => update('attributes', a)}
                    />
                    <ResourceCounters
                        resources={character.resources}
                        onChange={r => update('resources', r)}
                    />
                    <EnergyCounters
                        energies={character.energies}
                        onChange={e => update('energies', e)}
                    />
                    <ScoringTracks
                        scoring={character.scoring}
                        onChange={s => update('scoring', s)}
                    />
                </div>

                {/* ── RIGHT PANEL ── */}
                <div className="flex-1 min-w-0 flex flex-col gap-4">
                    <div className="bg-white rounded-lg shadow p-3">
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
                            onReset={onResetDeck}
                            onDeckCountChange={onDeckCountChange}
                        />
                    </div>
                    <ClassPanel
                        classes={character.classes}
                        onChange={c => update('classes', c)}
                        levelUpCard={levelUpCard}
                        onSpendCard={handleSpendCard}
                        skillStates={character.skillStates}
                        onSkillStatesChange={ss => update('skillStates', ss)}
                        character={character}
                        onCharacterChange={onChange}
                        lastDrawnValue={selectedCard ? cardNumericValue(selectedCard.value) : null}
                        selectedCard={selectedCard}
                        onCardPlayed={handleSpendCard}
                    />
                </div>
            </div>
        </div>
    );
};

export default CharacterBoard;
