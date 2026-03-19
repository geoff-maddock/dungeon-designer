import React, { useState } from 'react';
import { CityBoardState, CityBuildingState, DEFAULT_CITY_BOARD, CharacterState, CardValue, CardDraw } from '../types';
import {
  CITY_BUILDINGS,
  CityBuildingConfig,
  CityDistrict,
  isExhausted,
  soulsForRank,
  SOUL_SPEND_TABLE,
} from '../utils/cityLogic';
import DeckPanel, { getCardColor, getSuitSymbol } from './DeckPanel';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CityBoardProps {
  cityState: CityBoardState;
  character: CharacterState;
  onCityChange: (updated: CityBoardState) => void;
  onCharacterChange: (updated: CharacterState) => void;
  // Shared deck
  deck: CardDraw[];
  drawnCards: CardDraw[];
  deckCount: number;
  onDrawCard: () => CardDraw | null;
  onDeckCountChange: (n: number) => void;
  onResetDeck: () => void;
}

// ---------------------------------------------------------------------------
// City deck guidance panel
// ---------------------------------------------------------------------------

function CityDeckGuidance({ lastCard }: { lastCard: CardDraw | undefined }) {
  if (!lastCard) return null;
  const isFace = ['J', 'Q', 'K'].includes(lastCard.value);
  const isDiamond = lastCard.suit === 'diamonds';
  const suitSymbol = getSuitSymbol(lastCard.suit);
  const cardLabel = `${lastCard.value}${suitSymbol}`;
  const colorClass = getCardColor(lastCard.suit);

  if (!isDiamond) {
    return (
      <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded p-2">
        <span className={`font-bold ${colorClass}`}>{cardLabel}</span> drawn — no City action for {lastCard.suit} cards.
      </div>
    );
  }

  const matchingBuilding = CITY_BUILDINGS.find(b => b.cardValue === lastCard.value);
  const buildingName = matchingBuilding?.name ?? 'unknown';

  return (
    <div className="text-sm bg-amber-50 border border-amber-300 rounded p-2 space-y-0.5">
      <div>
        <span className={`font-bold ${colorClass}`}>{cardLabel}</span> drawn —{' '}
        {matchingBuilding
          ? <span>visit <strong>{buildingName}</strong> or redirect to Graveyard if exhausted.</span>
          : <span>visit Graveyard (wild ♦).</span>}
      </div>
      {isFace && (
        <div className="text-amber-700 text-xs">Noble ability: check the {buildingName} milestone for special rewards.</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Visit circle component
// ---------------------------------------------------------------------------

function VisitCircles({
  visits,
  visitCap,
  layout,
  onVisit,
  milestoneThresholds,
}: {
  visits: number;
  visitCap: number;
  layout?: 'row' | 'grid';
  onVisit: (newCount: number) => void;
  milestoneThresholds: number[];
}) {
  if (visitCap === 0) return null;

  const handleClick = (index: number) => {
    // Click a filled circle to un-fill it; click an empty circle to fill up to it
    const newCount = index < visits ? index : index + 1;
    onVisit(Math.min(newCount, visitCap));
  };

  const circles = Array.from({ length: visitCap }, (_, i) => {
    const filled = i < visits;
    const isMilestone = milestoneThresholds.includes(i + 1);
    return (
      <button
        key={i}
        onClick={() => handleClick(i)}
        title={`Visit ${i + 1}${isMilestone ? ' — Milestone!' : ''}`}
        className={[
          'w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center flex-shrink-0',
          filled
            ? 'bg-amber-500 border-amber-600 shadow-inner'
            : 'bg-white border-gray-300 hover:border-amber-400',
          isMilestone && !filled ? 'border-amber-500 ring-1 ring-amber-400' : '',
          isMilestone && filled ? 'ring-2 ring-amber-300' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {isMilestone && (
          <span className={`text-xs font-bold leading-none ${filled ? 'text-white' : 'text-amber-500'}`}>
            ★
          </span>
        )}
      </button>
    );
  });

  if (layout === 'grid') {
    const rows: React.ReactNode[][] = [circles.slice(0, 3), circles.slice(3)];
    return (
      <div className="flex flex-col gap-0.5">
        {rows.map((row, r) => (
          <div key={r} className="flex gap-1">{row}</div>
        ))}
      </div>
    );
  }

  return <div className="flex gap-1 flex-wrap">{circles}</div>;
}

// ---------------------------------------------------------------------------
// Individual building card
// ---------------------------------------------------------------------------

interface BuildingCardProps {
  config: CityBuildingConfig;
  state: CityBuildingState;
  onStateChange: (updated: CityBuildingState) => void;
  globalDepositCount: number;
  onGlobalDepositChange: (delta: number) => void;
}

function BuildingCard({
  config,
  state,
  onStateChange,
  globalDepositCount,
  onGlobalDepositChange,
}: BuildingCardProps) {
  const exhausted = isExhausted(state.visits, state.visitCap);
  const milestoneThresholds = config.milestones.map(m => m.threshold);

  const handleVisit = (newCount: number) => {
    if (exhausted && newCount > state.visits) return;
    onStateChange({ ...state, visits: newCount });
  };

  // ── Bank deposit controls ──────────────────────────────────────────────
  const isBank = config.rank === '10';
  const depositLevel = state.depositLevel ?? 0;
  const MAX_DEPOSITS = 3;

  const handleDeposit = (level: 1 | 2) => {
    if (depositLevel === 0) {
      if (globalDepositCount >= MAX_DEPOSITS) return;
      onGlobalDepositChange(1);
      onStateChange({ ...state, depositLevel: level });
    } else if (level === 2 && depositLevel === 1) {
      onStateChange({ ...state, depositLevel: 2 });
    }
  };

  const handleRemoveDeposit = () => {
    if (depositLevel === 0) return;
    onGlobalDepositChange(-1);
    onStateChange({ ...state, depositLevel: 0 });
  };

  // ── Scholar's Archive scry token ───────────────────────────────────────
  const isArchive = config.rank === '9';
  const scryTokens = state.scryTokens ?? 0;

  // ── Graveyard soul controls ────────────────────────────────────────────
  const isGraveyard = config.rank === 'wild';
  const soulsAvailable = state.soulsAvailable ?? 0;
  const soulsGained = state.soulsGained ?? 0;

  const handleAddSouls = (rankKey: CardValue) => {
    const gained = soulsForRank(rankKey);
    onStateChange({
      ...state,
      visits: state.visits + 1,
      soulsAvailable: soulsAvailable + gained,
      soulsGained: soulsGained + gained,
    });
  };

  const handleSpendSouls = (cost: number) => {
    if (soulsAvailable < cost) return;
    onStateChange({ ...state, soulsAvailable: soulsAvailable - cost });
  };

  // ── District styling ───────────────────────────────────────────────────
  const districtBorder: Record<CityDistrict, string> = {
    Commons: 'border-green-400',
    "Crafters' Row": 'border-blue-400',
    'Merchant Quarter': 'border-yellow-400',
    'Noble District': 'border-purple-400',
    'Special District': 'border-gray-400',
  };
  const districtBg: Record<CityDistrict, string> = {
    Commons: 'bg-green-50',
    "Crafters' Row": 'bg-blue-50',
    'Merchant Quarter': 'bg-yellow-50',
    'Noble District': 'bg-purple-50',
    'Special District': 'bg-gray-50',
  };
  const rankBadge: Record<CityDistrict, string> = {
    Commons: 'bg-green-100 text-green-800 border-green-300',
    "Crafters' Row": 'bg-blue-100 text-blue-800 border-blue-300',
    'Merchant Quarter': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'Noble District': 'bg-purple-100 text-purple-800 border-purple-300',
    'Special District': 'bg-gray-100 text-gray-700 border-gray-300',
  };

  return (
    <div
      className={[
        'relative rounded-lg border-2 p-3 flex flex-col gap-2 shadow-sm',
        districtBorder[config.district],
        districtBg[config.district],
        exhausted ? 'opacity-60' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Exhausted overlay badge */}
      {exhausted && (
        <div className="absolute inset-0 rounded-lg flex items-center justify-center pointer-events-none">
          <span className="bg-gray-800 text-white text-xs font-bold px-2 py-0.5 rounded shadow rotate-[-12deg]">
            EXHAUSTED
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${rankBadge[config.district]}`}>
            ♦{config.rank === 'wild' ? '★' : config.rank}
          </span>
          <span className="text-base leading-none">{config.icon}</span>
          <span className="text-sm font-semibold text-gray-800 leading-tight">{config.name}</span>
        </div>
        {state.visitCap > 0 && (
          <span className="text-xs text-gray-500 flex-shrink-0">{state.visits}/{state.visitCap}</span>
        )}
      </div>

      {/* Visit effect */}
      <p className="text-xs text-gray-700 leading-snug">{config.visitEffect}</p>

      {/* Visit track */}
      {state.visitCap > 0 && (
        <div className="flex flex-col gap-1">
          <VisitCircles
            visits={state.visits}
            visitCap={state.visitCap}
            layout={config.trackLayout}
            onVisit={handleVisit}
            milestoneThresholds={milestoneThresholds}
          />
          <div className="flex flex-col gap-0.5">
            {config.milestones.map(m => (
              <div
                key={m.threshold}
                className={`text-xs flex items-start gap-1 ${state.visits >= m.threshold ? 'text-amber-700 font-medium' : 'text-gray-500'
                  }`}
              >
                <span className="flex-shrink-0 font-medium">⬦{m.threshold}:</span>
                <span>{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optional spend */}
      {config.optionalSpend && (
        <div className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-2 py-1 italic">
          <span className="font-semibold not-italic">Spend:</span> {config.optionalSpend}
        </div>
      )}

      {/* Special / Noble ability */}
      {config.specialAbility && (
        <div className="text-xs text-purple-700 bg-purple-50 border border-purple-200 rounded px-2 py-1">
          <span className="font-semibold">★ Noble:</span> {config.specialAbility}
        </div>
      )}

      {/* ── Bank deposit panel ─────────────────────────────────────────── */}
      {isBank && (
        <div className="bg-yellow-100 border border-yellow-300 rounded p-2 flex flex-col gap-1">
          <p className="text-xs font-semibold text-yellow-800">Deposit</p>
          {depositLevel === 0 ? (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleDeposit(1)}
                disabled={globalDepositCount >= MAX_DEPOSITS}
                className="text-xs bg-yellow-400 hover:bg-yellow-500 disabled:opacity-40 text-yellow-900 font-medium px-2 py-0.5 rounded"
              >
                Small (5g)
              </button>
              <button
                onClick={() => handleDeposit(2)}
                disabled={globalDepositCount >= MAX_DEPOSITS}
                className="text-xs bg-yellow-500 hover:bg-yellow-600 disabled:opacity-40 text-white font-medium px-2 py-0.5 rounded"
              >
                Large (10g)
              </button>
              {globalDepositCount >= MAX_DEPOSITS && (
                <span className="text-xs text-red-600 font-medium">Global cap reached</span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${depositLevel === 2 ? 'bg-amber-500 text-white' : 'bg-yellow-300 text-yellow-900'}`}>
                {depositLevel === 1 ? 'Small Deposit' : 'Large Deposit'}
              </span>
              <span className="text-xs text-yellow-800">
                +{depositLevel === 1 ? '1g + Fortune +1' : '2g + Fortune +2'}/round
              </span>
              {depositLevel === 1 && (
                <button
                  onClick={() => handleDeposit(2)}
                  className="text-xs bg-amber-400 hover:bg-amber-500 text-amber-900 font-medium px-2 py-0.5 rounded"
                >
                  Upgrade (+5g)
                </button>
              )}
              <button
                onClick={handleRemoveDeposit}
                className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-600 px-2 py-0.5 rounded"
              >
                Close
              </button>
            </div>
          )}
          <p className="text-xs text-yellow-700">Global deposits: {globalDepositCount}/{MAX_DEPOSITS}</p>
        </div>
      )}

      {/* ── Scholar's Archive scry token panel ────────────────────────── */}
      {isArchive && (
        <div className="bg-indigo-50 border border-indigo-200 rounded p-2 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-indigo-800">Scry Tokens:</span>
          <span className="text-sm font-bold text-indigo-700">{scryTokens}</span>
          <button
            onClick={() => onStateChange({ ...state, scryTokens: scryTokens + 1 })}
            className="text-xs bg-indigo-200 hover:bg-indigo-300 text-indigo-800 px-1.5 py-0.5 rounded"
          >
            +
          </button>
          <button
            onClick={() => onStateChange({ ...state, scryTokens: Math.max(0, scryTokens - 1) })}
            disabled={scryTokens === 0}
            className="text-xs bg-indigo-200 hover:bg-indigo-300 disabled:opacity-40 text-indigo-800 px-1.5 py-0.5 rounded"
          >
            −
          </button>
          <span className="text-xs text-indigo-600 italic">
            {scryTokens > 0 ? 'Look at top 2 cards before drawing' : 'Earned at 4 visits'}
          </span>
        </div>
      )}

      {/* ── Graveyard soul panel ───────────────────────────────────────── */}
      {isGraveyard && (
        <div className="flex flex-col gap-2">
          {/* Soul totals */}
          <div className="bg-gray-100 border border-gray-300 rounded p-2 flex gap-4 items-center">
            <div>
              <div className="text-xs text-gray-500">Available</div>
              <div className="text-2xl font-bold text-gray-800 leading-none">{soulsAvailable}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Accumulated (total)</div>
              <div className="text-lg font-semibold text-gray-600 leading-none">{soulsGained}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Visits</div>
              <div className="text-lg font-semibold text-gray-600 leading-none">{state.visits}</div>
            </div>
          </div>

          {/* Add souls by card rank */}
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-gray-700">Record visit (by ♦ rank):</p>
            <div className="flex flex-wrap gap-1">
              {(['2', '5', '9', 'J', 'A'] as CardValue[]).map(r => (
                <button
                  key={r}
                  onClick={() => handleAddSouls(r)}
                  title={`♦${r} → +${soulsForRank(r)} Soul(s)`}
                  className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-1.5 py-0.5 rounded font-medium"
                >
                  ♦{r} +{soulsForRank(r)}
                </button>
              ))}
            </div>
          </div>

          {/* Accumulation milestones */}
          <div className="flex flex-col gap-0.5">
            {config.milestones.map(m => (
              <div
                key={m.threshold}
                className={`text-xs flex items-start gap-1 ${soulsGained >= m.threshold ? 'text-amber-700 font-medium' : 'text-gray-500'
                  }`}
              >
                <span className="flex-shrink-0 font-medium">⬦{m.threshold}:</span>
                <span>{m.label}</span>
              </div>
            ))}
          </div>

          {/* Spend table */}
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-gray-700">Spend Souls:</p>
            <div className="flex flex-col gap-0.5">
              {SOUL_SPEND_TABLE.map(({ cost, effect }) => (
                <button
                  key={cost}
                  onClick={() => handleSpendSouls(cost)}
                  disabled={soulsAvailable < cost}
                  className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-700 px-2 py-0.5 rounded text-left"
                >
                  <span className="font-bold text-gray-800 w-4 flex-shrink-0">{cost}</span>
                  <span>→ {effect}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// District section wrapper
// ---------------------------------------------------------------------------

function DistrictSection({
  title,
  icon,
  buildings,
  cityState,
  onBuildingChange,
  globalDepositCount,
  onGlobalDepositChange,
}: {
  title: CityDistrict;
  icon: string;
  buildings: CityBuildingConfig[];
  cityState: CityBoardState;
  onBuildingChange: (rank: CardValue | 'wild', updated: CityBuildingState) => void;
  globalDepositCount: number;
  onGlobalDepositChange: (delta: number) => void;
}) {
  const headerBg: Record<CityDistrict, string> = {
    Commons: 'bg-green-700',
    "Crafters' Row": 'bg-blue-700',
    'Merchant Quarter': 'bg-yellow-700',
    'Noble District': 'bg-purple-700',
    'Special District': 'bg-gray-700',
  };

  return (
    <div className="flex flex-col gap-2">
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded text-white text-sm font-bold ${headerBg[title]}`}>
        <span>{icon}</span>
        <span>{title}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 px-1">
        {buildings.map(config => {
          const buildingState = cityState.buildings.find(b => b.rank === config.rank);
          if (!buildingState) return null;
          return (
            <BuildingCard
              key={String(config.rank)}
              config={config}
              state={buildingState}
              onStateChange={updated => onBuildingChange(config.rank, updated)}
              globalDepositCount={globalDepositCount}
              onGlobalDepositChange={onGlobalDepositChange}
            />
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main CityBoard
// ---------------------------------------------------------------------------

export default function CityBoard({
  cityState,
  onCityChange,
  deck,
  drawnCards,
  deckCount,
  onDrawCard,
  onDeckCountChange,
  onResetDeck,
}: CityBoardProps) {
  const [showHelp, setShowHelp] = useState(false);
  const lastDrawnCard = drawnCards.length > 0 ? drawnCards[drawnCards.length - 1] : undefined;

  const handleBuildingChange = (rank: CardValue | 'wild', updated: CityBuildingState) => {
    onCityChange({
      ...cityState,
      buildings: cityState.buildings.map(b => (b.rank === rank ? updated : b)),
    });
  };

  const handleGlobalDepositChange = (delta: number) => {
    onCityChange({
      ...cityState,
      globalDepositCount: Math.max(0, cityState.globalDepositCount + delta),
    });
  };

  const handleReset = () => {
    if (!window.confirm('Reset all city building visit tracks? This cannot be undone.')) return;
    onCityChange(DEFAULT_CITY_BOARD);
  };

  const exhaustedCount = cityState.buildings.filter(b => b.visitCap > 0 && isExhausted(b.visits, b.visitCap)).length;
  const totalCapped = cityState.buildings.filter(b => b.visitCap > 0).length;

  const districts: { title: CityDistrict; icon: string }[] = [
    { title: 'Commons', icon: '🏘️' },
    { title: "Crafters' Row", icon: '🔨' },
    { title: 'Merchant Quarter', icon: '⚖️' },
    { title: 'Noble District', icon: '🏰' },
    { title: 'Special District', icon: '💀' },
  ];

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <header className="bg-amber-700 text-white p-4 shadow-md flex-shrink-0">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-bold">City Board</h2>
            <p className="text-amber-200 text-sm">♦ Diamond cards required to visit buildings</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm bg-amber-800 px-2 py-1 rounded">
              {exhaustedCount}/{totalCapped} exhausted
            </span>
            <span className="text-sm bg-amber-800 px-2 py-1 rounded">
              Deposits: {cityState.globalDepositCount}/3
            </span>
            <button
              onClick={() => setShowHelp(h => !h)}
              className="bg-amber-600 hover:bg-amber-500 px-3 py-1 rounded text-sm"
            >
              {showHelp ? 'Hide Help' : 'How to Play'}
            </button>
            <button
              onClick={handleReset}
              className="bg-red-700 hover:bg-red-600 px-3 py-1 rounded text-sm"
            >
              Reset All
            </button>
          </div>
        </div>

        {showHelp && (
          <div className="mt-3 bg-amber-800 rounded p-3 text-sm text-amber-100 space-y-1 max-w-3xl">
            <p><strong>Entry:</strong> Spend a ♦ Diamond card to visit the building matching its rank.</p>
            <p><strong>Visiting:</strong> Click the next empty circle to record a visit. Milestone circles (★) trigger bonus rewards when filled.</p>
            <p><strong>Exhausted:</strong> When all circles are filled, the building is exhausted — redirect that Diamond to the Graveyard instead.</p>
            <p><strong>Bank:</strong> Pay Gold on a Bank visit to open a deposit that earns Gold + Fortune each round. Max 3 active deposits globally.</p>
            <p><strong>Graveyard:</strong> Any ♦ card may visit the Graveyard. Select its rank to record Souls gained. Spend Souls for resources at any time.</p>
          </div>
        )}
      </header>

      {/* Board */}
      <main className="flex-1 overflow-auto p-4 bg-amber-50 flex flex-col gap-4">
        {/* Deck Panel */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <DeckPanel
            deck={deck}
            drawnCards={drawnCards}
            deckCount={deckCount}
            onDraw={onDrawCard}
            onReset={onResetDeck}
            onDeckCountChange={onDeckCountChange}
          >
            <CityDeckGuidance lastCard={lastDrawnCard} />
          </DeckPanel>
        </div>

        {districts.map(({ title, icon }) => {
          const buildings = CITY_BUILDINGS.filter(b => b.district === title);
          if (buildings.length === 0) return null;
          return (
            <DistrictSection
              key={title}
              title={title}
              icon={icon}
              buildings={buildings}
              cityState={cityState}
              onBuildingChange={handleBuildingChange}
              globalDepositCount={cityState.globalDepositCount}
              onGlobalDepositChange={handleGlobalDepositChange}
            />
          );
        })}
      </main>
    </div>
  );
}
