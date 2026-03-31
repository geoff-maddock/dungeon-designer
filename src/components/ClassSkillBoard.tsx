import React, { useState, useContext, createContext } from 'react';
import {
  CharacterClass,
  CharacterState,
  ClassSkillState,
  OathType,
  CardDraw,
} from '../types';
import {
  SkillSlot,
  isSkillUnlocked,
  SKILL_UNLOCK_LEVELS,
  cardBand,
  cardNumericValue,
  soulRingPosition,
  applyReward,
  canPlaceOnHonorRow,
  canPlaceOnMightRow,
  canPlaceFortressTier,
  nextOpenSlot,
  activeUndeadCount,
  songbookZone,
  crescendoReward,
  POTION_RACK_CONFIG,
  TRANSMUTATION_LADDER_CONFIG,
  VOLATILE_FLASK_CONFIG,
  SONGBOOK_CONFIG,
  CRESCENDO_CONFIG,
  AUDIENCE_METER_CONFIG,
  SACRED_GROVE_CONFIG,
  BEAST_FORMS_CONFIG,
  SEASON_WHEEL_CONFIG,
  ARMS_AND_OATH_ROWS_CONFIG,
  OATH_BOARD_CONFIG,
  FORTRESS_CONFIG,
  GRAVE_LEDGER_CONFIG,
  CRYPT_CAPACITY_CONFIG,
  SOUL_RINGS_CONFIG,
  TRAIL_MAP_NODES,
  QUARRY_BOARD_CONFIG,
  SURVIVAL_KIT_CONFIG,
} from '../utils/skillLogic';

// Context that lets ValueInput read the selected hand card without prop drilling.
interface SelectedCardCtxValue {
  selectedCard: CardDraw | null;
  onCardPlayed: () => void;
}
const SelectedCardContext = createContext<SelectedCardCtxValue>({
  selectedCard: null,
  onCardPlayed: () => {},
});

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

interface ClassSkillBoardProps {
  className: CharacterClass;
  level: number;
  skillStates: ClassSkillState;
  onSkillStatesChange: (updated: ClassSkillState) => void;
  character: CharacterState;
  onCharacterChange: (updated: CharacterState) => void;
  lastDrawnValue?: number | null;
  selectedCard?: CardDraw | null;
  onCardPlayed?: () => void;
}

function LockedSkillSlot({ slot }: { slot: SkillSlot }) {
  const unlocksAt = SKILL_UNLOCK_LEVELS[slot - 1];
  return (
    <div className="min-w-36 rounded border-2 border-dashed border-gray-200 bg-gray-50
                    flex flex-col items-center justify-center text-xs text-gray-400 text-center p-3 gap-1">
      <span className="text-lg">🔒</span>
      <span>Unlocks at Level {unlocksAt}</span>
    </div>
  );
}

function SkillBox({
  title,
  rules,
  children,
  className = '',
}: {
  title: string;
  rules?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [showRules, setShowRules] = useState(false);
  return (
    <div className={`rounded border border-gray-200 bg-white p-2 min-w-44 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-bold text-gray-600 uppercase tracking-wide">{title}</div>
        {rules && (
          <div className="relative flex-shrink-0 ml-1">
            <button
              onMouseEnter={() => setShowRules(true)}
              onMouseLeave={() => setShowRules(false)}
              className="w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-500
                         text-[10px] font-bold flex items-center justify-center cursor-help leading-none"
              aria-label="Show rules"
            >?</button>
            {showRules && (
              <div className="absolute right-0 top-5 z-50 w-64 bg-white border border-gray-300
                              rounded shadow-xl p-2 text-[10px] text-gray-700 leading-snug whitespace-pre-line">
                {rules}
              </div>
            )}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

/** Shared value input + assign button pattern.
 *  When a card is selected (via SelectedCardContext), its numeric value is used
 *  as a read-only input and the button consumes the card via onCardPlayed(). */
function ValueInput({
  defaultValue,
  onAssign,
  label = 'Assign',
  disabled = false,
}: {
  defaultValue?: number | null;
  onAssign: (v: number) => void;
  label?: string;
  disabled?: boolean;
}) {
  const { selectedCard, onCardPlayed } = useContext(SelectedCardContext);
  const lockedValue = selectedCard ? cardNumericValue(selectedCard.value) : null;
  const isFaceCardSelected = selectedCard !== null && lockedValue === null;

  const [val, setVal] = useState<number>(defaultValue ?? 5);

  // Keep local state in sync when defaultValue (lastDrawnValue) changes
  React.useEffect(() => {
    if (defaultValue != null && lockedValue === null) setVal(defaultValue);
  }, [defaultValue, lockedValue]);

  if (isFaceCardSelected) {
    return (
      <div className="flex items-center gap-1 mt-1">
        <span className="text-xs text-amber-600 italic">Face card — use Level Up ↑</span>
      </div>
    );
  }

  const activeVal = lockedValue ?? val;

  return (
    <div className="flex items-center gap-1 mt-1">
      <input
        type="number"
        min={2}
        max={10}
        value={activeVal}
        readOnly={lockedValue !== null}
        onChange={e => {
          if (lockedValue === null) setVal(Math.min(10, Math.max(2, parseInt(e.target.value) || 2)));
        }}
        className={`w-12 text-sm border rounded px-1 py-0.5 text-center ${lockedValue !== null ? 'bg-indigo-50 border-indigo-300 font-semibold' : ''}`}
      />
      <button
        onClick={() => { onAssign(activeVal); if (lockedValue !== null) onCardPlayed(); }}
        disabled={disabled}
        className={`text-xs disabled:opacity-40 text-white px-2 py-0.5 rounded ${lockedValue !== null ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-stone-600 hover:bg-stone-700'}`}
      >
        {lockedValue !== null ? `Play ${activeVal}` : label}
      </button>
    </div>
  );
}

function FillDots({
  filled,
  total,
  activeColor = 'bg-stone-600',
}: {
  filled: number;
  total: number;
  activeColor?: string;
}) {
  return (
    <div className="flex gap-0.5 flex-wrap">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`inline-block w-3 h-3 rounded-full border ${i < filled ? `${activeColor} border-transparent` : 'bg-white border-gray-300'
            }`}
        />
      ))}
    </div>
  );
}

function RewardToast({ message }: { message: string }) {
  return (
    <div className="text-[10px] font-semibold text-emerald-600 mt-1">{message}</div>
  );
}

// ---------------------------------------------------------------------------
// ALCHEMIST
// ---------------------------------------------------------------------------

function PotionRackSkill({
  ss, onSS, character, onChar, lastVal,
}: {
  ss: ClassSkillState; onSS: (u: ClassSkillState) => void;
  character: CharacterState; onChar: (u: CharacterState) => void;
  lastVal?: number | null;
}) {
  const [msg, setMsg] = useState('');
  const state = ss.potionRack;

  function assign(cardVal: number) {
    const band = cardBand(cardVal);
    const rowIdx = ['low', 'mid', 'high'].indexOf(band);
    if (state.rowsFilled[rowIdx] >= 3) { setMsg('Row full!'); return; }
    const newFilled = [...state.rowsFilled] as [number, number, number];
    newFilled[rowIdx] += 1;
    const complete = newFilled[rowIdx] === 3;
    const newSS = { ...ss, potionRack: { rowsFilled: newFilled } };
    if (complete) {
      const reward = POTION_RACK_CONFIG.rows[rowIdx].reward;
      onChar({ ...applyReward(character, reward), skillStates: newSS });
      setMsg(`Potion brewed! → ${POTION_RACK_CONFIG.rows[rowIdx].label}`);
    } else {
      onSS(newSS);
      setMsg(`${POTION_RACK_CONFIG.rows[rowIdx].label}: slot filled`);
    }
  }

  function reset(rowIdx: number) {
    const newFilled = [...state.rowsFilled] as [number, number, number];
    newFilled[rowIdx] = 0;
    onSS({ ...ss, potionRack: { rowsFilled: newFilled } });
    setMsg('');
  }

  return (
    <SkillBox title="Potion Rack" rules={"Mechanism: Assign any card 2–10 at no cost. The card's band determines which brew row it fills:\n• Low (2–4) → Minor row\n• Mid (5–7) → Greater row\n• High (8–10) → Grand row\n\nCost: None.\n\nReward (fill all 3 slots in a row):\n• Minor complete → +1 Supply\n• Greater complete → +1 Mana +1 Gold\n• Grand complete → +1 Arcana\n\nCompleted rows reset automatically so you can brew again."}>
      {POTION_RACK_CONFIG.rows.map((row, i) => (
        <div key={row.band} className="flex items-center gap-2 mb-1">
          <span className="text-[10px] w-20 text-gray-500">{row.label}</span>
          <FillDots filled={state.rowsFilled[i]} total={3} activeColor="bg-amber-500" />
          {state.rowsFilled[i] === 3 && (
            <button onClick={() => reset(i)} className="text-[10px] text-gray-400 hover:text-red-500">↺</button>
          )}
        </div>
      ))}
      <ValueInput defaultValue={lastVal} onAssign={assign} label="Brew" />
      {msg && <RewardToast message={msg} />}
    </SkillBox>
  );
}

function TransmutationLadderSkill({
  ss, onSS, character, onChar, lastVal,
}: {
  ss: ClassSkillState; onSS: (u: ClassSkillState) => void;
  character: CharacterState; onChar: (u: CharacterState) => void;
  lastVal?: number | null;
}) {
  const [msg, setMsg] = useState('');
  const state = ss.transmutationLadder;
  const openIdx = nextOpenSlot(state.steps);
  const prevVal = openIdx > 0 ? (state.steps[openIdx - 1] ?? null) : null;

  function assign(cardVal: number) {
    if (openIdx === -1) { setMsg('Ladder full — reset first'); return; }
    const ascending = prevVal === null || cardVal >= prevVal;
    let updatedChar = character;
    if (!ascending) {
      if (character.resources.mana < 1) { setMsg('Need 1 Mana to place lower value!'); return; }
      updatedChar = applyReward(character, { mana: -1 });
    } else {
      updatedChar = applyReward(character, TRANSMUTATION_LADDER_CONFIG.stepReward);
    }
    const newSteps = [...state.steps] as (number | null)[];
    newSteps[openIdx] = cardVal;
    let newSS: ClassSkillState;
    if (openIdx === 4) {
      updatedChar = applyReward(updatedChar, TRANSMUTATION_LADDER_CONFIG.cashOutReward);
      newSS = { ...ss, transmutationLadder: { steps: [null, null, null, null, null] } };
      setMsg('Ladder complete! Cash out!');
    } else {
      newSS = { ...ss, transmutationLadder: { steps: newSteps } };
      setMsg(ascending ? `Step ${openIdx + 1}: +1 Gold` : `Step ${openIdx + 1}: −1 Mana`);
    }
    onChar({ ...updatedChar, skillStates: newSS });
  }

  function reset() {
    onSS({ ...ss, transmutationLadder: { steps: [null, null, null, null, null] } });
    setMsg('');
  }

  return (
    <SkillBox title="Transmutation Ladder" rules={"Mechanism: Fill 5 ladder steps with card values in any order.\n\nCost:\n• Placing a value ≥ the previous step → free, earns +1 Gold.\n• Placing a value < the previous step → costs 1 Mana. You cannot place a lower value if you have 0 Mana.\n\nReward per step: +1 Gold (ascending only).\nReward on completion (all 5 steps): +2 Gold +1 Arcana, then all steps reset."}>
      <div className="flex gap-1 items-end mb-1">
        {state.steps.map((v, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold border-2 ${v !== null ? 'bg-amber-400 border-amber-600 text-white' : 'bg-white border-gray-300 text-gray-300'
              }`}>
              {v ?? i + 1}
            </div>
            <div className="text-[9px] text-gray-400">{i + 1}</div>
          </div>
        ))}
        <button onClick={reset} className="text-[10px] text-gray-400 hover:text-red-500 ml-1">↺</button>
      </div>
      {prevVal !== null && (
        <div className="text-[10px] text-gray-500">Need ≥ {prevVal} (or pay 1 Mana)</div>
      )}
      <ValueInput defaultValue={lastVal} onAssign={assign} />
      {msg && <RewardToast message={msg} />}
    </SkillBox>
  );
}

function VolatileFlaskSkill({
  ss, onSS, character, onChar, lastVal,
}: {
  ss: ClassSkillState; onSS: (u: ClassSkillState) => void;
  character: CharacterState; onChar: (u: CharacterState) => void;
  lastVal?: number | null;
}) {
  const [msg, setMsg] = useState('');
  const [mode, setMode] = useState<'mana' | 'arcana'>('mana');
  const v = ss.volatileFlask.storedValue;

  function storeValue(cardVal: number) {
    if (v !== null) { setMsg('Flask occupied — detonate first'); return; }
    onSS({ ...ss, volatileFlask: { storedValue: cardVal } });
    setMsg(`${cardVal} stored`);
  }

  function detonate() {
    if (v === null) { setMsg('Flask is empty'); return; }
    const reward = mode === 'mana'
      ? VOLATILE_FLASK_CONFIG.manaReward(v)
      : VOLATILE_FLASK_CONFIG.arcanaReward(v);
    const newSS = { ...ss, volatileFlask: { storedValue: null } };
    onChar({ ...applyReward(character, reward), skillStates: newSS });
    const gain = mode === 'mana' ? `+${Math.ceil(v / 2)} Mana` : `+${Math.round(v / 3)} Arcana`;
    setMsg(`Detonated! ${gain}`);
  }

  function idleCollect() {
    onChar(applyReward(character, VOLATILE_FLASK_CONFIG.idleReward));
    setMsg('+1 Arcana (idle)');
  }

  return (
    <SkillBox title="Volatile Flask" rules={"Mechanism: Store one card value in the flask at no cost. If the flask already holds a value, assigning a new one replaces it (no detonation, no refund). Then choose when to detonate:\n• Detonate for Mana → gain ⌈value ÷ 2⌉ Mana (e.g. 7 → 4 Mana)\n• Detonate for Arcana → gain round(value ÷ 3) Arcana (e.g. 9 → 3 Arcana)\n\nCost: None to store or detonate.\n\nIf you end the round without detonating, the flask auto-grants +1 Arcana and clears itself."}>
      <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center mx-auto mb-2 text-lg font-bold ${v !== null ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-dashed border-gray-300 text-gray-300'
        }`}>
        {v ?? '–'}
      </div>
      <ValueInput defaultValue={lastVal} onAssign={storeValue} label="Store" disabled={v !== null} />
      <div className="flex gap-1 mt-1">
        <button
          onClick={() => setMode('mana')}
          className={`text-[10px] px-1.5 py-0.5 rounded border ${mode === 'mana' ? 'bg-blue-100 border-blue-400 text-blue-700' : 'border-gray-300 text-gray-500'}`}
        >Mana</button>
        <button
          onClick={() => setMode('arcana')}
          className={`text-[10px] px-1.5 py-0.5 rounded border ${mode === 'arcana' ? 'bg-violet-100 border-violet-400 text-violet-700' : 'border-gray-300 text-gray-500'}`}
        >Arcana</button>
        <button onClick={detonate} disabled={v === null}
          className="text-[10px] bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white px-2 py-0.5 rounded">
          Detonate
        </button>
      </div>
      <button onClick={idleCollect} className="text-[10px] text-gray-400 hover:text-emerald-600 mt-1">+1 Arcana (idle)</button>
      {msg && <RewardToast message={msg} />}
    </SkillBox>
  );
}

// ---------------------------------------------------------------------------
// BARD
// ---------------------------------------------------------------------------

function SongbookSkill({
  ss, onSS, character, onChar, lastVal,
}: {
  ss: ClassSkillState; onSS: (u: ClassSkillState) => void;
  character: CharacterState; onChar: (u: CharacterState) => void;
  lastVal?: number | null;
}) {
  const [msg, setMsg] = useState('');
  const { ballad, chorus } = ss.songbook;

  function addToArea(area: 'ballad' | 'chorus', cardVal: number) {
    const current = area === 'ballad' ? ballad : chorus;
    const newTotal = current + cardVal;
    const zone = songbookZone(newTotal);
    const newSkillStates = { ...ss, songbook: { ...ss.songbook, [area]: newTotal } };
    let updatedChar: CharacterState = { ...character, skillStates: newSkillStates };
    if (zone.cost) updatedChar = applyReward(updatedChar, { mana: -(zone.cost.mana ?? 0) });
    if (zone.reward && Object.keys(zone.reward).length > 0) updatedChar = applyReward(updatedChar, zone.reward);
    onChar(updatedChar);
    const zoneLabel = zone.label;
    setMsg(`${area === 'ballad' ? 'Ballad' : 'Chorus'} total: ${newTotal} — ${zoneLabel}`);
  }

  function resetArea(area: 'ballad' | 'chorus') {
    onSS({ ...ss, songbook: { ...ss.songbook, [area]: 0 } });
    setMsg('');
  }

  function areaColor(total: number) {
    const zone = songbookZone(total);
    if (zone.label === 'Sweet Spot') return 'text-emerald-600 font-bold';
    if (zone.label === 'Strained') return 'text-red-500 font-bold';
    return 'text-gray-500';
  }

  return (
    <SkillBox title="Songbook" rules={"Mechanism: Two running number totals (Ballad and Chorus). Add any card value 2–10 to either area at no cost. Reset either total to 0 at any time for free.\n\nCost: None.\n\nReward based on the total in each area:\n• 0–9 (Weak) → +1 Supply\n• 10–18 (Sweet Spot) → +1 Champion\n• 19+ (Strained) → –1 Mana (penalty)\n\nThe Sweet Spot also counts toward the Audience Meter."}>
      {(['ballad', 'chorus'] as const).map(area => {
        const total = area === 'ballad' ? ballad : chorus;
        return (
          <div key={area} className="flex items-center gap-2 mb-1">
            <span className="text-[10px] w-12 capitalize text-gray-500">{area}</span>
            <span className={`text-sm font-bold w-8 text-center ${areaColor(total)}`}>{total}</span>
            <button
              onClick={() => addToArea(area, lastVal ?? 5)}
              className="text-[10px] bg-purple-100 hover:bg-purple-200 text-purple-700 px-1.5 py-0.5 rounded"
            >
              +{lastVal ?? '?'}
            </button>
            <button onClick={() => resetArea(area)} className="text-[10px] text-gray-400 hover:text-red-500">↺</button>
          </div>
        );
      })}
      <div className="text-[9px] text-gray-400 mt-1">
        {SONGBOOK_CONFIG.map(z => `${z.minTotal}–${z.maxTotal}: ${z.label}`).join(' | ')}
      </div>
      {msg && <RewardToast message={msg} />}
    </SkillBox>
  );
}

function CrescendoSkill({
  ss, onSS, character, onChar, lastVal,
}: {
  ss: ClassSkillState; onSS: (u: ClassSkillState) => void;
  character: CharacterState; onChar: (u: CharacterState) => void;
  lastVal?: number | null;
}) {
  const [msg, setMsg] = useState('');
  const [target, setTarget] = useState(0);
  const { columns, locked } = ss.crescendo;

  function addNote(colIdx: number, cardVal: number) {
    if (locked[colIdx]) { setMsg('Column locked — pay 1 Gold to unlock'); return; }
    if (columns[colIdx].length >= 4) { setMsg('Column full — Perform or clear'); return; }
    const newCols = columns.map((c, i) => i === colIdx ? [...c, cardVal] : c) as [number[], number[], number[]];
    onSS({ ...ss, crescendo: { ...ss.crescendo, columns: newCols } });
    setMsg(`Note added to column ${String.fromCharCode(65 + colIdx)}`);
  }

  function perform(colIdx: number) {
    const notes = columns[colIdx];
    if (notes.length < 2) { setMsg('Need at least 2 notes to perform'); return; }
    const sum = notes.reduce((a, b) => a + b, 0);
    const reward = crescendoReward(sum);
    const newCols = columns.map((c, i) => i === colIdx ? [] : c) as [number[], number[], number[]];
    const newLocked = locked.map((l, i) => i === colIdx ? true : l) as [boolean, boolean, boolean];
    const newAudience = Math.min(AUDIENCE_METER_CONFIG.max, ss.audienceMeter.audience + 1);
    const newSS = { ...ss, crescendo: { columns: newCols, locked: newLocked }, audienceMeter: { audience: newAudience } };
    onChar({ ...applyReward(character, reward), skillStates: newSS });
    setMsg(`Performed column ${String.fromCharCode(65 + colIdx)}! Sum ${sum}`);
  }

  function unlock(colIdx: number) {
    if (character.resources.gold < 1) { setMsg('Need 1 Gold'); return; }
    const newLocked = locked.map((l, i) => i === colIdx ? false : l) as [boolean, boolean, boolean];
    const newSS = { ...ss, crescendo: { ...ss.crescendo, locked: newLocked } };
    onChar({ ...applyReward(character, { gold: -1 }), skillStates: newSS });
    setMsg('Column unlocked');
  }

  return (
    <SkillBox title="Crescendo" rules={"Mechanism: Three song columns (A/B/C), up to 4 notes each. Add any card value 2–10 to any unlocked column at no cost.\n\nPerform a column (requires 2+ notes, column must be unlocked):\n\nCost: None to perform.\nReward based on the column sum:\n• Sum ≤ 10 → +1 Champion\n• Sum 11–18 → +1 Champion +1 Supply\n• Sum 19+ → +2 Champion\n\nPerforming locks the column (notes are cleared). To use it again, spend 1 Gold to unlock it.\n\nPerforming also advances the Audience Meter by 1."}>
      <div className="flex gap-1 mb-1">
        {(['A', 'B', 'C'] as const).map((name, i) => (
          <div key={name} className="flex-1 flex flex-col items-center">
            <div className="text-[10px] font-bold text-gray-500 mb-0.5">{name}</div>
            <div className={`w-full min-h-12 rounded border-2 p-0.5 flex flex-col gap-0.5 ${locked[i] ? 'border-gray-300 bg-gray-100' : 'border-purple-300 bg-purple-50'
              }`}>
              {columns[i].map((v, j) => (
                <div key={j} className="text-[10px] text-center bg-purple-200 rounded font-semibold">{v}</div>
              ))}
            </div>
            <div className="flex gap-0.5 mt-0.5">
              {!locked[i] ? (
                <>
                  <button onClick={() => addNote(i, lastVal ?? 5)}
                    className="text-[10px] bg-purple-100 hover:bg-purple-200 text-purple-700 px-1 rounded">+{lastVal ?? '?'}</button>
                  {columns[i].length >= 2 && (
                    <button onClick={() => perform(i)}
                      className="text-[10px] bg-purple-600 hover:bg-purple-700 text-white px-1 rounded">▶</button>
                  )}
                </>
              ) : (
                <button onClick={() => unlock(i)}
                  className="text-[10px] bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-1 rounded">🔓1g</button>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-gray-500">Target col:</span>
        {['A', 'B', 'C'].map((n, i) => (
          <button key={n} onClick={() => setTarget(i)}
            className={`text-[10px] px-1.5 py-0.5 rounded border ${target === i ? 'bg-purple-600 text-white border-purple-700' : 'border-gray-300 text-gray-500'}`}>
            {n}
          </button>
        ))}
      </div>
      {msg && <RewardToast message={msg} />}
    </SkillBox>
  );
}

function AudienceMeterSkill({
  ss, onSS, character, onChar,
}: {
  ss: ClassSkillState; onSS: (u: ClassSkillState) => void;
  character: CharacterState; onChar: (u: CharacterState) => void;
}) {
  const [msg, setMsg] = useState('');
  const { audience } = ss.audienceMeter;

  function gain() {
    if (audience >= AUDIENCE_METER_CONFIG.max) {
      const newSS = { ...ss, audienceMeter: { audience: 0 } };
      onChar({ ...applyReward(character, { scoring: { champion: 2 } }), skillStates: newSS });
      setMsg('Acclaim! +2 Champion. Reset.');
      return;
    }
    const newAud = audience + 1;
    onSS({ ...ss, audienceMeter: { audience: newAud } });
    const milestone = AUDIENCE_METER_CONFIG.milestones.find(m => m.threshold === newAud);
    setMsg(milestone ? milestone.label : `Audience: ${newAud}`);
  }

  return (
    <SkillBox title="Audience Meter" rules={"Mechanism: A 10-step meter that fills passively. No direct cost to advance it.\n\nGain +1 Audience when:\n• A Songbook area hits the Sweet Spot (total 10–18)\n• You Perform a Crescendo column\n\nMilestone rewards:\n• 5 Audience → once per round, draw one extra card from the deck and use its value in any skill for free (the extra draw does not consume a regular turn action)\n• 10 Audience → +2 Champion, then reset meter to 0"}>
      <FillDots filled={audience} total={AUDIENCE_METER_CONFIG.max} activeColor="bg-purple-500" />
      <div className="text-[10px] text-gray-500 mt-1">{audience} / {AUDIENCE_METER_CONFIG.max}</div>
      <button onClick={gain}
        className="mt-1 text-xs bg-purple-600 hover:bg-purple-700 text-white px-2 py-0.5 rounded">
        {audience >= AUDIENCE_METER_CONFIG.max ? '🎊 Cash Out' : '+1 Audience'}
      </button>
      {msg && <RewardToast message={msg} />}
    </SkillBox>
  );
}

// ---------------------------------------------------------------------------
// DRUID
// ---------------------------------------------------------------------------

function SacredGroveSkill({
  ss, onSS, character, onChar, lastVal,
}: {
  ss: ClassSkillState; onSS: (u: ClassSkillState) => void;
  character: CharacterState; onChar: (u: CharacterState) => void;
  lastVal?: number | null;
}) {
  const [msg, setMsg] = useState('');
  const state = ss.sacredGrove;

  function assign(cardVal: number) {
    const band = cardBand(cardVal);
    const zoneIdx = SACRED_GROVE_CONFIG.findIndex(z => z.band === band);
    const zone = SACRED_GROVE_CONFIG[zoneIdx];
    if (state.zonesFilled[zoneIdx] >= zone.slots) { setMsg(`${zone.label} zone full!`); return; }
    const newFilled = [...state.zonesFilled] as [number, number, number];
    newFilled[zoneIdx] += 1;
    const complete = newFilled[zoneIdx] === zone.slots;
    const newSS = { ...ss, sacredGrove: { zonesFilled: newFilled } };
    if (complete) {
      onChar({ ...applyReward(character, zone.reward), skillStates: newSS });
      setMsg(`${zone.label} complete!`);
    } else {
      onSS(newSS);
      setMsg(`${zone.label}: ${newFilled[zoneIdx]}/${zone.slots}`);
    }
  }

  function reset(i: number) {
    const newFilled = [...state.zonesFilled] as [number, number, number];
    newFilled[i] = 0;
    onSS({ ...ss, sacredGrove: { zonesFilled: newFilled } });
  }

  return (
    <SkillBox title="Sacred Grove" rules={"Mechanism: Three terrain zones (Forest / Water / Stone), 4 slots each. Assign any card; its band determines which zone fills.\n\nCard band → zone:\n• Low (2–4) → Forest\n• Mid (5–7) → Water\n• High (8–10) → Stone\n\nCost: None to assign.\n\nReward (fill all 4 slots in a zone):\n• Forest complete → +2 Supply\n• Water complete → +2 Mana\n• Stone complete → +1 Arcana +1 Discovery\n\nCompleted zones reset automatically."}>
      {SACRED_GROVE_CONFIG.map((zone, i) => (
        <div key={zone.band} className="flex items-center gap-2 mb-1">
          <span className="text-[10px] w-14 text-gray-500">{zone.label}</span>
          <FillDots filled={state.zonesFilled[i]} total={zone.slots} activeColor="bg-green-500" />
          {state.zonesFilled[i] === zone.slots && (
            <button onClick={() => reset(i)} className="text-[10px] text-gray-400 hover:text-red-500">↺</button>
          )}
        </div>
      ))}
      <ValueInput defaultValue={lastVal} onAssign={assign} label="Plant" />
      {msg && <RewardToast message={msg} />}
    </SkillBox>
  );
}

function BeastFormsSkill({
  ss, onSS, character, onChar, lastVal,
}: {
  ss: ClassSkillState; onSS: (u: ClassSkillState) => void;
  character: CharacterState; onChar: (u: CharacterState) => void;
  lastVal?: number | null;
}) {
  const [msg, setMsg] = useState('');
  const forms = ['wolf', 'bear', 'hawk'] as const;

  function awaken(formIdx: number, cardVal: number) {
    const cfg = BEAST_FORMS_CONFIG[formIdx];
    if (cardVal < cfg.valueBandMin || cardVal > cfg.valueBandMax) {
      setMsg(`${cfg.name} needs a ${cfg.valueBandMin}–${cfg.valueBandMax} card`);
      return;
    }
    const formKey = forms[formIdx];
    if (ss.beastForms[formKey]) { setMsg(`${cfg.name} already active`); return; }
    // Check resource cost
    const cost = cfg.resourceCost;
    if (cost.supplies && character.resources.supplies < cost.supplies) { setMsg(`Need ${cost.supplies} Supply`); return; }
    if (cost.mana && character.resources.mana < cost.mana) { setMsg(`Need ${cost.mana} Mana`); return; }
    if (cost.gold && character.resources.gold < cost.gold) { setMsg(`Need ${cost.gold} Gold`); return; }
    const newSS = { ...ss, beastForms: { ...ss.beastForms, [formKey]: true } };
    onChar({ ...applyReward(character, {
      supplies: cost.supplies ? -cost.supplies : undefined,
      mana: cost.mana ? -cost.mana : undefined,
      gold: cost.gold ? -cost.gold : undefined,
    }), skillStates: newSS });
    setMsg(`${cfg.name} awakened!`);
  }

  function dismiss(formKey: typeof forms[number]) {
    onSS({ ...ss, beastForms: { ...ss.beastForms, [formKey]: false } });
    setMsg('Form dismissed');
  }

  return (
    <SkillBox title="Beast Forms" rules={"Mechanism: Assign a card in the form's value range and pay the activation cost to gain that form's passive effect.\n\n• Wolf (card 2–5)\n  Cost: –1 Supply\n  Reward: passive +1 Brawn bonus in all combat rolls\n• Bear (card 4–7)\n  Cost: –1 Mana\n  Reward: passive +1 temporary armor slot this round\n• Hawk (card 6–10)\n  Cost: –1 Gold\n  Reward: immediately draw 1 extra card and use its value in any skill\n\nOnly one form active per type. Dismissing an active form is free and returns nothing. Forms persist until dismissed."}>
      {forms.map((formKey, i) => {
        const cfg = BEAST_FORMS_CONFIG[i];
        const active = ss.beastForms[formKey];
        return (
          <div key={formKey} className={`flex items-center gap-1 mb-1.5 p-1 rounded ${active ? 'bg-green-50 border border-green-300' : 'bg-gray-50 border border-gray-200'}`}>
            <div className="flex-1">
              <div className="text-[10px] font-semibold">{cfg.name}</div>
              <div className="text-[9px] text-gray-400">{cfg.passiveLabel}</div>
              <div className="text-[9px] text-gray-400">{cfg.valueBandMin}–{cfg.valueBandMax} + cost</div>
            </div>
            {active ? (
              <button onClick={() => dismiss(formKey)}
                className="text-[10px] bg-red-100 hover:bg-red-200 text-red-700 px-1.5 py-0.5 rounded">Dismiss</button>
            ) : (
              <button onClick={() => awaken(i, lastVal ?? 5)}
                className="text-[10px] bg-green-100 hover:bg-green-200 text-green-700 px-1.5 py-0.5 rounded">Awaken</button>
            )}
          </div>
        );
      })}
      {msg && <RewardToast message={msg} />}
    </SkillBox>
  );
}

function SeasonWheelSkill({
  ss, onSS, character, onChar, lastVal,
}: {
  ss: ClassSkillState; onSS: (u: ClassSkillState) => void;
  character: CharacterState; onChar: (u: CharacterState) => void;
  lastVal?: number | null;
}) {
  const [msg, setMsg] = useState('');
  const { segmentsFilled } = ss.seasonWheel;
  const segments = SEASON_WHEEL_CONFIG.segments;

  function advance(cardVal: number) {
    if (cardVal < 5 || cardVal > 7) { setMsg('Season Wheel needs a mid card (5–7)'); return; }
    const newFilled = segmentsFilled + 1;
    const gainedSeason = SEASON_WHEEL_CONFIG.segments[segmentsFilled % 4];
    let updatedChar = applyReward(character, gainedSeason.reward);
    let newSS: ClassSkillState;
    if (newFilled === 4) {
      updatedChar = applyReward(updatedChar, SEASON_WHEEL_CONFIG.cycleReward);
      newSS = { ...ss, seasonWheel: { segmentsFilled: 0 } };
      setMsg(`Cycle complete! +2 Arcana`);
    } else {
      newSS = { ...ss, seasonWheel: { segmentsFilled: newFilled } };
      setMsg(`${gainedSeason.name} triggered!`);
    }
    onChar({ ...updatedChar, skillStates: newSS });
  }

  return (
    <SkillBox title="Season Wheel" rules={"Mechanism: A 4-segment wheel cycling Spring → Summer → Autumn → Winter.\n\nOnly Mid cards (5–7) can advance the wheel. Low (2–4) or High (8–10) cards cannot be assigned here. Assign a qualifying Mid card to advance one segment.\n\nCost: None.\n\nReward: each newly unlocked segment grants a once-per-round passive bonus:\n• Spring → +1 Supply per round\n• Summer → +1 Mana per round\n• Autumn → +1 Gold per round\n• Winter → +1 Discovery per round\n\nComplete all 4 segments (full cycle) → +2 Arcana, then restart from Spring. Previously unlocked bonuses are lost on reset."}>
      <div className="flex gap-1 mb-1">
        {segments.map((seg, i) => (
          <div key={seg.name} className={`flex-1 rounded p-1 text-center border ${i < segmentsFilled ? 'bg-green-100 border-green-400' : 'bg-white border-gray-200'
            }`}>
            <div className="text-[9px] font-semibold">{seg.name.slice(0, 3)}</div>
          </div>
        ))}
      </div>
      <ValueInput defaultValue={lastVal} onAssign={advance} label="Advance (5–7)" />
      {msg && <RewardToast message={msg} />}
    </SkillBox>
  );
}

// ---------------------------------------------------------------------------
// KNIGHT
// ---------------------------------------------------------------------------

function ArmsAndOathRowsSkill({
  ss, onSS, character, onChar, lastVal,
}: {
  ss: ClassSkillState; onSS: (u: ClassSkillState) => void;
  character: CharacterState; onChar: (u: CharacterState) => void;
  lastVal?: number | null;
}) {
  const [msg, setMsg] = useState('');
  const state = ss.armsAndOathRows;

  function placeHonor(cardVal: number) {
    if (!canPlaceOnHonorRow(state, cardVal)) { setMsg('Honor Row needs a higher value!'); return; }
    const idx = nextOpenSlot(state.honorRow);
    if (idx === -1) { setMsg('Honor Row full'); return; }
    const newRow = [...state.honorRow] as (number | null)[];
    newRow[idx] = cardVal;
    const complete = newRow.every(v => v !== null);
    let updatedChar = applyReward(character, ARMS_AND_OATH_ROWS_CONFIG.honorStepReward);
    let newSS: ClassSkillState;
    if (complete) {
      updatedChar = applyReward(updatedChar, ARMS_AND_OATH_ROWS_CONFIG.rowCompleteReward);
      newSS = { ...ss, armsAndOathRows: { ...state, honorRow: [null, null, null, null, null] } };
      setMsg('Honor Row complete! +2 Champion');
    } else {
      newSS = { ...ss, armsAndOathRows: { ...state, honorRow: newRow } };
      setMsg('+1 Champion');
    }
    onChar({ ...updatedChar, skillStates: newSS });
  }

  function placeMight(cardVal: number) {
    if (!canPlaceOnMightRow(state, cardVal)) { setMsg('Might Row needs a lower value!'); return; }
    const idx = nextOpenSlot(state.mightRow);
    if (idx === -1) { setMsg('Might Row full'); return; }
    const newRow = [...state.mightRow] as (number | null)[];
    newRow[idx] = cardVal;
    const complete = newRow.every(v => v !== null);
    let updatedChar = applyReward(character, ARMS_AND_OATH_ROWS_CONFIG.mightStepReward);
    let newSS: ClassSkillState;
    if (complete) {
      updatedChar = applyReward(updatedChar, ARMS_AND_OATH_ROWS_CONFIG.rowCompleteReward);
      newSS = { ...ss, armsAndOathRows: { ...state, mightRow: [null, null, null, null, null] } };
      setMsg('Might Row complete! +2 Champion');
    } else {
      newSS = { ...ss, armsAndOathRows: { ...state, mightRow: newRow } };
      setMsg('+1 Supply');
    }
    onChar({ ...updatedChar, skillStates: newSS });
  }

  function resetRow(row: 'honor' | 'might') {
    if (row === 'honor') onSS({ ...ss, armsAndOathRows: { ...state, honorRow: [null, null, null, null, null] } });
    else onSS({ ...ss, armsAndOathRows: { ...state, mightRow: [null, null, null, null, null] } });
  }

  function RowDisplay({ values, label }: { values: (number | null)[], label: string }) {
    return (
      <div className="flex items-center gap-1 mb-1">
        <span className="text-[10px] w-12 text-gray-500">{label}</span>
        {values.map((v, i) => (
          <div key={i} className={`w-6 h-6 rounded border-2 flex items-center justify-center text-xs font-bold ${v !== null ? 'bg-amber-400 border-amber-600 text-white' : 'bg-white border-gray-300 text-gray-300'
            }`}>{v ?? '–'}</div>
        ))}
      </div>
    );
  }

  return (
    <SkillBox title="Arms & Oath Rows" rules={"Mechanism: Two 5-step rows with strict placement constraints.\n\n• Honor Row: each new value must be STRICTLY GREATER than the previous value.\n• Might Row: each new value must be STRICTLY LESS than the previous value.\n\nCost: None to assign.\n\nReward per valid step placed:\n• Honor step → +1 Champion\n• Might step → +1 Supply\n\nReward on full row (5 values placed): +2 Champion, then that row resets.\n\nIf no legal placement exists for the current card, you cannot assign it to that row."}>
      <RowDisplay values={state.honorRow} label="Honor ↑" />
      <div className="flex gap-1 mb-2">
        <button onClick={() => placeHonor(lastVal ?? 5)}
          className="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-700 px-2 py-0.5 rounded">
          Honor +{lastVal ?? '?'}
        </button>
        <button onClick={() => resetRow('honor')} className="text-[10px] text-gray-400 hover:text-red-500">↺</button>
      </div>
      <RowDisplay values={state.mightRow} label="Might ↓" />
      <div className="flex gap-1 mb-1">
        <button onClick={() => placeMight(lastVal ?? 5)}
          className="text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-0.5 rounded">
          Might +{lastVal ?? '?'}
        </button>
        <button onClick={() => resetRow('might')} className="text-[10px] text-gray-400 hover:text-red-500">↺</button>
      </div>
      {msg && <RewardToast message={msg} />}
    </SkillBox>
  );
}

function OathBoardSkill({
  ss, onSS, character, onChar,
}: {
  ss: ClassSkillState; onSS: (u: ClassSkillState) => void;
  character: CharacterState; onChar: (u: CharacterState) => void;
}) {
  const [msg, setMsg] = useState('');
  const { activeOath, oathTrackSteps } = ss.oathBoard;

  function setOath(name: OathType) {
    onSS({ ...ss, oathBoard: { ...ss.oathBoard, activeOath: name } });
    setMsg(`Active oath: ${name}`);
  }

  function complete() {
    if (!activeOath) { setMsg('Choose an oath first'); return; }
    const cfg = OATH_BOARD_CONFIG.find(o => o.name === activeOath)!;
    const newSteps = oathTrackSteps + 1;
    const updatedChar = applyReward(character, cfg.reward);
    let newSS: ClassSkillState;
    if (newSteps >= 4) {
      newSS = { ...ss, oathBoard: { activeOath: null, oathTrackSteps: 0 } };
      setMsg(`Oath fulfilled! Paragon bonus unlocked`);
    } else {
      newSS = { ...ss, oathBoard: { ...ss.oathBoard, oathTrackSteps: newSteps } };
      setMsg(`${activeOath} completed (${newSteps}/4)`);
    }
    onChar({ ...updatedChar, skillStates: newSS });
  }

  return (
    <SkillBox title="Oath Board" rules={"Mechanism: Pledge one active oath at a time by selecting it. Mark it complete when the trigger happens during play.\n\nCost: None to pledge or complete.\n\nOath triggers and rewards:\n• Defend (rescue a Lost Soul tile) → +1 Champion +1 Discovery\n• Slay (defeat an Encounter) → +1 Champion\n• Guard (end your movement turn on the Entrance) → +1 Mana\n• Conquer (collect a Relic) → +1 Arcana\n\nOath Track: every 4 oaths completed advances the track one step. Each track step grants +1 Fortune (this bonus is permanent and does not reset)."}>
      <div className="flex flex-wrap gap-1 mb-2">
        {OATH_BOARD_CONFIG.map(cfg => (
          <button
            key={cfg.name}
            onClick={() => setOath(cfg.name as OathType)}
            className={`text-[10px] px-1.5 py-0.5 rounded border ${activeOath === cfg.name
                ? 'bg-amber-500 border-amber-600 text-white font-bold'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-amber-50'
              }`}
            title={cfg.trigger}
          >
            {cfg.name}
          </button>
        ))}
      </div>
      {activeOath && (
        <div className="text-[10px] text-gray-600 mb-1">
          {OATH_BOARD_CONFIG.find(o => o.name === activeOath)?.trigger}
        </div>
      )}
      <FillDots filled={oathTrackSteps} total={4} activeColor="bg-amber-400" />
      <button
        onClick={complete}
        disabled={!activeOath}
        className="mt-1 text-xs bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white px-2 py-0.5 rounded"
      >
        Mark Complete
      </button>
      {msg && <RewardToast message={msg} />}
    </SkillBox>
  );
}

function FortressSkill({
  ss, onSS, character, onChar, lastVal,
}: {
  ss: ClassSkillState; onSS: (u: ClassSkillState) => void;
  character: CharacterState; onChar: (u: CharacterState) => void;
  lastVal?: number | null;
}) {
  const [msg, setMsg] = useState('');
  const { tier1, tier2, tier3 } = ss.fortress;

  function placeTier(tier: 1 | 2 | 3, cardVal: number) {
    if (!canPlaceFortressTier(ss.fortress, tier, cardVal)) {
      if (tier === 1) setMsg(`Tier 1 needs a ${FORTRESS_CONFIG.tier1Range.min}–${FORTRESS_CONFIG.tier1Range.max} card`);
      else setMsg(`Tier ${tier} must be less than Tier ${tier - 1}`);
      return;
    }
    if (character.resources.gold < 1) { setMsg('Need 1 Gold per tier'); return; }
    let updatedChar = applyReward(character, { gold: -1 });
    const newFort = { ...ss.fortress, [`tier${tier}`]: cardVal };
    let newSS: ClassSkillState;
    if (tier === 3) {
      updatedChar = applyReward(updatedChar, FORTRESS_CONFIG.completeReward);
      newSS = { ...ss, fortress: { tier1: null, tier2: null, tier3: null } };
      setMsg('Fortress complete! +2 Champion +2 Fortune');
    } else {
      newSS = { ...ss, fortress: newFort };
      setMsg(`Tier ${tier} set to ${cardVal}`);
    }
    onChar({ ...updatedChar, skillStates: newSS });
  }

  function resetFortress() {
    onSS({ ...ss, fortress: { tier1: null, tier2: null, tier3: null } });
    setMsg('');
  }

  return (
    <SkillBox title="Fortress" rules={"Mechanism: Build a 3-tier tower by placing values in strictly decreasing order from bottom to top.\n\nPlacement rules:\n• Tier 1 (base): any value 5–10\n• Tier 2: any value strictly less than Tier 1\n• Tier 3 (top): any value strictly less than Tier 2\n\nCost: –1 Gold per tier placed (total –3 Gold for a complete fortress).\n\nReward on completion (all 3 tiers filled): +2 Champion +2 Fortune, then all tiers reset.\n\nYou may not place a tier if you have 0 Gold."}>
      <div className="flex items-end gap-1 mb-1 justify-center">
        {([1, 2, 3] as const).map(tier => {
          const val = tier === 1 ? tier1 : tier === 2 ? tier2 : tier3;
          const height = tier === 3 ? 'h-8' : tier === 2 ? 'h-10' : 'h-12';
          return (
            <div key={tier} className="flex flex-col items-center">
              <div className={`w-10 ${height} rounded border-2 flex items-center justify-center text-sm font-bold ${val !== null ? 'bg-stone-600 border-stone-700 text-white' : 'bg-stone-100 border-stone-300 text-stone-400'
                }`}>
                {val ?? `T${tier}`}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1">
        {([1, 2, 3] as const).map(tier => {
          const prevVal = tier === 1 ? tier1 : tier === 2 ? tier2 : tier3;
          const isSet = prevVal !== null;
          return (
            <button
              key={tier}
              onClick={() => placeTier(tier, lastVal ?? 6)}
              disabled={isSet || (tier === 2 && tier1 === null) || (tier === 3 && tier2 === null)}
              className="flex-1 text-[10px] bg-stone-100 hover:bg-stone-200 disabled:opacity-40 text-stone-700 px-1 py-0.5 rounded border border-stone-300"
            >
              T{tier}{isSet ? ` (${prevVal})` : ''}
            </button>
          );
        })}
        <button onClick={resetFortress} className="text-[10px] text-gray-400 hover:text-red-500">↺</button>
      </div>
      {msg && <RewardToast message={msg} />}
    </SkillBox>
  );
}

// ---------------------------------------------------------------------------
// NECROMANCER
// ---------------------------------------------------------------------------

function GraveLedgerSkill({
  ss, onSS, character, onChar, lastVal,
}: {
  ss: ClassSkillState; onSS: (u: ClassSkillState) => void;
  character: CharacterState; onChar: (u: CharacterState) => void;
  lastVal?: number | null;
}) {
  const [msg, setMsg] = useState('');
  const { skeleton, ghost, wraith } = ss.graveLedger;
  const maxSteps = GRAVE_LEDGER_CONFIG.maxSteps;
  const colValues = [skeleton, ghost, wraith];
  const cols = GRAVE_LEDGER_CONFIG.columns;

  function seed(cardVal: number) {
    const band = cardBand(cardVal);
    const colIdx = cols.findIndex(c => c.seedBand === band);
    if (colIdx === -1) { setMsg('Card band not matched'); return; }
    const key = ['skeleton', 'ghost', 'wraith'][colIdx] as 'skeleton' | 'ghost' | 'wraith';
    if (ss.graveLedger[key] > 0) { setMsg(`${cols[colIdx].name} already active — Advance instead`); return; }
    onSS({ ...ss, graveLedger: { ...ss.graveLedger, [key]: 1 } });
    setMsg(`${cols[colIdx].name} seeded`);
  }

  function advanceAll() {
    const { skeleton: s, ghost: g, wraith: w } = ss.graveLedger;
    let updatedChar = character;
    const newLedger = { skeleton: s, ghost: g, wraith: w };
    const colKeys = ['skeleton', 'ghost', 'wraith'] as const;
    let rewardMsg = 'Advance All:';

    for (let i = 0; i < 3; i++) {
      const key = colKeys[i];
      const cur = newLedger[key];
      if (cur === 0) continue;
      newLedger[key] = cur + 1;
      if (newLedger[key] > maxSteps) {
        updatedChar = applyReward(updatedChar, cols[i].cashOutReward);
        newLedger[key] = 0;
        rewardMsg += ` ${cols[i].name} cashed out!`;
      } else {
        updatedChar = applyReward(updatedChar, cols[i].stepReward);
        rewardMsg += ` ${cols[i].name}→${newLedger[key]};`;
      }
    }
    const newSS = { ...ss, graveLedger: newLedger };
    onChar({ ...updatedChar, skillStates: newSS });
    setMsg(rewardMsg);
  }

  return (
    <SkillBox title="Grave Ledger" rules={"Mechanism: Three undead columns (Skeleton / Ghost / Wraith), each with 4 progress steps.\n\nAssigning any card does two things at no cost:\n1. Seeds the matching type based on card band:\n   • Low (2–4) → places 1 seed in Skeleton\n   • Mid (5–7) → places 1 seed in Ghost\n   • High (8–10) → places 1 seed in Wraith\n2. Triggers Advance All: every seeded minion type advances 1 step.\n\nCost: None.\n\nReward per Advance All step:\n• Skeleton step → +1 Mana\n• Ghost step → +1 Arcana\n• Wraith step → +2 Arcana\n\nReward on full column (4 steps reached):\n• Skeleton maxed → +2 Mana bonus\n• Ghost maxed → +2 Arcana bonus\n• Wraith maxed → +3 Arcana bonus\nThen that column resets to 0.\n\nNote: Crypt Capacity limits how many minions you can advance simultaneously."}>
      <div className="flex gap-2 mb-2">
        {cols.map((col, i) => (
          <div key={col.name} className="flex-1 flex flex-col items-center">
            <div className="text-[9px] font-semibold text-gray-500 mb-0.5">{col.name.slice(0, 4)}</div>
            <FillDots filled={colValues[i]} total={maxSteps} activeColor="bg-gray-700" />
          </div>
        ))}
      </div>
      <div className="flex gap-1">
        <button onClick={() => seed(lastVal ?? 3)}
          className="flex-1 text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-1 py-0.5 rounded border border-gray-300">
          Seed ({lastVal ?? '?'})
        </button>
        <button onClick={advanceAll}
          className="flex-1 text-[10px] bg-gray-700 hover:bg-gray-800 text-white px-1 py-0.5 rounded">
          Advance All
        </button>
      </div>
      {msg && <RewardToast message={msg} />}
    </SkillBox>
  );
}

function CryptCapacitySkill({
  ss, onSS, character, onChar, lastVal,
}: {
  ss: ClassSkillState; onSS: (u: ClassSkillState) => void;
  character: CharacterState; onChar: (u: CharacterState) => void;
  lastVal?: number | null;
}) {
  const [msg, setMsg] = useState('');
  const { controlLevel, doubleUsedThisRound } = ss.cryptCapacity;
  const maxControl = CRYPT_CAPACITY_CONFIG.maxControl;
  const undead = activeUndeadCount(ss.graveLedger.skeleton, ss.graveLedger.ghost, ss.graveLedger.wraith);
  const over = undead > controlLevel;

  function raiseControl(cardVal: number) {
    const needed = controlLevel + 1;
    if (cardVal !== needed) { setMsg(`Need a card value of ${needed} to raise control`); return; }
    if (controlLevel >= maxControl) { setMsg('Control maxed'); return; }
    onSS({ ...ss, cryptCapacity: { ...ss.cryptCapacity, controlLevel: controlLevel + 1 } });
    setMsg(`Control raised to ${controlLevel + 1}`);
  }

  function toggleDouble() {
    onSS({ ...ss, cryptCapacity: { ...ss.cryptCapacity, doubleUsedThisRound: !doubleUsedThisRound } });
  }

  return (
    <SkillBox title="Crypt Capacity" rules={"Mechanism: Governs your Grave Ledger army. The Control Level (1–5) is the maximum number of seeded minion columns that can advance simultaneously.\n\nIf your active (seeded) undead count exceeds your current control level, Advance All in the Grave Ledger is disabled until you remove excess minions or raise your control level.\n\nTo raise control:\n  • Assign a card with value exactly equal to (current level + 1)\n  • No other value is accepted — it must be a precise match.\n\nCost: None (just the matching card value).\nReward: Control Level increases by 1 (max 5).\n\nAt Control Level 5: once per round, you may double the Advance All rewards (each step earns twice the listed amount). The double-use toggle resets each new round."}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-gray-500">Control:</span>
        <FillDots filled={controlLevel} total={maxControl} activeColor="bg-gray-600" />
        <span className="text-xs font-bold text-gray-700">{controlLevel}</span>
      </div>
      <div className={`text-[10px] mb-1 font-semibold ${over ? 'text-red-600' : 'text-green-600'}`}>
        Active undead: {undead} {over ? '(OVER CAPACITY!)' : `/ ${controlLevel}`}
      </div>
      <ValueInput defaultValue={lastVal} onAssign={raiseControl} label={`Raise to ${controlLevel + 1}`} disabled={controlLevel >= maxControl} />
      {controlLevel >= maxControl && (
        <button
          onClick={toggleDouble}
          className={`mt-1 text-[10px] px-2 py-0.5 rounded border ${doubleUsedThisRound ? 'bg-gray-200 border-gray-400 text-gray-500 line-through' : 'bg-gray-600 border-gray-700 text-white hover:bg-gray-700'
            }`}
        >
          {doubleUsedThisRound ? 'Double used' : 'Double Advance All'}
        </button>
      )}
      {msg && <RewardToast message={msg} />}
    </SkillBox>
  );
}

function SoulRingsSkill({
  ss, onSS, character, onChar, lastVal,
}: {
  ss: ClassSkillState; onSS: (u: ClassSkillState) => void;
  character: CharacterState; onChar: (u: CharacterState) => void;
  lastVal?: number | null;
}) {
  const [msg, setMsg] = useState('');
  const { ring1, ring2 } = ss.soulRings;
  const ringSize = SOUL_RINGS_CONFIG.ringSize;

  function markRing(ringKey: 'ring1' | 'ring2', cardVal: number) {
    const ring = ringKey === 'ring1' ? [...ring1] : [...ring2];
    const pos = soulRingPosition(cardVal) - 1; // 0-indexed
    if (ring[pos]) { setMsg(`Position ${pos + 1} already marked`); return; }
    ring[pos] = true;
    const complete = ring.every(Boolean);
    if (complete) {
      const newRings = ringKey === 'ring1'
        ? { ring1: Array(ringSize).fill(false) as boolean[], ring2 }
        : { ring1, ring2: Array(ringSize).fill(false) as boolean[] };
      const newSS = { ...ss, soulRings: newRings };
      let updatedChar = character;
      SOUL_RINGS_CONFIG.rewards.forEach(r => { updatedChar = applyReward(updatedChar, r); });
      onChar({ ...updatedChar, skillStates: newSS });
      setMsg(`Ring complete! All rewards gained`);
    } else {
      onSS({
        ...ss,
        soulRings: {
          ring1: ringKey === 'ring1' ? ring as boolean[] : ring1,
          ring2: ringKey === 'ring2' ? ring as boolean[] : ring2,
        },
      });
      setMsg(`${ringKey === 'ring1' ? 'Ring 1' : 'Ring 2'} pos ${pos + 1} marked`);
    }
  }

  function RingDisplay({ ring, label }: { ring: boolean[]; label: string }) {
    return (
      <div className="mb-1">
        <div className="text-[9px] text-gray-400 mb-0.5">{label}</div>
        <div className="flex gap-0.5">
          {ring.map((filled, i) => (
            <div key={i} className={`w-4 h-4 rounded-full border text-[8px] flex items-center justify-center font-bold ${filled ? 'bg-gray-700 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-400'
              }`}>
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <SkillBox title="Soul Rings" rules={"Mechanism: Two ritual circles, 6 positions each. Each card value maps to a fixed ring position via (value % 6) + 1:\n\n  Card → Position\n  2 → 3 │ 3 → 4 │ 4 → 5\n  5 → 6 │ 6 → 1 │ 7 → 2\n  8 → 3 │ 9 → 4 │ 10 → 5\n\nPositions 1 and 2 can only be reached with a 6 or 7.\nMark the indicated position on either ring.\n\nCost: None.\n\nReward (mark closes all 6 positions):\n• Pos 1 → +1 Mana\n• Pos 2 → +1 Gold\n• Pos 3 → +1 Mana\n• Pos 4 → +1 Arcana\n• Pos 5 → +1 Arcana\n• Pos 6 → +1 Arcana\n\nCompleted ring resets all positions and you may fill it again."}>
      <RingDisplay ring={ring1} label="Ring I" />
      <RingDisplay ring={ring2} label="Ring II" />
      <div className="flex gap-1 mt-1">
        <button onClick={() => markRing('ring1', lastVal ?? 5)}
          className="flex-1 text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-1 py-0.5 rounded border border-gray-300">
          Mark I ({lastVal ?? '?'}→pos {lastVal ? soulRingPosition(lastVal) : '?'})
        </button>
        <button onClick={() => markRing('ring2', lastVal ?? 5)}
          className="flex-1 text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-1 py-0.5 rounded border border-gray-300">
          Mark II
        </button>
      </div>
      {msg && <RewardToast message={msg} />}
    </SkillBox>
  );
}

// ---------------------------------------------------------------------------
// RANGER
// ---------------------------------------------------------------------------

function TrailMapSkill({
  ss, onSS, character, onChar, lastVal,
}: {
  ss: ClassSkillState; onSS: (u: ClassSkillState) => void;
  character: CharacterState; onChar: (u: CharacterState) => void;
  lastVal?: number | null;
}) {
  const [msg, setMsg] = useState('');
  const { currentNode } = ss.trailMap;
  const nextNodeIdx = currentNode + 1;
  const nextNode = nextNodeIdx < TRAIL_MAP_NODES.length ? TRAIL_MAP_NODES[nextNodeIdx] : null;

  function advance(cardVal: number) {
    if (!nextNode) { setMsg('At Summit — reset trail'); return; }
    if (cardVal < nextNode.threshold) { setMsg(`Need at least ${nextNode.threshold} to reach ${nextNode.name}`); return; }
    const newNode = nextNodeIdx;
    onChar(applyReward(character, nextNode.reward));
    if (newNode === TRAIL_MAP_NODES.length - 1) {
      // At Summit — reset
      onSS({ ...ss, trailMap: { currentNode: -1 } });
      setMsg(`Summit reached! Rewards: +2 Discovery +1 Champion. Trail reset.`);
    } else {
      onSS({ ...ss, trailMap: { currentNode: newNode } });
      setMsg(`Reached ${nextNode.name}! ${JSON.stringify(nextNode.reward)}`);
    }
  }

  return (
    <SkillBox title="Trail Map" rules={"Mechanism: 7 nodes in a linear sequence. Assign a card whose value meets or exceeds the current node's threshold to advance.\n\nCost: None.\n\nNode thresholds and rewards (in order):\n1. Forest (≥2) → +1 Supply\n2. Ruins (≥3) → +1 Discovery\n3. Quarry (≥4) → +1 Gold\n4. Shrine (≥5) → +1 Mana\n5. Den (≥6) → +1 Supply\n6. Watchpoint (≥7) → +1 Discovery\n7. Summit (≥8) → +2 Discovery +1 Champion\n\nIf the card value is below the required threshold, the assignment is rejected and nothing happens.\n\nReaching the Summit resets the trail back to the start."}>
      <div className="flex gap-0.5 flex-wrap mb-1">
        {TRAIL_MAP_NODES.map((node, i) => (
          <div key={node.name} className={`text-[9px] px-1 py-0.5 rounded border ${i <= currentNode ? 'bg-green-500 border-green-600 text-white font-bold' : 'bg-white border-gray-300 text-gray-400'
            }`}>
            {node.name.slice(0, 3)}
          </div>
        ))}
      </div>
      {nextNode && (
        <div className="text-[10px] text-gray-600 mb-1">
          Next: {nextNode.name} (need ≥ {nextNode.threshold})
        </div>
      )}
      <ValueInput defaultValue={lastVal} onAssign={advance} label="Advance" disabled={!nextNode} />
      {!nextNode && (
        <button onClick={() => { onSS({ ...ss, trailMap: { currentNode: -1 } }); setMsg('Trail reset'); }}
          className="mt-1 text-[10px] text-gray-400 hover:text-red-500">↺ Reset Trail</button>
      )}
      {msg && <RewardToast message={msg} />}
    </SkillBox>
  );
}

function QuarryBoardSkill({
  ss, onSS, character, onChar, lastVal,
}: {
  ss: ClassSkillState; onSS: (u: ClassSkillState) => void;
  character: CharacterState; onChar: (u: CharacterState) => void;
  lastVal?: number | null;
}) {
  const [msg, setMsg] = useState('');
  const { beastCount, raiderCount, spiritValues } = ss.quarryBoard;
  const counts = [beastCount, raiderCount, spiritValues.length];
  const spiritSum = spiritValues.reduce((a, b) => a + b, 0);

  function place(cardVal: number) {
    const band = cardBand(cardVal);
    if (band === 'low') {
      if (beastCount >= 3) { setMsg('Beast track complete — reset'); return; }
      const newCount = beastCount + 1;
      if (newCount === 3) {
        const newSS = { ...ss, quarryBoard: { ...ss.quarryBoard, beastCount: 0 } };
        onChar({ ...applyReward(character, QUARRY_BOARD_CONFIG[0].reward), skillStates: newSS });
        setMsg('Beast quarry complete! +2 Supply +1 Champion');
      } else {
        onSS({ ...ss, quarryBoard: { ...ss.quarryBoard, beastCount: newCount } });
        setMsg(`Beast: ${newCount}/3`);
      }
    } else if (band === 'mid') {
      if (raiderCount >= 3) { setMsg('Raider track complete — reset'); return; }
      const newCount = raiderCount + 1;
      if (newCount === 3) {
        const newSS = { ...ss, quarryBoard: { ...ss.quarryBoard, raiderCount: 0 } };
        onChar({ ...applyReward(character, QUARRY_BOARD_CONFIG[1].reward), skillStates: newSS });
        setMsg('Raider quarry complete! +2 Gold +1 Champion');
      } else {
        onSS({ ...ss, quarryBoard: { ...ss.quarryBoard, raiderCount: newCount } });
        setMsg(`Raider: ${newCount}/3`);
      }
    } else {
      if (spiritValues.length >= 3) { setMsg('Spirit track full — check if sum >= 15'); return; }
      const newSpirit = [...spiritValues, cardVal];
      const newSum = newSpirit.reduce((a, b) => a + b, 0);
      if (newSpirit.length === 3 && newSum >= 15) {
        const newSS = { ...ss, quarryBoard: { ...ss.quarryBoard, spiritValues: [] } };
        onChar({ ...applyReward(character, QUARRY_BOARD_CONFIG[2].reward), skillStates: newSS });
        setMsg(`Spirit quarry complete! Sum=${newSum} +1 Arcana +2 Discovery`);
      } else if (newSpirit.length === 3) {
        onSS({ ...ss, quarryBoard: { ...ss.quarryBoard, spiritValues: [] } });
        setMsg(`Spirit sum ${newSum} < 15 — track reset`);
      } else {
        onSS({ ...ss, quarryBoard: { ...ss.quarryBoard, spiritValues: newSpirit } });
        setMsg(`Spirit: sum ${newSum} (${newSpirit.length}/3)`);
      }
    }
  }

  return (
    <SkillBox title="Quarry Board" rules={"Mechanism: Three prey tracks you fill by meeting band or sum requirements. Assign a card per turn at no cost.\n\nCost: None.\n\nPrey tracks (3 slots each):\n• Beast: each slot requires a Low card (2–4)\n  Reward on completion: +2 Supply +1 Champion\n• Raider: each slot requires a Mid card (5–7)\n  Reward on completion: +2 Gold +1 Champion\n• Spirit: any card value fills a slot; the 3 stored values must SUM ≥ 15 to complete\n  Reward on completion: +1 Arcana +2 Discovery\n\nCards placed in the wrong band for Beast/Raider are rejected. Each track resets independently on completion."}>
      {QUARRY_BOARD_CONFIG.map((prey, i) => (
        <div key={prey.name} className="flex items-center gap-2 mb-1">
          <span className="text-[10px] w-12 text-gray-500">{prey.name}</span>
          {i < 2 ? (
            <FillDots filled={counts[i]} total={3} activeColor="bg-green-600" />
          ) : (
            <div className="flex gap-0.5 items-center">
              {spiritValues.map((v, j) => (
                <span key={j} className="text-[10px] bg-blue-100 rounded px-1 font-bold">{v}</span>
              ))}
              <span className="text-[10px] text-gray-400">Σ{spiritSum}/15</span>
            </div>
          )}
        </div>
      ))}
      <ValueInput defaultValue={lastVal} onAssign={place} label="Hunt" />
      {msg && <RewardToast message={msg} />}
    </SkillBox>
  );
}

function SurvivalKitSkill({
  ss, onSS, character, onChar, lastVal,
}: {
  ss: ClassSkillState; onSS: (u: ClassSkillState) => void;
  character: CharacterState; onChar: (u: CharacterState) => void;
  lastVal?: number | null;
}) {
  const [msg, setMsg] = useState('');
  const kit = ss.survivalKit;
  const slots = ['rations', 'arrows', 'torch', 'rope'] as const;

  function fill(cardVal: number) {
    const cfg = SURVIVAL_KIT_CONFIG;
    for (let i = 0; i < cfg.length; i++) {
      const slot = cfg[i];
      const key = slots[i];
      if (cardVal >= slot.minValue && cardVal <= slot.maxValue && !kit[key]) {
        onSS({ ...ss, survivalKit: { ...kit, [key]: true } });
        setMsg(`${slot.name} filled`);
        return;
      }
    }
    setMsg(`Card ${cardVal} doesn't fill any open slot`);
  }

  function spend(key: typeof slots[number]) {
    const cfgIdx = slots.indexOf(key);
    const cfg = SURVIVAL_KIT_CONFIG[cfgIdx];
    if (!kit[key]) { setMsg(`${cfg.name} not filled`); return; }
    let updatedChar = character;
    if (cfg.spendReward) updatedChar = applyReward(character, cfg.spendReward);
    // Combo: Rations + Arrows → also +1 Champion
    if (key === 'rations' && kit.arrows) {
      updatedChar = applyReward(updatedChar, { scoring: { champion: 1 } });
      setMsg(`Rations used! ${cfg.spendEffect} + Combo +1 Champion`);
    } else {
      setMsg(`${cfg.name} used! ${cfg.spendEffect}`);
    }
    const newSS = { ...ss, survivalKit: { ...kit, [key]: false } };
    onChar({ ...updatedChar, skillStates: newSS });
  }

  return (
    <SkillBox title="Survival Kit" rules={"Mechanism: Four consumable item slots. Assign a card in the listed range to load an item, then spend it to gain its effect. Each item holds one card at a time.\n\nItem slots, required card range, and spend reward:\n• Rations (2–4): spend → +2 Supply\n• Arrows (5–7): spend → +1 combat bonus (added to next combat roll)\n• Torch (4–7): spend → peek at the next undrawn card from the deck\n• Rope (7–10): spend → move the Trail Map position to any previously visited node\n\nCost: Each spend consumes the stored card (slot becomes empty again).\n\nCombo bonus: if you spend Rations AND Arrows in the same round, gain an additional +1 Champion."}>
      <div className="grid grid-cols-2 gap-1">
        {SURVIVAL_KIT_CONFIG.map((cfg, i) => {
          const key = slots[i];
          const filled = kit[key];
          return (
            <div key={cfg.name} className={`rounded border p-1 ${filled ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'}`}>
              <div className="text-[10px] font-semibold text-gray-600">{cfg.name}</div>
              <div className="text-[9px] text-gray-400">{cfg.minValue}–{cfg.maxValue}</div>
              {filled ? (
                <button onClick={() => spend(key)}
                  className="mt-0.5 text-[10px] bg-green-600 hover:bg-green-700 text-white px-1.5 py-0.5 rounded">
                  Use
                </button>
              ) : (
                <div className="text-[9px] text-gray-300 mt-0.5">empty</div>
              )}
            </div>
          );
        })}
      </div>
      <ValueInput defaultValue={lastVal} onAssign={fill} label="Fill Kit" />
      {msg && <RewardToast message={msg} />}
    </SkillBox>
  );
}

// ---------------------------------------------------------------------------
// Class sub-components
// ---------------------------------------------------------------------------

type SkillProps = {
  ss: ClassSkillState;
  onSS: (u: ClassSkillState) => void;
  character: CharacterState;
  onChar: (u: CharacterState) => void;
  lastVal?: number | null;
};

function AlchemistSkills({ level, ss, onSS, character, onChar, lastVal }: SkillProps & { level: number }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {isSkillUnlocked(level, 1) ? <PotionRackSkill ss={ss} onSS={onSS} character={character} onChar={onChar} lastVal={lastVal} /> : <LockedSkillSlot slot={1} />}
      {isSkillUnlocked(level, 2) ? <TransmutationLadderSkill ss={ss} onSS={onSS} character={character} onChar={onChar} lastVal={lastVal} /> : <LockedSkillSlot slot={2} />}
      {isSkillUnlocked(level, 3) ? <VolatileFlaskSkill ss={ss} onSS={onSS} character={character} onChar={onChar} lastVal={lastVal} /> : <LockedSkillSlot slot={3} />}
    </div>
  );
}

function BardSkills({ level, ss, onSS, character, onChar, lastVal }: SkillProps & { level: number }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {isSkillUnlocked(level, 1) ? <SongbookSkill ss={ss} onSS={onSS} character={character} onChar={onChar} lastVal={lastVal} /> : <LockedSkillSlot slot={1} />}
      {isSkillUnlocked(level, 2) ? <CrescendoSkill ss={ss} onSS={onSS} character={character} onChar={onChar} lastVal={lastVal} /> : <LockedSkillSlot slot={2} />}
      {isSkillUnlocked(level, 3) ? <AudienceMeterSkill ss={ss} onSS={onSS} character={character} onChar={onChar} /> : <LockedSkillSlot slot={3} />}
    </div>
  );
}

function DruidSkills({ level, ss, onSS, character, onChar, lastVal }: SkillProps & { level: number }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {isSkillUnlocked(level, 1) ? <SacredGroveSkill ss={ss} onSS={onSS} character={character} onChar={onChar} lastVal={lastVal} /> : <LockedSkillSlot slot={1} />}
      {isSkillUnlocked(level, 2) ? <BeastFormsSkill ss={ss} onSS={onSS} character={character} onChar={onChar} lastVal={lastVal} /> : <LockedSkillSlot slot={2} />}
      {isSkillUnlocked(level, 3) ? <SeasonWheelSkill ss={ss} onSS={onSS} character={character} onChar={onChar} lastVal={lastVal} /> : <LockedSkillSlot slot={3} />}
    </div>
  );
}

function KnightSkills({ level, ss, onSS, character, onChar, lastVal }: SkillProps & { level: number }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {isSkillUnlocked(level, 1) ? <ArmsAndOathRowsSkill ss={ss} onSS={onSS} character={character} onChar={onChar} lastVal={lastVal} /> : <LockedSkillSlot slot={1} />}
      {isSkillUnlocked(level, 2) ? <OathBoardSkill ss={ss} onSS={onSS} character={character} onChar={onChar} /> : <LockedSkillSlot slot={2} />}
      {isSkillUnlocked(level, 3) ? <FortressSkill ss={ss} onSS={onSS} character={character} onChar={onChar} lastVal={lastVal} /> : <LockedSkillSlot slot={3} />}
    </div>
  );
}

function NecromancerSkills({ level, ss, onSS, character, onChar, lastVal }: SkillProps & { level: number }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {isSkillUnlocked(level, 1) ? <GraveLedgerSkill ss={ss} onSS={onSS} character={character} onChar={onChar} lastVal={lastVal} /> : <LockedSkillSlot slot={1} />}
      {isSkillUnlocked(level, 2) ? <CryptCapacitySkill ss={ss} onSS={onSS} character={character} onChar={onChar} lastVal={lastVal} /> : <LockedSkillSlot slot={2} />}
      {isSkillUnlocked(level, 3) ? <SoulRingsSkill ss={ss} onSS={onSS} character={character} onChar={onChar} lastVal={lastVal} /> : <LockedSkillSlot slot={3} />}
    </div>
  );
}

function RangerSkills({ level, ss, onSS, character, onChar, lastVal }: SkillProps & { level: number }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {isSkillUnlocked(level, 1) ? <TrailMapSkill ss={ss} onSS={onSS} character={character} onChar={onChar} lastVal={lastVal} /> : <LockedSkillSlot slot={1} />}
      {isSkillUnlocked(level, 2) ? <QuarryBoardSkill ss={ss} onSS={onSS} character={character} onChar={onChar} lastVal={lastVal} /> : <LockedSkillSlot slot={2} />}
      {isSkillUnlocked(level, 3) ? <SurvivalKitSkill ss={ss} onSS={onSS} character={character} onChar={onChar} lastVal={lastVal} /> : <LockedSkillSlot slot={3} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

const ClassSkillBoard: React.FC<ClassSkillBoardProps> = ({
  className,
  level,
  skillStates: ss,
  onSkillStatesChange: onSS,
  character,
  onCharacterChange: onChar,
  lastDrawnValue,
  selectedCard,
  onCardPlayed,
}) => {
  const sharedProps: SkillProps & { level: number } = {
    level, ss, onSS, character, onChar, lastVal: lastDrawnValue,
  };

  const ctxValue: SelectedCardCtxValue = {
    selectedCard: selectedCard ?? null,
    onCardPlayed: onCardPlayed ?? (() => {}),
  };

  let content: React.ReactNode;
  switch (className) {
    case 'Alchemist': content = <AlchemistSkills {...sharedProps} />; break;
    case 'Bard': content = <BardSkills {...sharedProps} />; break;
    case 'Druid': content = <DruidSkills {...sharedProps} />; break;
    case 'Knight': content = <KnightSkills {...sharedProps} />; break;
    case 'Necromancer': content = <NecromancerSkills {...sharedProps} />; break;
    case 'Ranger': content = <RangerSkills {...sharedProps} />; break;
    default: return null;
  }

  return (
    <SelectedCardContext.Provider value={ctxValue}>
      {content}
    </SelectedCardContext.Provider>
  );
};

export default ClassSkillBoard;
