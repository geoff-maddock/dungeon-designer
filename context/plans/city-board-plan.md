# City Board Design Plan

## Overview

The City Board is a **multi-building mini-game hub** inspired by *Rolling Realms* (each building is its own distinct mini-game with a tracking board) and *FlipTown* (buildings serve thematic economic functions and reward multiple visits with escalating bonuses).

Unlike the Dungeon, Tower, or Forest boards — which are traversal/exploration boards — the City is a **destination economy board**. Players don't move through it; they make deliberate choices about which building to visit each time they arrive, spending limited Diamond cards to accrue compounding benefits.

---

## Entry Mechanic

**Requirement**: Spend a card with the **Diamond (♦) suit** to visit the City board for that turn.

- The **rank** of the spent Diamond card determines which building you may visit.
- Example: A 7♦ lets you visit the **Mage's Workshop** (rank 7 building).
- Abilities, class skills, or item effects may modify which rank you can visit (e.g., "treat your Diamond card as any rank from 2–6").
- Face cards (J, Q, K) and the Ace access the most powerful buildings but are rarer draws.

---

## Visit Mechanic

### Card Draw
On each turn a player draws a hand of cards — **default 2 cards**, scaled by a character stat (TBD during development; Mind and Agility are candidates). If **both drawn cards are Diamonds**, the player may visit the city **twice** that turn — once per Diamond card — choosing the same building or two different buildings.

### Visiting a Building
When you visit a building:
1. **Mark one Visit Circle** on the building's track (filled circles show visit count).
2. **Apply the Visit Effect** — the standard benefit of the building.
3. **Check Milestone Bonuses** — if your visit fills a milestone threshold, gain the listed reward **in addition** to the visit effect.
4. **Optional Spend** — some buildings let you pay extra resources for a bonus effect.

### Use Limit Types
Buildings fall into two categories:

- **Per-Player Buildings** — each player maintains their own visit track and cap. Personal benefits (armor, wounds, mana, XP) naturally belong here. Players don't compete for access; milestones are independently earned.
- **Globally Limited Buildings** — a finite shared cap applies across all players. These are high-power locations where simultaneous access creates competition. Once the global cap is reached, no player may visit further. The Bank (deposits), Arcane Academy, and Royal Keep fall here by default, with configurable caps.

Buildings have a **visit cap** (typically 4–6 slots). Once all slots are filled, the building is **exhausted** for the remainder of the game (no further visits). The **Graveyard** is the sole exception — it never exhausts and accepts any Diamond card, serving as the fallback destination when a player's matching building is already exhausted.

> **Design Note**: The visit cap creates deliberate choice pressure — do you revisit a partially-filled building to unlock its milestone, or diversify across buildings for broader benefits? For globally limited buildings, timing your visit before other players exhaust the cap becomes an additional strategic layer.

---

## City Buildings — Full Reference

There are **13 buildings**, one per card rank. Buildings are thematically arranged into four districts:

| District | Ranks | Theme |
|---|---|---|
| Commons | 2–4 | Basic services: rest, provisions, trade |
| Crafters' Row | 5–8 | Specialty shops: alchemists, smiths, scholars |
| Merchant Quarter | 9–10 | Wealth and knowledge |
| Noble District | J, Q, K, A | Power, divine favor, arcane mastery |

---

### Commons District

---

#### Rank 2 — The Stables 🐴
*"Fresh horses and packed saddlebags for travelers heading on."*

- **Visit Effect**: Gain **1 Supply**.
- **Visit Track**: ○ ○ ○ ○ (4 slots)
  - **2 visits**: Gain **2 Supplies**
  - **4 visits**: Gain **2 Supplies** + **1 XP**
- **Optional Spend**: Pay 1 Gold → gain **2 Supplies** this visit instead of 1.
- **Purpose**: Reliable supply engine. The cheapest and most accessible building; a 2♦ is a common draw.

---

#### Rank 3 — The Tavern 🍺
*"A warm fire, cold ale, and forgetting your wounds."*

- **Visit Effect**: Choose one — heal **2 Wounds** (any locations) OR gain **1 Gold**.
- **Visit Track**: ○ ○ ○ ○ (4 slots)
  - **2 visits**: Heal **1 Wound per body location** that has any wounds (partial heal-all)
  - **4 visits**: Gain **Fortune +1** + heal **3 Wounds**
- **Optional Spend**: Pay 2 Gold → gain the **other** visit effect as well (heal AND gold).
- **Purpose**: Primary wound recovery in the city. Players with heavy damage will prioritize this building.

---

#### Rank 4 — Market Square 🏪
*"Name your price and someone's buying."*

- **Visit Effect**: Gain Gold equal to the **number of resource types you currently hold > 0** (max 4: Gold counts as 1, Supplies, Mana, and any Color Energy stack — yes, energies count as one type collectively). Minimum: **1 Gold**.
- **Visit Track**: ○ ○ ○ ○ ○ (5 slots)
  - **3 visits**: Gain **3 Gold**
  - **5 visits**: Gain **3 Gold** + **Fortune +1**
- **Optional Spend**: Pay 2 Supplies → gain **4 Gold** this visit (replaces normal visit effect).
- **Purpose**: Rewards diversified resource portfolios. Strong synergy with Stables (supplies) and Mage's Workshop (mana).

---

### Crafters' Row District

---

#### Rank 5 — The Herbalist 🌿
*"One vial of this, one pinch of that — transformation begins here."*

- **Visit Effect**: Gain **1 Color Energy** of your choice.
- **Visit Track**: 3×2 grid of filled circles (6 slots total):
  ```
  ○ ○ ○   ← Row 1
  ○ ○ ○   ← Row 2
  ```
  - **Complete Row 1** (3 visits): Gain **1 Mana**
  - **Complete Row 2** (6 visits): Gain **1 of each Color Energy** (6 total — a full rainbow)
- **Optional Spend**: Pay 1 Supply → gain **2 Color Energies** of choice this visit instead of 1.
- **Mechanic Note**: This is a **grid-fill** building. Visits fill left-to-right, top-to-bottom. The row-complete bonus triggers mid-track, so you get a meaningful reward at 3 visits before the full 6.
- **Purpose**: Primary Color Energy engine. Critical for players needing specific energy for dungeon board colored cells or class upgrades.

---

#### Rank 6 — The Blacksmith ⚒️
*"Iron and fire, patience and skill — your flesh needs protection."*

- **Visit Effect**: Equip **1 Armor** to any body location (that body location's armor value +1, up to its max).
- **Visit Track**: ○ ○ ○ ○ (4 slots)
  - **2 visits**: Equip **2 Armor** to any locations (can split or stack)
  - **4 visits**: Equip **1 Armor to every body location** that is not already at max armor
- **Optional Spend**: Pay 3 Gold → equip **1 additional Armor** on top of visit effect.
- **Purpose**: Armor refueling station. Players leaving a dungeon or tower encounter with depleted armor will prize this visit. Pairs well with the Tavern for full defensive restoration.

---

#### Rank 7 — The Mage's Workshop 🔮
*"Complex formulae, smoking vials, the taste of ozone."*

- **Visit Effect**: Gain **1 Mana**.
- **Visit Track**: ○ ○ ○ ○ ○ (5 slots)
  - **3 visits**: Gain **2 Mana** + **Arcana +1**
  - **5 visits**: Gain **3 Mana** + **Arcana +2** + **1 Color Energy** of choice
- **Optional Spend**: Pay 2 Gold → gain **+1 Mana** on top of this visit's effect.
- **Purpose**: Mana generation and early Arcana scoring. Synergizes with Scholar's Archive and the Arcane Academy.

---

#### Rank 8 — The Guild Hall 🏛️
*"Deeds recorded, ranks bestowed, legends inscribed in the ledger."*

- **Visit Effect**: Gain **1 XP**.
- **Visit Track**: ○ ○ ○ ○ (4 slots, with cumulative scaling):
  - **1st visit**: +1 XP (base)
  - **2nd visit**: +2 XP total this visit (milestone; cumulative doubling)
  - **3rd visit**: +2 XP
  - **4th visit**: +3 XP + **Champion +1**
- **Optional Spend**: Pay 2 Gold → gain **+1 XP** on top of this visit's effect.
- **Mechanic Note**: The milestone at visit 4 (Champion track) ties the Guild Hall to the scoring system — it's the city's champion-scoring node.
- **Purpose**: XP engine for character advancement. The Champion scoring connection makes it vitally important for players pursuing that track.

---

### Merchant Quarter District

---

#### Rank 9 — The Scholar's Archive 📚
*"Every question has an answer, if you know where to look."*

- **Visit Effect**: Choose one — gain **2 XP** OR advance **Discovery +1**.
- **Visit Track**: ○ ○ ○ ○ (4 slots)
  - **2 visits**: Gain **3 XP** + **Discovery +1** (both, regardless of what you chose)
  - **4 visits**: **Discovery +2** + gain **1 Scry Token** (before your next card draw, look at the top 2 cards of the draw pile and choose which to draw; the unchosen card returns to the top)
- **Optional Spend**: Pay 3 Mana → also advance **Arcana +2** this visit.
- **Purpose**: Rewards choice-making. The Scry Token is a powerful ability modifier that plays into the core card-draw system. Strong for players stacking Discovery or Arcana.

---

#### Rank 10 — The Bank 💰
*"Gold begets gold. Time is the only currency you can't buy back."*

- **Visit Effect**: Gain **3 Gold**.
- **Visit Track**: 2×3 grid (6 slots):
  ```
  ○ ○ ○   ← Row 1
  ○ ○ ○   ← Row 2
  ```
  - **Complete Row 1** (3 visits): Gain **4 Gold** + **Fortune +1**
  - **Complete Row 2** (6 visits): Gain **5 Gold** + **Fortune +2**
- **Optional Spend — Deposits**: At any Bank visit, open a deposit at one of two levels (upgradeable; one active deposit per player at a time):
  - **Small Deposit**: Pay **5 Gold** → place a Small Deposit Marker. At the **end of each subsequent round**, gain **1 Gold + Fortune +1**.
  - **Large Deposit**: Pay **10 Gold** → place a Large Deposit Marker. At the **end of each subsequent round**, gain **2 Gold + Fortune +2**.
  - **Upgrade**: On a future Bank visit, pay an additional **5 Gold** to upgrade a Small Deposit to a Large Deposit.
- **Mechanic Note**: Deposits pay **compound interest per round** rather than a lump sum at game end — rewarding early investment. A Small Deposit placed in round 2 of a 6-round game earns 4 payouts (rounds 3–6), netting 4 Gold and Fortune +4. A Large Deposit over the same window yields 8 Gold and Fortune +8.
- **Global Limit**: Only **3 total active deposits** allowed across all players (configurable). Once 3 deposits exist, no new deposits can be opened (but existing ones still pay interest and can be upgraded).
- **Purpose**: Fortune scoring engine and long-term investment vehicle. The global cap ensures not all players can freely bank — visit early or miss the window.

---

### Noble District

---

#### Rank J — The Thieves' Guild 🗡️
*"Everyone has something to lose. Everyone has something to offer."*

- **Visit Effect**: Gain **1 free resource** — choose Gold, Supply, or Mana — without spending anything.
- **Visit Track**: ○ ○ ○ ○ (4 slots, each with a fixed reward):
  - **Slot 1**: +1 Gold (in addition to visit effect)
  - **Slot 2**: +1 Supply
  - **Slot 3**: +1 Mana
  - **Slot 4**: **Fortune +1**
- **Special — Face Card Bonus (J♦)**: Because J is a face card, when you visit, you gain **2 free resources** (instead of 1) before applying milestone tracking.
- **Special — Crown Heist (J♦ only)**: In addition to your normal Thieves' Guild visit, you may **advance one Scoring Track of your choice by 1** — as if you briefly visited the Royal Keep. (The guild has ears at every door in the castle.)
- **Mechanic Note**: This building has **no optional spend** — it only gives, never costs. Auto-encounters apply to the Dungeon only; face card Diamonds in the City go directly to the Noble District building. The Crown Heist makes J♦ one of the most versatile cards in the deck.
- **Purpose**: Safety net for resource-depleted players. The guaranteed free resources can bail out a bad dungeon run.

---

#### Rank Q — Temple of the Fading Light 🕍
*"Leave your burdens at the gate. The light takes what the darkness gave."*

- **Visit Effect**: Heal **3 Wounds** (distribute across any body locations) OR remove **all wounds** from one body location of your choice.
- **Visit Track**: ○ ○ ○ ○ (4 slots)
  - **2 visits**: **Full body-part reset** — remove all wounds from **two** body locations of your choice
  - **4 visits**: Full character heal (all wounds removed from all locations) + **Fortune +1**
- **Optional Spend**: Pay 3 Mana → also advance **Arcana +1** this visit (divine magic).
- **Special — Royal Pardon (Q♦ only)**: In addition to your normal Temple visit, you may **un-exhaust one exhausted city building** of your choice — that building regains 1 visit slot and can be visited once more this game. The Temple's divine influence reaches across the city.
- **Purpose**: Emergency recovery. This is the city's most powerful healing building — while the Tavern handles minor wounds cheaply, the Temple handles catastrophic damage. The Arcana spend and Royal Pardon make Q♦ one of the most situationally powerful draws in a depleted city.

---

#### Rank K — The Royal Keep 👑
*"The crown's ear is always open to those who bring gifts and glory."*

- **Visit Effect**: Advance **any 1 scoring track** (Discovery, Champion, Arcana, or Fortune) by 1.
- **Visit Track**: ○ ○ ○ ○ (4 slots)
  - **2 visits**: Advance **any scoring track** +1 AND gain **2 Gold** (bonus on top of visit effect)
  - **4 visits**: Advance **all four scoring tracks** by 1 each
- **Optional Spend**: Pay 5 Gold → advance your chosen track by **2** this visit instead of 1.
- **Special — Crown Authority (K♦ only)**: Your visit counts as **2 visits** — mark 2 circles on the track, claim the visit effect twice, and check milestone thresholds for both filled circles. This can trigger a mid and full milestone in a single visit if the track is near completion.
- **Purpose**: Pure score acceleration. No resource production, pure progression. The slot-4 milestone (all tracks +1) is the single most powerful city reward; Crown Authority can deliver it in half the normal visits.

---

#### Rank A — The Arcane Academy 🌟
*"The pinnacle of learning. The confluence of all energies. You were not ready for this — until now."*

- **Visit Effect**: Gain **any 2 Color Energies** of your choice AND advance **Arcana +1**.
- **Visit Track**: ○ ○ ○ ○ ○ (5 slots)
  - **3 visits**: Gain **1 of each Color Energy** (all 6) + **Arcana +1**
  - **5 visits**: Gain **3 Mana** + **Arcana +3** + **Fortune +1**
- **Optional Spend**: Pay 3 Mana → gain **2 additional Color Energies** of choice this visit (on top of the 2 from the visit effect).
- **Purpose**: The crown jewel building. Only accessible via an Ace of Diamonds — statistically rare. Rewards players who hold it for the right moment. The milestone rewards are enormous, making repeat visits extraordinarily valuable if you can pull Aces.

---

### Special District

---

#### Wild Rank — The Graveyard ⚰️
*"The dead remember everything. Visit often enough, and they'll share their secrets."*

- **Entry**: **Any ♦ Diamond card** may be played to visit the Graveyard, regardless of rank. This makes it the only building accessible with any Diamond draw you cannot or choose not to spend elsewhere — an exhausted building's Diamond is never truly wasted.
- **Visit Effect**: Gain **Soul Markers** based on the rank of the Diamond card played:

  | Card Ranks | Soul Markers Gained |
  |---|---|
  | 2–4 | 1 Soul |
  | 5–8 | 2 Souls |
  | 9–10 | 3 Souls |
  | J / Q / K | 4 Souls |
  | A | 5 Souls |

- **Soul Markers** are a persistent resource tracked on the character sheet. Spend them at any time during your turn:

  | Cost | Effect |
  |---|---|
  | 1 Soul | Heal 1 Wound (any body location) |
  | 2 Souls | Gain 1 Supply **or** 1 Mana |
  | 3 Souls | Gain 2 Gold |
  | 5 Souls | Gain 1 XP **or** 1 Color Energy of choice |
  | 8 Souls | Advance any Scoring Track +1 |

- **Soul Accumulation Track**: Track total Souls **ever gained** (does not decrease when you spend). Milestones:
  - **5 Souls accumulated**: Discovery +1
  - **10 Souls accumulated**: Arcana +1 + gain 1 Mana
  - **15 Souls accumulated**: All four Scoring Tracks +1
- **No Visit Cap**: The Graveyard never exhausts — you may visit as many times as you have Diamond cards to play.
- **Use Limit**: **Per-player** — each player keeps their own Soul pool and accumulation track. No shared resource competition.
- **Necromancer Synergy**: The Necromancer class gains **+1 bonus Soul** on every Graveyard visit.
- **Purpose**: Flexible fallback for off-rank Diamond cards, and a standalone engine for Discovery/Arcana builds. The Soul pricing ladder makes even 1-soul visits meaningful (wound healing) while high accumulation unlocks scoring power comparable to any 4th-visit milestone.

---

## Building Summary Table

| Rank | Building | Primary Output | Visit Track | Milestone (Mid) | Milestone (Full) |
|------|----------|---------------|------------|-----------------|-----------------|-------------|
| 2 | Stables | Supply | 4 slots | 2 visits: +2 Supply | 4 visits: +2 Supply, +1 XP | Per player |
| 3 | Tavern | Heal or Gold | 4 slots | 2 visits: Partial heal-all | 4 visits: Fortune +1, heal 3 | Per player |
| 4 | Market Square | Gold (×resource types) | 5 slots | 3 visits: +3 Gold | 5 visits: +3 Gold, Fortune +1 | Per player |
| 5 | Herbalist | Color Energy | 6 slots (3×2 grid) | Row 1: +1 Mana | Row 2: Full rainbow | Per player |
| 6 | Blacksmith | Armor | 4 slots | 2 visits: +2 Armor | 4 visits: Armor all locations | Per player |
| 7 | Mage's Workshop | Mana | 5 slots | 3 visits: +2 Mana, Arcana +1 | 5 visits: +3 Mana, Arcana +2, Energy | Per player |
| 8 | Guild Hall | XP | 4 slots (scaling) | 2nd visit: +2 XP | 4 visits: +3 XP, Champion +1 | Per player |
| 9 | Scholar's Archive | XP or Discovery +1 | 4 slots | 2 visits: XP + Discovery +1 | 4 visits: Discovery +2, Scry Token | Per player |
| 10 | The Bank | Gold + per-round interest | 6 slots (2×3 grid) | Row 1: +4 Gold, Fortune +1 | Row 2: +5 Gold, Fortune +2 | Global limit: 3 deposits |
| J | Thieves' Guild | 2 free resources + Crown Heist | 4 slots (fixed) | Slot 2: +Supply | Slot 4: Fortune +1 | Per player |
| Q | Temple | Heal 3 or Clear 1 + Royal Pardon | 4 slots | 2 visits: Clear 2 locations | 4 visits: Full heal, Fortune +1 | Per player |
| K | Royal Keep | Any score track +1 (Crown Authority: ×2 on K♦) | 4 slots | 2 visits: Score +1, +2 Gold | 4 visits: All tracks +1 | Global limit: configurable |
| A | Arcane Academy | 2 Color Energies + Arcana +1 | 5 slots | 3 visits: Full rainbow + Arcana +1 | 5 visits: +3 Mana, Arcana +3, Fortune +1 | Global limit: configurable |
| ♦ (any) | The Graveyard | Soul Markers (rank-scaled) | No cap — accumulation track | 5 souls ever: Discovery +1 | 15 souls ever: All tracks +1 | Per player |

---

## Scoring Integration

The City Board feeds all four scoring categories but skews toward **Fortune** (wealth) and **Arcana** (magic):

| Scoring Category | Primary city building(s) |
|---|---|
| Fortune | Market Square, The Bank, Tavern (4th visit), Thieves' Guild (4th slot), Temple (4th visit), Royal Keep |
| Arcana | Mage's Workshop, Scholar's Archive (spend), Temple (spend), Arcane Academy |
| Champion | Guild Hall (4th visit), Royal Keep (player choice) |
| Discovery | Scholar's Archive, Royal Keep (player choice) |

---

## Economy Loops

Several natural resource loops exist across buildings:

**Gold Loop** (fortune path):
> Stables (supply) → Market Square (trade supplies for gold) → The Bank (convert gold to Fortune)

**Mana-Arcana Loop** (arcana path):
> Mage's Workshop (mana) → Arcane Academy (spend mana for extra energies + arcana) → Scholar's Archive (spend mana for Arcana +2)

**Recovery Loop** (survivability path):
> Tavern (minor wounds) → Blacksmith (restock armor) → Temple (major wounds)

**XP Loop** (champion/level path):
> Guild Hall (XP + Champion) → Scholar's Archive (XP + Discovery) → Royal Keep (boost any track)

---

## Special Rules and Edge Cases

### Exhausted Buildings
Once all visit slots are filled, a building is **exhausted** — no further visits, even with the correct rank Diamond card. If you play a Diamond card matching an exhausted building, you may **not** visit the city with that card (it is wasted, unless an ability redirects it).

> **Design variant to consider**: Allow exhausted buildings to still be visited for a *single flat resource* (e.g., 1 Gold) but no milestone bonuses — gives Diamond cards continued value late game.

### Face Cards and City Access
In the base game, J/Q/K drawn from the deck trigger automatic encounters. If a player ability or action **redirects a diamond face card to the city instead of triggering the encounter**, they visit the corresponding Noble District building.

### The Deposit System (Bank)
The Bank uses a **per-round interest** model:

**Making a Deposit** (on any Bank visit, one active deposit per player at a time):
- **Small Deposit** (5 Gold): Place a Small Deposit Marker. Gain **1 Gold + Fortune +1** at the end of each subsequent round.
- **Large Deposit** (10 Gold): Place a Large Deposit Marker. Gain **2 Gold + Fortune +2** at the end of each subsequent round.

**Upgrading**: On a future Bank visit, pay an additional 5 Gold to upgrade a Small Deposit to a Large Deposit.

**Global Cap**: A maximum of **3 total active deposits** allowed across all players (default; configurable). Once 3 deposits exist, no new deposits can be opened, but existing ones still pay interest and can be upgraded.

**Timing**: Interest is collected at the end of each full round, beginning the round *after* the deposit is placed.

### The Scry Token (Scholar's Archive)
The Scry Token modifies your next card draw:
- Before drawing your next card, look at the **top 2 cards** of the draw pile.
- Choose which one to draw; the unchosen card returns to the top.
- One-time use per token. You may hold only one Scry Token at a time.
- An **unused Scry Token at game end confers no bonus** — use it or lose it.

---

## Board Layout (Visual Design Notes)

The City Board should feel like a **parchment map of a small city** — buildings laid out geographically with illustrated facades, organized by district.

**Suggested layout** (4-column grid, 4 rows):

```
┌─────────────────────────────────────────────────────┐
│  CITY BOARD              ♦ Diamond Entry Required   │
│  ─────────────────────────────────────────────────  │
│  COMMONS DISTRICT                                   │
│  [Stables ♦2] [Tavern ♦3] [Market Square ♦4]  │
│  ─────────────────────────────────────────────────  │
│  CRAFTERS' ROW                                      │
│  [Herbalist ♦5] [Blacksmith ♦6]                │
│  [Mage's Workshop ♦7] [Guild Hall ♦8]          │
│  ─────────────────────────────────────────────────  │
│  MERCHANT QUARTER                                   │
│  [Scholar's Archive ♦9] [The Bank ♦10]         │
│  ─────────────────────────────────────────────────  │
│  NOBLE DISTRICT                                     │
│  [Thieves' Guild ♦J] [Temple ♦Q]               │
│  [Royal Keep ♦K]                                   │
│  ─────────────────────────────────────────────────  │
│  [  ARCANE ACADEMY  ♦A  — premium building  ]      │
└─────────────────────────────────────────────────────┘
```

Each building "card" within the board should show:
1. **Rank badge** (♦ + number/letter) — top left corner
2. **Building name and icon**
3. **Visit effect** — displayed prominently
4. **Track bubbles** — fillable circles in a row or grid
5. **Milestone labels** printed below or beside the relevant circle
6. **Spend box** (if applicable) — clearly offset with a "spend:" label and dashed border

---

## Data Model (Additions to `src/types.ts`)

```ts
// Visit track for a single city building
export interface CityBuildingState {
  rank: CardValue | 'wild'; // '2'–'A' or 'wild' (Graveyard)
  visits: number;           // current visit count (0 to visitCap; 0 cap = no limit)
  visitCap: number;         // max visits before exhausted (0 = no cap)
  depositLevel?: 0 | 1 | 2; // Bank only — 0=none, 1=small (5g/round), 2=large (10g/round)
  scryTokens?: number;      // Scholar's Archive only
  soulsGained?: number;     // Graveyard only — total souls ever accumulated (for milestone)
  soulsAvailable?: number;  // Graveyard only — current spendable soul markers
}

// Full city board state, persisted alongside CharacterState
export interface CityBoardState {
  buildings: CityBuildingState[];   // 14 entries (13 rank-based + Graveyard)
  globalDepositCount: number;       // across all players; capped at 3 by default (configurable)
}

export const DEFAULT_CITY_BOARD: CityBoardState = {
  globalDepositCount: 0,
  buildings: [
    { rank: '2',   visits: 0, visitCap: 4 },              // Stables
    { rank: '3',   visits: 0, visitCap: 4 },              // Tavern
    { rank: '4',   visits: 0, visitCap: 5 },              // Market Square
    { rank: '5',   visits: 0, visitCap: 6 },              // Herbalist
    { rank: '6',   visits: 0, visitCap: 4 },              // Blacksmith
    { rank: '7',   visits: 0, visitCap: 5 },              // Mage's Workshop
    { rank: '8',   visits: 0, visitCap: 4 },              // Guild Hall
    { rank: '9',   visits: 0, visitCap: 4 },              // Scholar's Archive
    { rank: '10',  visits: 0, visitCap: 6 },              // The Bank
    { rank: 'J',   visits: 0, visitCap: 4 },              // Thieves' Guild
    { rank: 'Q',   visits: 0, visitCap: 4 },              // Temple of the Fading Light
    { rank: 'K',   visits: 0, visitCap: 4 },              // Royal Keep
    { rank: 'A',   visits: 0, visitCap: 5 },              // Arcane Academy
    { rank: 'wild', visits: 0, visitCap: 0, soulsGained: 0, soulsAvailable: 0 }, // Graveyard
  ],
};
```

> **Note**: The `CityBoardState` should be stored in `localStorage` under a `cityBoardState` key, alongside `characterState`.

---

## Component Structure Notes

**`src/components/CityBoard.tsx`** — primary board component:
- Receives `cityState: CityBoardState`, `character: CharacterState`, `onChange` callbacks
- Renders 13 `BuildingCard` sub-components in district groups
- Shows an "exhausted" overlay if `visits >= visitCap`

**`src/components/BuildingCard.tsx`** — individual building panel:
- Props: building config (name, rank, effects, milestones), current visit state
- Renders clickable visit circles (click to add a visit)
- Highlights the next unfilled milestone
- Shows optional spend button if applicable
- Handles the Bank's deposit marker toggle

**`src/utils/cityLogic.ts`** — game logic:
- `applyVisitEffect(rank, character, cityState)`: Applies visit effect + milestone bonuses to character state
- `getMilestones(rank)`: Returns milestone thresholds and payouts for a building
- `isExhausted(buildingState)`: `visits >= visitCap`
- `canVisit(card, cityState)`: Validates that the played card allows visiting the city and matching building

---

## Design Decisions Log

The following questions from the initial design have been resolved:

| # | Question | Decision |
|---|---------|---------|
| 1 | Rank collision on exhausted buildings | **Resolved**: The Graveyard (wild rank) serves as the fallback destination for any Diamond card whose matching building is exhausted. Direct rank redirects to other buildings are not allowed. |
| 2 | Multiple city visits per game / use limits | **Resolved**: Default hand is 2 cards per turn (stat-scaled; TBD). Two Diamond draws in one turn allow two city visits. Buildings are classified as **Per-Player** (personal track, no competition) or **Globally Limited** (shared cap, competitive). See Use Limit column in the Building Summary Table. |
| 3 | Face card Diamond interaction | **Resolved**: Auto-encounters apply to the Dungeon only — not the City. Face card Diamonds (J♦, Q♦, K♦) access the Noble District as normal plays, each with a unique **secondary noble ability**: Crown Heist (J), Royal Pardon (Q), Crown Authority (K). |
| 4 | Deposit token timing and levels | **Resolved**: Two deposit levels (Small: 5 Gold, Large: 10 Gold). Interest paid **per round** starting the round after placement. Small = 1 Gold + Fortune +1/round; Large = 2 Gold + Fortune +2/round. Upgradeable. Global cap of 3 deposits (configurable). |
| 5 | Peek token carry-over | **Resolved** (renamed to **Scry Token**): An unused Scry Token at game end confers no bonus — use it or lose it. |
| 6 | Random city building configuration | **Resolved**: Buildings have default rank assignments but are **configurable per game session**. A randomized setup option (shuffling building types to ranks) is planned for replayability. |

---

## Remaining Open Questions

1. **Hand size stat**: Which character stat governs cards drawn per turn? (Default 2; candidates: Mind, Agility)
2. **Graveyard soul cap**: Is there a maximum number of Soul Markers a player may hold at once? (Suggested: 15, matching the accumulation track max)
3. **Deposit upgrade with exhausted Bank**: If the Bank visit track is fully exhausted, can a player still make or upgrade a deposit without claiming a visit?
4. **Royal Pardon scope**: Can Q♦'s Royal Pardon un-exhaust globally-limited buildings (Arcane Academy, Royal Keep), or only per-player buildings?
5. **Necromancer class graveyard synergy**: Confirm the Necromancer's +1 soul bonus is defined in the class skill list, not hard-coded to the board.
