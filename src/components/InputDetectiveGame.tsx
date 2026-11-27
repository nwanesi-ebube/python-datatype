import React, { useState } from 'react';
import { CheckCircle2, Play, Search, Sparkles } from 'lucide-react';
import { INPUT_DETECTIVE_CASES } from '../data/moduleC';

interface InputDetectiveGameProps {
  bestScore: number;
  onScoreUpdate: (score: number, xpEarned: number) => void;
  onRunInTheatre: (code: string) => void;
}

export const InputDetectiveGame: React.FC<InputDetectiveGameProps> = ({
  bestScore,
  onScoreUpdate,
  onRunInTheatre,
}) => {
  const [caseIdx, setCaseIdx] = useState(0);
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  const [solvedIds, setSolvedIds] = useState<string[]>([]);

  const item = INPUT_DETECTIVE_CASES[caseIdx];

  const handlePick = (idx: number) => {
    if (pickedIdx !== null) return;
    setPickedIdx(idx);
    if (idx === item.correctIndex && !solvedIds.includes(item.id)) {
      const next = [...solvedIds, item.id];
      setSolvedIds(next);
      onScoreUpdate(next.length * 20, 20);
    }
  };

  const selectCase = (idx: number) => {
    setCaseIdx(idx);
    setPickedIdx(null);
  };

  return (
    <div className="h-full min-h-0 panel-scroll p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-[var(--text-primary)]">
            Input Detective
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Every program below runs without crashing, yet prints the wrong answer. Spot why!
          </p>
        </div>
        <div className="text-xs font-mono-tabular font-semibold text-[var(--text-primary)]">
          Cases solved: {solvedIds.length}/{INPUT_DETECTIVE_CASES.length} · Best: {bestScore}
        </div>
      </div>

      {/* Case Switcher */}
      <div className="flex flex-wrap gap-1.5">
        {INPUT_DETECTIVE_CASES.map((c, idx) => {
          const solved = solvedIds.includes(c.id);
          const active = idx === caseIdx;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => selectCase(idx)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                active
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] border-[var(--accent-primary)]'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-hairline)] hover:text-[var(--text-primary)]'
              }`}
            >
              {solved && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--semantic-success)]" />}
              <span>Case {idx + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Case File */}
      <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-[var(--accent-primary)]" />
            <h2 className="text-sm font-bold font-display">{item.title}</h2>
          </div>
          <span className="text-xs text-[var(--text-muted)]">{item.context}</span>
        </div>

        <pre className="p-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] font-mono-tabular text-xs overflow-x-auto m-0">
          {item.buggyCode}
        </pre>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="rounded-lg bg-[var(--bg-elevated)] p-2.5">
            <div className="text-[var(--text-muted)]">User Typed</div>
            <div className="font-mono-tabular font-bold mt-0.5">{item.sampleInput}</div>
          </div>
          <div className="rounded-lg bg-[var(--semantic-error-soft)] text-[var(--semantic-error-text)] p-2.5">
            <div>Actual Output</div>
            <div className="font-mono-tabular font-bold mt-0.5">{item.actualOutput}</div>
          </div>
          <div className="rounded-lg bg-[var(--semantic-success-soft)] text-[var(--semantic-success-text)] p-2.5">
            <div>Expected Output</div>
            <div className="font-mono-tabular font-bold mt-0.5">{item.expectedOutput}</div>
          </div>
        </div>
      </div>

      {/* Diagnosis Options */}
      <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-3">
        <div className="text-xs font-bold text-[var(--text-secondary)]">
          Why did the program give the wrong result?
        </div>
        <div className="space-y-2">
          {item.options.map((opt, idx) => {
            const isPicked = pickedIdx === idx;
            const isCorrect = idx === item.correctIndex;
            let cls =
              'border-[var(--border-hairline)] bg-[var(--bg-canvas)] hover:border-[var(--accent-primary)]';
            if (pickedIdx !== null) {
              if (isCorrect) {
                cls =
                  'border-[var(--semantic-success)] bg-[var(--semantic-success-soft)] text-[var(--semantic-success-text)] font-semibold';
              } else if (isPicked) {
                cls =
                  'border-[var(--semantic-warning)] bg-[var(--semantic-warning-soft)] text-[var(--semantic-warning-text)]';
              }
            }
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handlePick(idx)}
                className={`w-full p-3 rounded-lg border text-left text-xs transition-colors ${cls}`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {pickedIdx !== null && (
          <div className="rounded-xl bg-[var(--bg-elevated)] p-3.5 space-y-2.5 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
              <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>
                {pickedIdx === item.correctIndex
                  ? 'Case cracked! Here is why:'
                  : 'Not quite yet — here is what actually happened:'}
              </span>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">{item.explanation}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onRunInTheatre(item.fixedCode)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] text-[var(--accent-primary-text)] font-semibold"
              >
                <Play className="w-3.5 h-3.5" />
                Run Fix in Theatre
              </button>
              {caseIdx + 1 < INPUT_DETECTIVE_CASES.length && (
                <button
                  type="button"
                  onClick={() => selectCase(caseIdx + 1)}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] font-semibold"
                >
                  Next Case
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
