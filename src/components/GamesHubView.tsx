import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  Bug,
  CheckCircle2,
  Clock,
  Eye,
  Gamepad2,
  Layers,
  Play,
  RotateCcw,
  Wrench,
} from 'lucide-react';
import {
  BUG_HUNTER_CHALLENGES,
  METHOD_MATCH_QUESTIONS,
  PREDICT_DUEL_ROUNDS,
  TYPE_SORTER_CARDS,
} from '../data/stage8';
import { executePythonGenerator } from '../engine/interpreter';
import { CodeEditor } from './CodeEditor';

export type MiniGameId = 'type-sorter' | 'method-match' | 'predict-duel' | 'bug-hunter';

interface GamesHubViewProps {
  initialGame?: MiniGameId;
  highScores: Record<string, number>;
  onScoreUpdate: (gameId: MiniGameId, score: number, xpEarned: number) => void;
  onRunInTheatre: (code: string) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function runCodeToEnd(code: string): { output: string; error: string | null } {
  const gen = executePythonGenerator(code);
  let output = '';
  for (let i = 0; i < 400; i++) {
    const step = gen.next();
    if (step.done) break;
    if (step.value.kind === 'step') {
      output = step.value.trace.outputSoFar;
    } else if (step.value.kind === 'error') {
      return {
        output: step.value.finalOutput,
        error: `${step.value.error.errorType}: ${step.value.error.message} (line ${step.value.error.line})`,
      };
    } else if (step.value.kind === 'done') {
      return { output: step.value.finalOutput, error: null };
    } else if (step.value.kind === 'input') {
      return { output: step.value.partialOutput, error: 'Program paused waiting for input()' };
    }
  }
  return { output, error: null };
}

export const GamesHubView: React.FC<GamesHubViewProps> = ({
  initialGame = 'type-sorter',
  highScores,
  onScoreUpdate,
  onRunInTheatre,
}) => {
  const [activeGame, setActiveGame] = useState<MiniGameId>(initialGame);

  useEffect(() => {
    setActiveGame(initialGame);
  }, [initialGame]);

  // 1. TYPE SORTER STATE
  const [tsMode, setTsMode] = useState<'calm' | 'timed'>('calm');
  const [tsPhase, setTsPhase] = useState<'ready' | 'playing' | 'finished'>('ready');
  const [tsDeck, setTsDeck] = useState(() => shuffle(TYPE_SORTER_CARDS));
  const [tsIdx, setTsIdx] = useState(0);
  const [tsScore, setTsScore] = useState(0);
  const [tsStreak, setTsStreak] = useState(0);
  const [tsTime, setTsTime] = useState(50);
  const [tsFeedback, setTsFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (activeGame !== 'type-sorter' || tsPhase !== 'playing' || tsMode !== 'timed') return;
    if (tsTime <= 0) {
      setTsPhase('finished');
      onScoreUpdate('type-sorter', tsScore, Math.max(10, Math.round(tsScore / 2)));
      return;
    }
    const timer = window.setTimeout(() => setTsTime((t) => t - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [activeGame, tsPhase, tsMode, tsTime, tsScore, onScoreUpdate]);

  const tsCard = tsDeck[tsIdx % tsDeck.length];

  const startTypeSorter = (mode: 'calm' | 'timed') => {
    setTsMode(mode);
    setTsDeck(shuffle(TYPE_SORTER_CARDS));
    setTsIdx(0);
    setTsScore(0);
    setTsStreak(0);
    setTsTime(50);
    setTsFeedback(null);
    setTsPhase('playing');
  };

  const handleTsPick = (chosen: string) => {
    if (tsPhase !== 'playing') return;
    const ok = chosen === tsCard.correctType;
    const nextStreak = ok ? tsStreak + 1 : 0;
    const earned = ok ? 10 + Math.min(nextStreak * 2, 10) : 0;
    const nextScore = tsScore + earned;
    setTsScore(nextScore);
    setTsStreak(nextStreak);
    setTsFeedback({
      ok,
      msg: ok
        ? `Spot on! ${tsCard.expr} is ${tsCard.correctType}. ${tsCard.reason}`
        : `Not quite yet — ${tsCard.expr} is ${tsCard.correctType}. ${tsCard.reason}`,
    });

    if (tsMode === 'calm' && tsIdx + 1 >= tsDeck.length) {
      setTsPhase('finished');
      onScoreUpdate('type-sorter', nextScore, Math.max(15, Math.round(nextScore / 2)));
    } else {
      setTsIdx((i) => i + 1);
    }
  };

  // 2. METHOD MATCH STATE
  const [mmIdx, setMmIdx] = useState(0);
  const [mmPicked, setMmPicked] = useState<number | null>(null);
  const [mmScore, setMmScore] = useState(0);
  const [mmSolved, setMmSolved] = useState<string[]>([]);

  const mmItem = METHOD_MATCH_QUESTIONS[mmIdx];

  const handleMmPick = (idx: number) => {
    if (mmPicked !== null) return;
    setMmPicked(idx);
    if (idx === mmItem.correctIndex && !mmSolved.includes(mmItem.id)) {
      const nextSolved = [...mmSolved, mmItem.id];
      const nextScore = mmScore + 15;
      setMmSolved(nextSolved);
      setMmScore(nextScore);
      onScoreUpdate('method-match', nextScore, 15);
    }
  };

  // 3. PREDICT DUEL STATE
  const [pdIdx, setPdIdx] = useState(0);
  const [pdPicked, setPdPicked] = useState<number | null>(null);
  const [pdScore, setPdScore] = useState(0);
  const [pdSolved, setPdSolved] = useState<string[]>([]);

  const pdItem = PREDICT_DUEL_ROUNDS[pdIdx];
  const pdLiveOut = useMemo(() => runCodeToEnd(pdItem.code), [pdItem.code]);

  const handlePdPick = (idx: number) => {
    if (pdPicked !== null) return;
    setPdPicked(idx);
    if (idx === pdItem.correctIndex && !pdSolved.includes(pdItem.id)) {
      const nextSolved = [...pdSolved, pdItem.id];
      const nextScore = pdScore + 15;
      setPdSolved(nextSolved);
      setPdScore(nextScore);
      onScoreUpdate('predict-duel', nextScore, 15);
    }
  };

  // 4. BUG HUNTER STATE
  const [bhIdx, setBhIdx] = useState(0);
  const [bhCodes, setBhCodes] = useState<Record<string, string>>(() =>
    Object.fromEntries(BUG_HUNTER_CHALLENGES.map((c) => [c.id, c.buggyCode]))
  );
  const [bhSolved, setBhSolved] = useState<string[]>([]);
  const [bhLastRun, setBhLastRun] = useState<{ ok: boolean; output: string; error: string | null } | null>(null);
  const [bhShowHint, setBhShowHint] = useState(false);

  const bhItem = BUG_HUNTER_CHALLENGES[bhIdx];
  const bhCurrentCode = bhCodes[bhItem.id] ?? bhItem.buggyCode;

  const testBugFix = () => {
    const res = runCodeToEnd(bhCurrentCode);
    const actualTrim = res.output.trim();
    const expectedTrim = bhItem.expectedOutput.trim();
    const ok = !res.error && actualTrim === expectedTrim;
    setBhLastRun({ ok, output: res.output, error: res.error });
    if (ok && !bhSolved.includes(bhItem.id)) {
      const nextSolved = [...bhSolved, bhItem.id];
      setBhSolved(nextSolved);
      onScoreUpdate('bug-hunter', nextSolved.length * 20, 25);
    }
  };

  const selectBh = (idx: number) => {
    setBhIdx(idx);
    setBhLastRun(null);
    setBhShowHint(false);
  };

  return (
    <div className="h-full min-h-0 panel-scroll bg-[var(--bg-canvas)] text-[var(--text-primary)] p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <Gamepad2 className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>Mini-Games Arcade · Practice with Warm Feedback</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-display">
              Python Data Types Mini-Games
            </h1>
          </div>
        </div>

        {/* 4-Game Tabs */}
        <div
          role="tablist"
          aria-label="Python mini-games"
          className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)]"
        >
          {(
            [
              { id: 'type-sorter', label: 'Type Sorter', icon: Layers },
              { id: 'method-match', label: 'Method Match', icon: Wrench },
              { id: 'predict-duel', label: 'Predict Duel', icon: Eye },
              { id: 'bug-hunter', label: 'Bug Hunter', icon: Bug },
            ] as const
          ).map((g) => {
            const Icon = g.icon;
            const active = activeGame === g.id;
            return (
              <button
                key={g.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveGame(g.id)}
                className={`min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{g.label}</span>
              </button>
            );
          })}
        </div>

        {/* 1. TYPE SORTER */}
        {activeGame === 'type-sorter' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                Look closely at quotes, decimal points, brackets, and prefixes — classify each Python value fast!
              </p>
              <span className="text-xs font-mono-tabular font-semibold">
                Best: {highScores['type-sorter'] ?? 0}
              </span>
            </div>

            {tsPhase === 'ready' && (
              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-4 max-w-xl">
                <h2 className="text-base font-bold font-display">Choose your Type Sorter pace</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => startTypeSorter('calm')}
                    className="p-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-left hover:border-[var(--accent-primary)] space-y-1"
                  >
                    <div className="text-sm font-bold">Calm Practice (18 cards)</div>
                    <div className="text-xs text-[var(--text-muted)]">No timer. Focus on tricky literals like {} vs set().</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => startTypeSorter('timed')}
                    className="p-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-left hover:border-[var(--accent-primary)] space-y-1"
                  >
                    <div className="text-sm font-bold flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[var(--accent-primary)]" />
                      <span>50s Arcade Sprint</span>
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">Build combo streaks before the clock runs out.</div>
                  </button>
                </div>
              </div>
            )}

            {tsPhase === 'playing' && (
              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-4 max-w-2xl">
                <div className="flex items-center justify-between text-xs font-mono-tabular">
                  <span>
                    Card {Math.min(tsIdx + 1, tsDeck.length)}/{tsDeck.length} · Score: <strong>{tsScore}</strong> · Streak: {tsStreak}
                  </span>
                  {tsMode === 'timed' && <span className="font-bold text-[var(--accent-primary)]">{tsTime}s left</span>}
                </div>

                <div className="rounded-xl bg-[var(--console-bg)] text-[var(--console-text)] p-6 text-center">
                  <div className="text-xs text-slate-400 mb-1">What Python type is this?</div>
                  <code className="text-2xl sm:text-3xl font-bold font-mono">{tsCard.expr}</code>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {tsCard.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleTsPick(opt)}
                      className="min-h-[46px] px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] hover:border-[var(--accent-primary)] font-mono text-sm font-bold"
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {tsFeedback && (
                  <div
                    className={`rounded-lg p-3 text-xs ${
                      tsFeedback.ok
                        ? 'bg-[var(--semantic-success-soft)] text-[var(--semantic-success-text)]'
                        : 'bg-[var(--semantic-warning-soft)] text-[var(--semantic-warning-text)]'
                    }`}
                  >
                    {tsFeedback.msg}
                  </div>
                )}
              </div>
            )}

            {tsPhase === 'finished' && (
              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 space-y-4 max-w-md">
                <div className="flex items-center gap-2 text-lg font-bold font-display">
                  <Award className="w-5 h-5 text-[var(--semantic-warning)]" />
                  <span>Round Complete! Score: {tsScore}</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  Every tricky literal you classify strengthens your intuition for real Python bugs.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startTypeSorter(tsMode)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-[var(--accent-primary-text)] text-xs font-semibold"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Play Again</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTsPhase('ready')}
                    className="px-4 py-2 rounded-lg border border-[var(--border-hairline)] text-xs font-semibold"
                  >
                    Change Mode
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. METHOD MATCH */}
        {activeGame === 'method-match' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-tabular">
              <span className="text-[var(--text-secondary)]">
                Question {mmIdx + 1}/{METHOD_MATCH_QUESTIONS.length} · Solved: {mmSolved.length}
              </span>
              <span className="font-semibold">
                Session: {mmScore} · Best: {highScores['method-match'] ?? 0}
              </span>
            </div>

            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-4">
              <div className="space-y-2">
                <h2 className="text-base font-bold font-display">{mmItem.task}</h2>
                <pre className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-3 text-xs font-mono">
                  {mmItem.sampleVar}
                </pre>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {mmItem.options.map((opt, idx) => {
                  const picked = mmPicked === idx;
                  const correct = idx === mmItem.correctIndex;
                  let cls = 'bg-[var(--bg-canvas)] border-[var(--border-hairline)] hover:border-[var(--accent-primary)]';
                  if (mmPicked !== null) {
                    if (correct) cls = 'bg-[var(--semantic-success-soft)] border-[var(--semantic-success)] text-[var(--semantic-success-text)] font-bold';
                    else if (picked) cls = 'bg-[var(--semantic-warning-soft)] border-[var(--semantic-warning)] text-[var(--semantic-warning-text)]';
                  }
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleMmPick(idx)}
                      className={`min-h-[44px] px-3.5 py-2 rounded-lg border text-left font-mono text-xs transition-colors ${cls}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {mmPicked !== null && (
                <div className="rounded-lg bg-[var(--bg-elevated)] p-3.5 space-y-2 text-xs">
                  <div className="font-bold">
                    {mmPicked === mmItem.correctIndex
                      ? 'Spot on!'
                      : 'Not quite yet — check how that method works:'}
                  </div>
                  <p className="text-[var(--text-secondary)]">{mmItem.explanation}</p>
                </div>
              )}

              <div className="flex justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMmPicked(null);
                    setMmIdx((i) => (i - 1 + METHOD_MATCH_QUESTIONS.length) % METHOD_MATCH_QUESTIONS.length);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] text-xs font-medium"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMmPicked(null);
                    setMmIdx((i) => (i + 1) % METHOD_MATCH_QUESTIONS.length);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] text-[var(--accent-primary-text)] text-xs font-semibold"
                >
                  Next Question
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. PREDICT DUEL */}
        {activeGame === 'predict-duel' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-tabular">
              <span className="text-[var(--text-secondary)]">
                Round {pdIdx + 1}/{PREDICT_DUEL_ROUNDS.length} · Solved: {pdSolved.length}
              </span>
              <span className="font-semibold">
                Session: {pdScore} · Best: {highScores['predict-duel'] ?? 0}
              </span>
            </div>

            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-bold font-display">{pdItem.title}</h2>
                <button
                  type="button"
                  onClick={() => onRunInTheatre(pdItem.code)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] text-xs font-semibold hover:bg-[var(--bg-elevated)]"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Step in Theatre</span>
                </button>
              </div>

              <pre className="rounded-lg bg-[var(--console-bg)] text-[var(--console-text)] p-4 text-xs font-mono overflow-x-auto">
                {pdItem.code}
              </pre>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {pdItem.options.map((opt, idx) => {
                  const picked = pdPicked === idx;
                  const correct = idx === pdItem.correctIndex;
                  let cls = 'bg-[var(--bg-canvas)] border-[var(--border-hairline)] hover:border-[var(--accent-primary)]';
                  if (pdPicked !== null) {
                    if (correct) cls = 'bg-[var(--semantic-success-soft)] border-[var(--semantic-success)] text-[var(--semantic-success-text)] font-bold';
                    else if (picked) cls = 'bg-[var(--semantic-warning-soft)] border-[var(--semantic-warning)] text-[var(--semantic-warning-text)]';
                  }
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handlePdPick(idx)}
                      className={`min-h-[44px] px-3.5 py-2 rounded-lg border text-left font-mono text-xs transition-colors ${cls}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {pdPicked !== null && (
                <div className="rounded-lg bg-[var(--bg-elevated)] p-3.5 space-y-2 text-xs">
                  <div className="font-bold">
                    {pdPicked === pdItem.correctIndex
                      ? 'Great prediction!'
                      : 'Not quite yet — see what Python actually outputs:'}
                  </div>
                  <p className="text-[var(--text-secondary)]">{pdItem.explanation}</p>
                  <div className="font-mono text-[11px] text-[var(--text-muted)]">
                    Verified engine output: <code>{pdLiveOut.output.trim()}</code>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setPdPicked(null);
                    setPdIdx((i) => (i - 1 + PREDICT_DUEL_ROUNDS.length) % PREDICT_DUEL_ROUNDS.length);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] text-xs font-medium"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPdPicked(null);
                    setPdIdx((i) => (i + 1) % PREDICT_DUEL_ROUNDS.length);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] text-[var(--accent-primary-text)] text-xs font-semibold"
                >
                  Next Round
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. BUG HUNTER */}
        {activeGame === 'bug-hunter' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-tabular">
              <span className="text-[var(--text-secondary)]">
                Bugs fixed: {bhSolved.length}/{BUG_HUNTER_CHALLENGES.length}
              </span>
              <span className="font-semibold">Best: {highScores['bug-hunter'] ?? 0}</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {BUG_HUNTER_CHALLENGES.map((c, idx) => {
                const fixed = bhSolved.includes(c.id);
                const active = idx === bhIdx;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectBh(idx)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                      active
                        ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] border-[var(--accent-primary)]'
                        : 'bg-[var(--bg-surface)] border-[var(--border-hairline)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {fixed && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--semantic-success)]" />}
                    <span>Bug {idx + 1}</span>
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs text-[var(--text-muted)]">{bhItem.context}</div>
                  <h2 className="text-base font-bold font-display">{bhItem.title}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBhShowHint((h) => !h)}
                    className="px-2.5 py-1.5 rounded-lg border border-[var(--border-hairline)] text-xs font-medium"
                  >
                    {bhShowHint ? 'Hide Hint' : 'Show Hint'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBhCodes((prev) => ({ ...prev, [bhItem.id]: bhItem.buggyCode }));
                      setBhLastRun(null);
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-[var(--border-hairline)] text-xs font-medium"
                  >
                    Reset Code
                  </button>
                </div>
              </div>

              <div className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-2.5 text-xs">
                <strong>Goal:</strong> {bhItem.goal}
              </div>

              {bhShowHint && (
                <div className="rounded-lg bg-[var(--semantic-warning-soft)] text-[var(--semantic-warning-text)] p-2.5 text-xs">
                  <strong>Hint:</strong> {bhItem.hint}
                </div>
              )}

              <div className="h-44 rounded-lg border border-[var(--border-hairline)] overflow-hidden">
                <CodeEditor
                  value={bhCurrentCode}
                  onChange={(next) => setBhCodes((prev) => ({ ...prev, [bhItem.id]: next }))}
                  activeLine={null}
                  onRunShortcut={testBugFix}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={testBugFix}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-[var(--accent-primary-text)] text-xs font-semibold"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Test Fix</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRunInTheatre(bhCurrentCode)}
                  className="px-3 py-2 rounded-lg border border-[var(--border-hairline)] text-xs font-semibold"
                >
                  Debug in Theatre
                </button>
              </div>

              {bhLastRun && (
                <div
                  className={`rounded-lg p-3 text-xs space-y-1 ${
                    bhLastRun.ok
                      ? 'bg-[var(--semantic-success-soft)] text-[var(--semantic-success-text)]'
                      : 'bg-[var(--semantic-warning-soft)] text-[var(--semantic-warning-text)]'
                  }`}
                >
                  <div className="font-bold">
                    {bhLastRun.ok
                      ? 'Bug squashed! Output matches the target.'
                      : bhLastRun.error
                      ? `Not quite yet — ${bhLastRun.error}`
                      : `Not quite yet — expected "${bhItem.expectedOutput}" but got "${bhLastRun.output.trim()}"`}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
