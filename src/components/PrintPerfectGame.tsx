import React, { useState } from 'react';
import { CheckCircle2, Eye, HelpCircle, Play, RotateCcw } from 'lucide-react';
import { PRINT_PERFECT_LEVELS } from '../data/moduleB';
import { executePythonGenerator } from '../engine/interpreter';
import { CodeEditor } from './CodeEditor';

interface PrintPerfectGameProps {
  bestScore: number;
  onScoreUpdate: (score: number, xpEarned: number) => void;
}

function runSyncForOutput(code: string): { output: string; error?: string } {
  const gen = executePythonGenerator(code);
  while (true) {
    const r = gen.next();
    if (r.done) return { output: '' };
    const v = r.value;
    if (v.kind === 'input') return { output: v.partialOutput, error: 'input() is not needed for Print Perfect.' };
    if (v.kind === 'error') return { output: v.finalOutput, error: `${v.error.errorType}: ${v.error.message}` };
    if (v.kind === 'done') return { output: v.finalOutput };
  }
}

export const PrintPerfectGame: React.FC<PrintPerfectGameProps> = ({ bestScore, onScoreUpdate }) => {
  const [levelIdx, setLevelIdx] = useState(0);
  const level = PRINT_PERFECT_LEVELS[levelIdx];
  const [code, setCode] = useState(level.starterCode);
  const [showHint, setShowHint] = useState(false);
  const [showMarkers, setShowMarkers] = useState(true);
  const [solvedIds, setSolvedIds] = useState<string[]>([]);
  const [checkResult, setCheckResult] = useState<{
    matched: boolean;
    actual: string;
    error?: string;
  } | null>(null);

  const selectLevel = (idx: number) => {
    setLevelIdx(idx);
    setCode(PRINT_PERFECT_LEVELS[idx].starterCode);
    setShowHint(false);
    setCheckResult(null);
  };

  const handleCheck = () => {
    const res = runSyncForOutput(code);
    // Compare ignoring only final trailing newline unless target explicitly expects multiple lines
    const actualTrim = res.output.replace(/\n$/, '');
    const matched = !res.error && actualTrim === level.targetOutput;
    setCheckResult({ matched, actual: actualTrim, error: res.error });
    if (matched && !solvedIds.includes(level.id)) {
      const nextSolved = [...solvedIds, level.id];
      setSolvedIds(nextSolved);
      onScoreUpdate(nextSolved.length * 20, 20);
    }
  };

  const fmt = (s: string) => (showMarkers ? s.replace(/ /g, '·').replace(/\n/g, '↵\n') : s);

  return (
    <div className="h-full min-h-0 panel-scroll p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-[var(--text-primary)]">
            Print Perfect
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Edit the <code className="font-mono-tabular">print()</code> code so your output matches the target character-for-character.
          </p>
        </div>
        <div className="text-xs font-mono-tabular font-semibold text-[var(--text-primary)]">
          Solved: {solvedIds.length}/{PRINT_PERFECT_LEVELS.length} · Best: {bestScore}
        </div>
      </div>

      {/* Level Picker */}
      <div className="flex flex-wrap gap-1.5">
        {PRINT_PERFECT_LEVELS.map((lvl, idx) => {
          const solved = solvedIds.includes(lvl.id);
          const active = idx === levelIdx;
          return (
            <button
              key={lvl.id}
              type="button"
              onClick={() => selectLevel(idx)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                active
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] border-[var(--accent-primary)]'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-hairline)] hover:text-[var(--text-primary)]'
              }`}
            >
              {solved && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--semantic-success)]" />}
              <span>Level {idx + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Target vs Actual */}
      <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold font-display">{level.title}</h2>
          <button
            type="button"
            onClick={() => setShowMarkers((m) => !m)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showMarkers ? 'Hide' : 'Show'} Space Markers</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-lg bg-[var(--console-bg)] p-3 space-y-1">
            <div className="text-[11px] font-semibold text-emerald-300">Target Output</div>
            <pre className="font-mono-tabular text-sm text-white m-0 whitespace-pre-wrap">
              {fmt(level.targetOutput)}
            </pre>
          </div>
          <div className="rounded-lg bg-[var(--console-bg)] p-3 space-y-1">
            <div className="text-[11px] font-semibold text-sky-300">Your Output</div>
            <pre className="font-mono-tabular text-sm text-white m-0 whitespace-pre-wrap">
              {checkResult ? (checkResult.error ? checkResult.error : fmt(checkResult.actual)) : 'Press Check Output to test'}
            </pre>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCheck}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--accent-primary)] text-[var(--accent-primary-text)] text-xs font-semibold hover:bg-[var(--accent-primary-hover)]"
            >
              <Play className="w-3.5 h-3.5" />
              Check Output
            </button>
            <button
              type="button"
              onClick={() => selectLevel(levelIdx)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowHint((h) => !h)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs font-medium"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            {showHint ? 'Hide Hint' : 'Hint'}
          </button>
        </div>

        {showHint && (
          <div className="px-4 py-2.5 bg-[var(--accent-soft)] text-[var(--accent-soft-text)] text-xs font-medium border-b border-[var(--border-subtle)]">
            Hint: {level.hint}
          </div>
        )}

        <div className="h-[150px]">
          <CodeEditor value={code} onChange={setCode} activeLine={null} onRunShortcut={handleCheck} />
        </div>
      </div>

      {checkResult && (
        <div
          role="status"
          className={`rounded-xl border p-3.5 text-xs space-y-1 ${
            checkResult.matched
              ? 'border-[var(--semantic-success)] bg-[var(--semantic-success-soft)] text-[var(--semantic-success-text)]'
              : 'border-[var(--semantic-warning)] bg-[var(--semantic-warning-soft)] text-[var(--semantic-warning-text)]'
          }`}
        >
          <div className="font-bold text-sm">
            {checkResult.matched
              ? 'Print Perfect! Exact match — well done!'
              : 'Not quite yet — compare the target and your output carefully (watch spaces and padding).'}
          </div>
        </div>
      )}
    </div>
  );
};
