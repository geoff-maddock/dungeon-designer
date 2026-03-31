import React from 'react';
import { CharacterState, ScoringCategory } from '../types';

// Vibonacci (Fibonacci) sequence: index = wound count, value = points deducted.
// wounds: 0  1  1  2  3   5   8   13  21  34  55
const VIBONACCI = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55];

function woundPenalty(wounds: number): number {
  return VIBONACCI[Math.min(wounds, VIBONACCI.length - 1)];
}

const SCORING_ICONS: Record<ScoringCategory, string> = {
  discovery: '🔍',
  champion: '🏆',
  arcana: '✨',
  fortune: '🍀',
};

interface GameOverScreenProps {
  character: CharacterState;
  onNewGame: () => void;
}

export default function GameOverScreen({ character, onNewGame }: GameOverScreenProps) {
  const { scoring, wounds } = character;

  const cats: ScoringCategory[] = ['discovery', 'champion', 'arcana', 'fortune'];
  const scoringTotal = cats.reduce((sum, c) => sum + (scoring[c] ?? 0), 0);
  const penalty = woundPenalty(wounds);
  const finalScore = scoringTotal - penalty;

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
      <div className="bg-stone-900 text-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col gap-5 overflow-hidden">

        {/* Header */}
        <div className="bg-stone-800 px-8 py-6 text-center border-b border-stone-700">
          <div className="text-4xl mb-2">⚰️</div>
          <h1 className="text-3xl font-bold tracking-widest text-amber-400 uppercase">Game Over</h1>
          <p className="text-stone-400 text-sm mt-1">The deck has been exhausted</p>
        </div>

        <div className="px-8 flex flex-col gap-4 pb-8">
          {/* Scoring tracks */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-2">
              Scoring Tracks
            </h2>
            <div className="flex flex-col gap-1">
              {cats.map(cat => (
                <div key={cat} className="flex items-center justify-between py-1.5 border-b border-stone-800">
                  <span className="flex items-center gap-2 text-stone-300 capitalize">
                    <span>{SCORING_ICONS[cat]}</span>
                    <span>{cat}</span>
                  </span>
                  <span className="font-bold text-lg text-white tabular-nums">
                    {scoring[cat] ?? 0}
                  </span>
                </div>
              ))}

              <div className="flex justify-between items-center pt-2">
                <span className="text-stone-300 font-semibold">Subtotal</span>
                <span className="font-bold text-xl text-white tabular-nums">{scoringTotal}</span>
              </div>
            </div>
          </div>

          {/* Wound penalty */}
          <div className="bg-red-950/60 border border-red-800 rounded-lg px-4 py-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-red-300 font-semibold">
                <span>💔</span>
                <span>Wounds ({wounds})</span>
              </span>
              <span className="font-bold text-xl text-red-400 tabular-nums">−{penalty}</span>
            </div>
            <p className="text-[10px] text-red-500/80 leading-relaxed">
              Vibonacci penalty: 0→0 · 1→1 · 2→1 · 3→2 · 4→3 · 5→5 · 6→8 · 7→13 · 8→21 · 9→34 · 10→55
            </p>
          </div>

          {/* Final score */}
          <div className={[
            'border-2 rounded-xl px-4 py-4 text-center',
            finalScore >= 0
              ? 'bg-amber-900/30 border-amber-500'
              : 'bg-red-900/30 border-red-500',
          ].join(' ')}>
            <p className="text-xs uppercase tracking-widest text-amber-300/80 mb-1">Final Score</p>
            <p className={`text-5xl font-bold tabular-nums ${finalScore >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
              {finalScore}
            </p>
            <p className="text-xs text-stone-500 mt-1">
              {scoringTotal} − {penalty} (wounds)
            </p>
          </div>

          {/* New game */}
          <button
            onClick={onNewGame}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold rounded-lg text-base transition-colors"
          >
            New Game
          </button>
        </div>
      </div>
    </div>
  );
}
