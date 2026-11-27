import React from 'react';
import { Award, CheckCircle2, Lock, Trophy } from 'lucide-react';
import { GAME_LEADERBOARD_META, LAB_BADGES } from '../data/stage8';
import { UserProgress } from '../types/lab';

interface TrophyRoomViewProps {
  progress: UserProgress;
}

export const TrophyRoomView: React.FC<TrophyRoomViewProps> = ({ progress }) => {
  const earnedSet = new Set(progress.badges);
  const level = Math.floor(progress.xp / 100) + 1;
  const levelPct = progress.xp % 100;

  return (
    <div className="h-full min-h-0 panel-scroll bg-[var(--bg-canvas)] text-[var(--text-primary)] p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header & Level */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <Trophy className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>Achievements · Personal Best Scoreboard</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-display">
              Badges &amp; Scoreboard
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
              Curiosity and effort count alongside scores. Every lesson, lab, and mini-game adds to your local Python record.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-3 min-w-[200px] space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span>Level {level}</span>
              <span className="font-mono-tabular text-[var(--accent-primary)]">{progress.xp} XP</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--bg-inset)] overflow-hidden">
              <div className="h-full bg-[var(--accent-primary)]" style={{ width: `${levelPct}%` }} />
            </div>
            <div className="text-[11px] text-[var(--text-muted)] font-mono-tabular">
              {progress.streakDays} day streak · {earnedSet.size}/{LAB_BADGES.length} badges
            </div>
          </div>
        </div>

        {/* Personal Best Scoreboard across all 7 games */}
        <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-3">
          <h2 className="text-sm font-bold font-display">Personal Best Game Scores</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {GAME_LEADERBOARD_META.map((g) => {
              const best = progress.gameHighScores[g.id] ?? 0;
              const pct = Math.min(100, Math.round((best / g.maxTypical) * 100));
              return (
                <div
                  key={g.id}
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">{g.title}</span>
                    <span className="font-mono-tabular font-bold text-[var(--accent-primary)]">{best} pts</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--bg-inset)] overflow-hidden">
                    <div className="h-full bg-[var(--semantic-success)]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievement Badges Grid */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold font-display">Achievement Badges ({earnedSet.size}/{LAB_BADGES.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {LAB_BADGES.map((badge) => {
              const unlocked = earnedSet.has(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`rounded-xl border p-4 space-y-2 transition-colors ${
                    unlocked
                      ? 'border-[var(--semantic-success)]/60 bg-[var(--semantic-success-soft)]/50'
                      : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                      {badge.category}
                    </span>
                    {unlocked ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--semantic-success-text)]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Earned</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Locked</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Award
                      className={`w-5 h-5 shrink-0 ${
                        unlocked ? 'text-[var(--semantic-warning)]' : 'text-[var(--text-muted)]'
                      }`}
                    />
                    <h3 className="text-sm font-bold font-display">{badge.title}</h3>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">{badge.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
