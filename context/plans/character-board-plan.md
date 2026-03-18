# Issue Plan: Character Board Page

## Overview
Add a new "Character" page to the left sidebar navigation that displays a comprehensive character board. The board tracks all persistent character state: wounds/armor, attributes, resources, XP/progression, color energies, scoring tracks, and per-class level/skill progression.

## Acceptance Criteria

1. A "Character" entry appears in the left sidebar nav with an appropriate icon (e.g. ⚔️).
2. Clicking it renders the `CharacterBoard` component as the main content area.
3. All character state has sensible defaults and can be manually edited.
4. A "Randomize" action can randomly generate a starting character state.
5. Character state is stored in React state at the `App` level (or via Context) so that other boards can read from and write to it in future issues.
6. State is persisted to `localStorage` under a `characterState` key so it survives page refresh.

---

## Data Model (`src/types.ts` additions)

```ts
// --- Body location wound / armor tracking ---
export interface BodyLocation {
  name: 'Head' | 'Torso' | 'Left Arm' | 'Right Arm' | 'Left Leg' | 'Right Leg';
  woundSlots: number;   // total capacity
  wounds: number;       // current wounds (0 – woundSlots)
  armorSlots: number;   // total armor capacity (same as woundSlots by default)
  armor: number;        // current armor pieces equipped (0 – armorSlots)
}

// Defaults per location
// Head:       woundSlots = 2, armorSlots = 2
// Torso:      woundSlots = 4, armorSlots = 4
// Left Arm:   woundSlots = 2, armorSlots = 2   (×2 = 4 total arm slots)
// Right Arm:  woundSlots = 2, armorSlots = 2
// Left Leg:   woundSlots = 2, armorSlots = 2   (×2 = 4 total leg slots)
// Right Leg:  woundSlots = 2, armorSlots = 2

// --- Core attributes ---
export interface CharacterAttributes {
  brawn: number;    // 0–10, default 3
  agility: number;  // 0–10, default 3
  mind: number;     // 0–10, default 3
  spirit: number;   // 0–10, default 3
}

// --- Collectible resources ---
export interface CharacterResources {
  xp: number;        // default 0
  gold: number;      // default 0
  supplies: number;  // default 0
  mana: number;      // default 0
}

// --- Color energy pool ---
export interface ColorEnergies {
  red: number;    // default 0
  orange: number;
  yellow: number;
  green: number;
  blue: number;
  purple: number;
}

// Scoring category type
export type ScoringCategory = 'discovery' | 'champion' | 'arcana' | 'fortune';

// --- Class level tracks ---
export type CharacterClass =
  | 'Alchemist'
  | 'Bard'
  | 'Druid'
  | 'Knight'
  | 'Necromancer'
  | 'Ranger';

export interface ClassProgress {
  className: CharacterClass;
  level: number; // 0–9, default 0
}

// --- Top-level character state ---
export interface CharacterState {
  name: string;                           // default "Hero"
  body: BodyLocation[];                   // 6 locations
  attributes: CharacterAttributes;
  resources: CharacterResources;
  energies: ColorEnergies;
  scoring: Record<ScoringCategory, number>;  // each 0–max (see scoring track)
  classes: ClassProgress[];               // one entry per CharacterClass
}
```

---

## Scoring Track Design

Each of the four scoring categories (Discovery, Champion, Arcana, Fortune) uses the same track layout:

| Range   | Bonus milestone spaces |
|---------|------------------------|
| 0 – 20  | Every 5 points (spaces 5, 10, 15, 20) |
| 21+     | Every 3 points (spaces 23, 26, 29, …) |

Maximum tracked value: **35** (four extra milestones beyond 20 at 23, 26, 29, 32, 35).

Bonus content at each milestone is **TBD** and will be defined in a follow-up issue. The UI should render placeholder markers for each milestone.

---

## Component Architecture

### New file: `src/components/CharacterBoard.tsx`

Split internally into sub-sections (can be separate sub-components or sections within the file):

```
CharacterBoard
├── CharacterHeader       – Name input + Randomize button
├── BodyDiagram           – SVG/CSS humanoid outline with wound & armor pips per location
├── AttributeTracks       – Brawn / Agility / Mind / Spirit (0–10 pip tracks)
├── ResourceCounters      – XP / Gold / Supplies / Mana (increment/decrement)
├── EnergyCounters        – 6 color energies (increment/decrement, color-coded)
├── ScoringTracks         – 4 horizontal tracks with milestone markers
└── ClassPanel            – Level tracks (0–9) + skill placeholders for 6 classes
```

### Props interface

```ts
interface CharacterBoardProps {
  character: CharacterState;
  onChange: (updated: CharacterState) => void;
}
```

---

## Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Character Board Header (name input, randomize button)          │
├────────────────────────────┬────────────────────────────────────┤
│  LEFT PANEL                │  RIGHT PANEL                       │
│                            │                                    │
│  [Body Diagram]            │  [Class Level Tracks]              │
│    • head (2 slots)        │    Alchemist  ○○○○○○○○○  [skills] │
│    • torso (4 slots)       │    Bard       ○○○○○○○○○  [skills] │
│    • left arm (2 slots)    │    Druid      ○○○○○○○○○  [skills] │
│    • right arm (2 slots)   │    Knight     ○○○○○○○○○  [skills] │
│    • left leg (2 slots)    │    Necромancer○○○○○○○○○  [skills] │
│    • right leg (2 slots)   │    Ranger     ○○○○○○○○○  [skills] │
│                            │                                    │
│  [Attributes]              │                                    │
│    Brawn    ●●●○○○○○○○     │                                    │
│    Agility  ●●●○○○○○○○     │                                    │
│    Mind     ●●●○○○○○○○     │                                    │
│    Spirit   ●●●○○○○○○○     │                                    │
│                            │                                    │
│  [Resources]               │                                    │
│    XP: 0  Gold: 0          │                                    │
│    Supplies: 0  Mana: 0    │                                    │
│                            │                                    │
│  [Color Energies]          │                                    │
│    🔴0  🟠0  🟡0           │                                    │
│    🟢0  🔵0  🟣0           │                                    │
│                            │                                    │
│  [Scoring Tracks]          │                                    │
│  Discovery  ──●──┼──┼──┼── │                                    │
│  Champion   ──●──┼──┼──┼── │                                    │
│  Arcana     ──●──┼──┼──┼── │                                    │
│  Fortune    ──●──┼──┼──┼── │                                    │
└────────────────────────────┴────────────────────────────────────┘
```

---

## App.tsx Changes

1. **Add `'character'` to the page union type:**
   ```ts
   useState<'dungeon' | 'tower' | 'forest' | 'city' | 'character'>('dungeon')
   ```

2. **Add nav item:**
   ```ts
   { page: 'character', label: 'Character', icon: '⚔️' }
   ```

3. **Add character state with localStorage persistence:**
   ```ts
   const [character, setCharacter] = useState<CharacterState>(() => {
     try {
       return JSON.parse(localStorage.getItem('characterState') || 'null') ?? DEFAULT_CHARACTER;
     } catch { return DEFAULT_CHARACTER; }
   });

   useEffect(() => {
     localStorage.setItem('characterState', JSON.stringify(character));
   }, [character]);
   ```

4. **Add page render branch:**
   ```tsx
   {currentPage === 'character' && (
     <CharacterBoard character={character} onChange={setCharacter} />
   )}
   ```

---

## Utility / Helper Additions

### `src/utils/characterGenerator.ts` (new file)

- `generateRandomCharacter(): CharacterState` — produces a randomized character with:
  - Random name drawn from a short fantasy name list
  - Attribute values randomly distributed (sum = 12–16, each 1–7)
  - Random small amounts of resources, energies
  - Class levels all at 0 initially (random starting class at level 1 is a stretch goal)

### Scoring track helper (can live in `characterGenerator.ts`):

```ts
/** Returns array of milestone values for the scoring track */
export function getScoringMilestones(max: number = 35): number[] {
  const milestones: number[] = [];
  for (let i = 5; i <= 20; i += 5) milestones.push(i);
  for (let i = 23; i <= max; i += 3) milestones.push(i);
  return milestones;
}
// Result: [5, 10, 15, 20, 23, 26, 29, 32, 35]
```

---

## Default State Constant

```ts
export const DEFAULT_CHARACTER: CharacterState = {
  name: 'Hero',
  body: [
    { name: 'Head',       woundSlots: 2, wounds: 0, armorSlots: 2, armor: 0 },
    { name: 'Torso',      woundSlots: 4, wounds: 0, armorSlots: 4, armor: 0 },
    { name: 'Left Arm',   woundSlots: 2, wounds: 0, armorSlots: 2, armor: 0 },
    { name: 'Right Arm',  woundSlots: 2, wounds: 0, armorSlots: 2, armor: 0 },
    { name: 'Left Leg',   woundSlots: 2, wounds: 0, armorSlots: 2, armor: 0 },
    { name: 'Right Leg',  woundSlots: 2, wounds: 0, armorSlots: 2, armor: 0 },
  ],
  attributes: { brawn: 3, agility: 3, mind: 3, spirit: 3 },
  resources: { xp: 0, gold: 0, supplies: 0, mana: 0 },
  energies: { red: 0, orange: 0, yellow: 0, green: 0, blue: 0, purple: 0 },
  scoring: { discovery: 0, champion: 0, arcana: 0, fortune: 0 },
  classes: [
    { className: 'Alchemist',   level: 0 },
    { className: 'Bard',        level: 0 },
    { className: 'Druid',       level: 0 },
    { className: 'Knight',      level: 0 },
    { className: 'Necromancer', level: 0 },
    { className: 'Ranger',      level: 0 },
  ],
};
```

---

## UI Component Details

### BodyDiagram

- Render a simplified humanoid outline using HTML/CSS div blocks arranged to look like a body.
- Each body location displays:
  - Location label
  - Row of **wound pip slots** (red when wounded, empty circle when not)
  - Row of **armor pip slots** (gold/yellow when armored, empty circle when not)
- Clicking a wound pip cycles: empty → wounded → empty
- Clicking an armor pip cycles: empty → armored → empty

### AttributeTracks

- Each attribute has a horizontal track of 11 circles (0–10).
- Filled circles = current value.  Clicking a circle sets value to that index.
- Below each track label show the current numeric value.

### ResourceCounters

- Each resource (XP, Gold, Supplies, Mana) shown as: `[−] N [+]` counter.
- Min: 0.  No maximum enforced at this stage.
- Display in a 2×2 grid.

### EnergyCounters

- Same `[−] N [+]` pattern as resources.
- Each counter is color-coded to match the 6 existing `ColorRequirement` colors used throughout the app (red, orange, yellow, green, blue, purple).
- Display in a 2×3 or 3×2 grid.

### ScoringTracks

- Each track is a horizontal strip labeled with the category name on the left.
- Segments 0–35, with milestone markers at `[5, 10, 15, 20, 23, 26, 29, 32, 35]`.
- Current score shown by a filled marker / highlighted segment.
- Click a segment to set score to that value; or use `[−] [+]` buttons.
- Milestone markers show a distinctive style (star or diamond icon) — bonus text is **TBD**.

### ClassPanel (right panel)

- For each class, one row containing:
  - Class name label (fixed width)
  - 9-pip level track (○ = not reached, ● = reached)
  - 2–3 skill/minigame placeholder boxes to the right (gray bordered box labeled "Skill Slot")
- Clicking a pip on the level track sets the level to that value.

---

## Testing

Add `src/tests/CharacterBoard.test.tsx`:

- Renders with default character state without errors.
- Clicking a wound pip updates wound count.
- Clicking an attribute pip updates the attribute value.
- Increment/decrement buttons update resource/energy counts.
- Score track click sets score correctly.
- Class level pip click sets level correctly.
- Randomize button produces a valid `CharacterState`.

---

## Implementation Order

1. **Types** — Add all new types/interfaces to `src/types.ts`
2. **Default constants + generator** — Create `src/utils/characterGenerator.ts`
3. **App state wiring** — Add character state, localStorage persistence, nav entry, page render branch to `src/App.tsx`
4. **CharacterBoard component** — Implement `src/components/CharacterBoard.tsx` with all sub-sections
5. **Tests** — Add `src/tests/CharacterBoard.test.tsx`

---

## Out of Scope for This Issue

- Defining specific bonus rewards at scoring track milestones (follow-up issue).
- Integration wiring where other boards (Dungeon, Forest, City, Tower) automatically modify character state (follow-up issue).
- Class skill/minigame implementations — only placeholder boxes are needed now.
- Character portrait / image upload.
