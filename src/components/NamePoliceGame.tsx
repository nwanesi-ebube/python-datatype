import React, { useEffect, useMemo, useState } from 'react';
import { Award, CheckCircle2, Clock, RotateCcw, ShieldCheck, XCircle } from 'lucide-react';
import { NAME_POLICE_CARDS } from '../data/moduleA';

interface NamePoliceGameProps {
  bestScore: number;
  onScoreUpdate: (score: number, xpEarned: number) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const NamePoliceGame: React.FC<NamePoliceGameProps> = ({ bestScore, onScoreUpdate }) => {
  const [mode, setMode] = useState<'timed' | 'calm'>('timed');
  const [phase, setPhase] = useState<'ready' | 'playing' | 'finished'>('ready');
  const [deck, setDeck] = useState(() => shuffle(NAME_POLICE_CARDS));
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [lastFeedback, setLastFeedback] = useState<{
    correct: boolean;
    message: string;
    detail: string;
  } | null>(null);

  const currentCard = useMemo(() => deck[index % deck.length], [deck, index]);

  useEffect(() => {
    if (phase !== 'playing' || mode !== 'timed') return;
    if (timeLeft <= 0) {
      setPhase('finished');
      onScoreUpdate(score, Math.max(10, Math.round(score / 2)));
      return;
    }
    const timer = window.setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, mode, timeLeft, score, onScoreUpdate]);

  const startGame = (chosenMode: 'timed' | 'calm') => {
    setMode(chosenMode);
    setDeck(shuffle(NAME_POLICE_CARDS));
    setIndex(0);
    setScore(0);
    setStreak(0);
    setTimeLeft(45);
    setLastFeedback(null);
    setPhase('playing');
  };

  const handleDecision = (pickValid: boolean) => {
    if (phase !== 'playing') return;
    const isCorrect = pickValid === currentCard.isValid;
    if (isCorrect) {
      const nextStreak = streak + 1;
      const points = 10 + Math.min(nextStreak * 2, 10);
      setScore((s) => s + points);
      setStreak(nextStreak);
      setLastFeedback({
        correct: true,
        message: `Spot on! "${currentCard.candidate}" is ${currentCard.isValid ? 'Valid' : 'Invalid'}.`,
        detail: currentCard.reason,
      });
    } else {
      setStreak(0);
      setLastFeedback({
        correct: false,
        message: `Not quite yet — "${currentCard.candidate}" is actually ${currentCard.isValid ? 'Valid' : 'Invalid'}.`,
        detail: currentCard.reason,
      });
    }

    if (mode === 'calm' && index + 1 >= deck.length) {
      setPhase('finished');
      const finalScore = isCorrect ? score + 10 : score;
      onScoreUpdate(finalScore, Math.max(10, Math.round(finalScore / 2)));
    } else {
      setIndex((i) => i + 1);
    }
  };

  return (
    <div className="h-full min-h-0 panel-scroll p-4 sm:p-5 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-[var(--text-primary)]">
            Variable Name Police
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Inspect each name badge at the school gate. Decide whether Python accepts it or rejects it!
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono-tabular text-[var(--text-muted)]">
          <span className="inline-flex items-center gap-1 font-semibold text-[var(--text-primary)]">
            <Award className="w-4 h-4 text-[var(--semantic-warning)]" />
            Best: {bestScore}
          </span>
        </div>
      </div>

      {phase === 'ready' && (
        <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 space-y-5 max-w-xl">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-[var(--accent-primary)] shrink-0" />
            <div>
              <h2 className="text-base font-bold font-display text-[var(--text-primary)]">
                Choose your inspection mode
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Spot keywords, leading digits, spaces, and symbols before the gate opens.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => startGame('timed')}
              className="p-4 rounded-xl border border-[var(--accent-primary)] bg-[var(--accent-soft)] text-left space-y-1 hover:opacity-95 transition-opacity"
            >
              <div className="text-sm font-bold text-[var(--accent-soft-text)] flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                45-Second Rush
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Classify as many variable names as possible before time runs out.
              </p>
            </button>

            <button
              type="button"
              onClick={() => startGame('calm')}
              className="p-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-left space-y-1 hover:border-[var(--accent-primary)] transition-colors"
            >
              <div className="text-sm font-bold text-[var(--text-primary)]">
                Calm Practice (16 Cards)
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                No clock — take your time reading every reason carefully.
              </p>
            </button>
          </div>
        </div>
      )}

      {phase === 'playing' && (
        <div className="max-w-xl space-y-4">
          {/* Scoreboard Strip */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-2.5 text-xs font-mono-tabular">
            <span>Score: <strong className="text-[var(--text-primary)]">{score}</strong></span>
            <span>Streak: <strong className="text-[var(--semantic-success)]">{streak}</strong></span>
            <span>
              {mode === 'timed' ? (
                <>Time: <strong className="text-[var(--accent-primary)]">{timeLeft}s</strong></>
              ) : (
                <>Card: <strong>{index + 1}/{deck.length}</strong></>
              )}
            </span>
          </div>

          {/* Candidate Card */}
          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 text-center space-y-4">
            <div className="text-xs font-medium text-[var(--text-muted)]">
              Incoming variable name badge
            </div>
            <div className="inline-block px-5 py-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] font-mono-tabular text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              {currentCard.candidate}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleDecision(true)}
                className="min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--semantic-success-soft)] border border-[var(--semantic-success)] text-[var(--semantic-success-text)] font-bold text-sm hover:opacity-90 active:scale-98 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                Valid Name
              </button>
              <button
                type="button"
                onClick={() => handleDecision(false)}
                className="min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--semantic-error-soft)] border border-[var(--semantic-error)] text-[var(--semantic-error-text)] font-bold text-sm hover:opacity-90 active:scale-98 transition-all"
              >
                <XCircle className="w-4 h-4" />
                Invalid Name
              </button>
            </div>
          </div>

          {/* Immediate Feedback */}
          {lastFeedback && (
            <div
              role="status"
              className={`rounded-xl border p-3.5 text-xs space-y-1 ${
                lastFeedback.correct
                  ? 'border-[var(--semantic-success)] bg-[var(--semantic-success-soft)] text-[var(--semantic-success-text)]'
                  : 'border-[var(--semantic-warning)] bg-[var(--semantic-warning-soft)] text-[var(--semantic-warning-text)]'
              }`}
            >
              <div className="font-bold text-sm">{lastFeedback.message}</div>
              <p>{lastFeedback.detail}</p>
            </div>
          )}
        </div>
      )}

      {phase === 'finished' && (
        <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 space-y-4 max-w-xl">
          <h2 className="text-lg font-bold font-display text-[var(--text-primary)]">
            Shift Complete!
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            You scored <strong className="font-mono-tabular text-[var(--text-primary)]">{score} points</strong> and sharpened your eye for Python variable rules.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => startGame(mode)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-[var(--accent-primary-text)] text-xs font-semibold hover:bg-[var(--accent-primary-hover)]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Play Again
            </button>
            <button
              type="button"
              onClick={() => setPhase('ready')}
              className="px-4 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-xs font-semibold text-[var(--text-primary)]"
            >
              Switch Mode
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
