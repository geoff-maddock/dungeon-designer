import React from 'react';
import { CharacterState, BodyLocation, ScoringCategory, CharacterClass } from '../types';
import { generateRandomCharacter, getScoringMilestones } from '../utils/characterGenerator';

interface CharacterBoardProps {
    character: CharacterState;
    onChange: (updated: CharacterState) => void;
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

/** Pip slots for wounds or armor on a body location */
function BodyPips({
    count,
    filled,
    activeClass,
    onToggle,
}: {
    count: number;
    filled: number;
    activeClass: string;
    onToggle: (i: number) => void;
}) {
    return (
        <div className="flex gap-1">
            {Array.from({ length: count }, (_, i) => (
                <button
                    key={i}
                    onClick={() => onToggle(i)}
                    className={`w-4 h-4 rounded-full border-2 transition-colors ${i < filled
                            ? `${activeClass} border-transparent`
                            : 'bg-white border-gray-300 hover:border-gray-500'
                        }`}
                />
            ))}
        </div>
    );
}

// ---------------------------------------------------------------------------
// CharacterHeader
// ---------------------------------------------------------------------------

function CharacterHeader({
    name,
    onNameChange,
    onRandomize,
}: {
    name: string;
    onNameChange: (n: string) => void;
    onRandomize: () => void;
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
            <button
                onClick={onRandomize}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-1 rounded font-medium ml-auto"
            >
                🎲 Randomize
            </button>
        </header>
    );
}

// ---------------------------------------------------------------------------
// BodyDiagram
// ---------------------------------------------------------------------------

function BodyDiagram({
    body,
    onChange,
}: {
    body: BodyLocation[];
    onChange: (updated: BodyLocation[]) => void;
}) {
    function toggleWound(locName: string, i: number) {
        const updated = body.map(loc => {
            if (loc.name !== locName) return loc;
            const newWounds = i < loc.wounds ? i : i + 1;
            return { ...loc, wounds: Math.min(newWounds, loc.woundSlots) };
        });
        onChange(updated);
    }

    function toggleArmor(locName: string, i: number) {
        const updated = body.map(loc => {
            if (loc.name !== locName) return loc;
            const newArmor = i < loc.armor ? i : i + 1;
            return { ...loc, armor: Math.min(newArmor, loc.armorSlots) };
        });
        onChange(updated);
    }

    function LocRow({ loc }: { loc: BodyLocation }) {
        return (
            <div className="flex items-center gap-2 py-1">
                <span className="w-20 text-xs font-medium text-gray-700 text-right">{loc.name}</span>
                <div className="flex flex-col gap-0.5">
                    <BodyPips
                        count={loc.woundSlots}
                        filled={loc.wounds}
                        activeClass="bg-red-500"
                        onToggle={i => toggleWound(loc.name, i)}
                    />
                    <BodyPips
                        count={loc.armorSlots}
                        filled={loc.armor}
                        activeClass="bg-yellow-400"
                        onToggle={i => toggleArmor(loc.name, i)}
                    />
                </div>
            </div>
        );
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
            <div className="text-xs text-gray-400 flex gap-6 mb-1 ml-[5.5rem]">
                <span>🔴 Wounds</span>
                <span>🛡️ Armor</span>
            </div>
            {/* Simple visual body layout */}
            <div className="flex flex-col items-center gap-0">
                {/* Head */}
                <div className="mb-1">
                    <LocRow loc={headLoc} />
                </div>
                {/* Arms + Torso */}
                <div className="flex items-start gap-1">
                    <LocRow loc={lArmLoc} />
                    <LocRow loc={torsoLoc} />
                    <LocRow loc={rArmLoc} />
                </div>
                {/* Legs */}
                <div className="flex gap-4 mt-1">
                    <LocRow loc={lLegLoc} />
                    <LocRow loc={rLegLoc} />
                </div>
            </div>
        </div>
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
                ${i <= value
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

function ClassRow({
    className,
    level,
    onSet,
}: {
    className: CharacterClass;
    level: number;
    onSet: (v: number) => void;
}) {
    return (
        <div className="flex items-start gap-2 py-2 border-b border-gray-100 last:border-0">
            {/* Class name */}
            <div className="w-28 flex-shrink-0">
                <div className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <span>{CLASS_ICONS[className]}</span>
                    <span>{className}</span>
                </div>
                <div className="text-xs text-gray-400">Lv {level}</div>
            </div>

            {/* Level pips (9 levels, 1–9; 0 = none) */}
            <div className="flex gap-1 mt-1">
                {Array.from({ length: 9 }, (_, i) => (
                    <button
                        key={i}
                        title={`Level ${i + 1}`}
                        onClick={() => onSet(i + 1 === level ? 0 : i + 1)}
                        className={`w-6 h-6 rounded-full border-2 text-xs font-bold transition-colors ${i + 1 <= level
                                ? 'bg-stone-600 border-stone-600 text-white'
                                : 'bg-white border-gray-300 hover:border-gray-500 text-gray-300'
                            }`}
                    >
                        {i + 1}
                    </button>
                ))}
            </div>

            {/* Skill/minigame placeholders */}
            <div className="flex gap-2 ml-2 flex-wrap">
                {[1, 2, 3].map(slot => (
                    <div
                        key={slot}
                        className="w-20 h-16 rounded border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-xs text-gray-400 text-center"
                    >
                        Skill<br />Slot {slot}
                    </div>
                ))}
            </div>
        </div>
    );
}

function ClassPanel({
    classes,
    onChange,
}: {
    classes: CharacterState['classes'];
    onChange: (updated: CharacterState['classes']) => void;
}) {
    function setLevel(className: CharacterClass, level: number) {
        onChange(classes.map(c => c.className === className ? { ...c, level } : c));
    }

    return (
        <div className="bg-white rounded-lg shadow p-3 h-full">
            <h3 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">Class Levels &amp; Skills</h3>
            <div>
                {CLASS_NAMES.map(name => {
                    const entry = classes.find(c => c.className === name)!;
                    return (
                        <ClassRow
                            key={name}
                            className={name}
                            level={entry.level}
                            onSet={v => setLevel(name, v)}
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

const CharacterBoard: React.FC<CharacterBoardProps> = ({ character, onChange }) => {
    function update<K extends keyof CharacterState>(key: K, value: CharacterState[K]) {
        onChange({ ...character, [key]: value });
    }

    return (
        <div className="flex flex-col h-full bg-stone-100 overflow-hidden">
            <CharacterHeader
                name={character.name}
                onNameChange={n => update('name', n)}
                onRandomize={() => onChange(generateRandomCharacter())}
            />

            <div className="flex flex-1 overflow-auto gap-4 p-4">
                {/* ── LEFT PANEL ── */}
                <div className="flex flex-col gap-4 w-96 flex-shrink-0">
                    <BodyDiagram
                        body={character.body}
                        onChange={b => update('body', b)}
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
                <div className="flex-1 min-w-0">
                    <ClassPanel
                        classes={character.classes}
                        onChange={c => update('classes', c)}
                    />
                </div>
            </div>
        </div>
    );
};

export default CharacterBoard;
