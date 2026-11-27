import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, Play, ShieldAlert, XCircle } from 'lucide-react';
import { PYTHON_KEYWORDS, validateVariableName } from '../engine/pythonMeta';

interface NameCheckerViewProps {
  onTryInTheatre: (code: string) => void;
}

const QUICK_SAMPLES = [
  'student_name',
  '_temp',
  'score2',
  '2name',
  'my name',
  'class',
  'total-score',
  'MAX_MARKS',
  'print',
  'l',
];

export const NameCheckerView: React.FC<NameCheckerViewProps> = ({ onTryInTheatre }) => {
  const [candidate, setCandidate] = useState('student_name');
  const [compareA, setCompareA] = useState('age');
  const [compareB, setCompareB] = useState('Age');

  const result = validateVariableName(candidate);
  const areSameCase = compareA === compareB;

  return (
    <div className="h-full min-h-0 panel-scroll p-4 sm:p-5 space-y-5">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold font-display text-[var(--text-primary)]">
          Interactive Variable Name Checker
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Type any Python variable name below to test syntax rules, conventions, and built-in safety in real time.
        </p>
      </div>

      {/* Input Box & Quick Samples */}
      <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-3">
        <label htmlFor="name-checker-input" className="block text-xs font-semibold text-[var(--text-secondary)]">
          Test a variable name
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id="name-checker-input"
            type="text"
            value={candidate}
            onChange={(e) => setCandidate(e.target.value)}
            placeholder="e.g. student_score"
            className="flex-1 min-w-[200px] px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-primary)] font-mono-tabular text-base font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
          />
          <button
            type="button"
            onClick={() => onTryInTheatre(`${candidate || 'x'} = "Test"\nprint(${candidate || 'x'})`)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--accent-primary)] text-[var(--accent-primary-text)] text-xs font-semibold hover:bg-[var(--accent-primary-hover)] transition-colors whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5" />
            Test in Theatre
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-[var(--text-muted)] mr-1">Try examples:</span>
          {QUICK_SAMPLES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setCandidate(s)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono-tabular border transition-colors ${
                candidate === s
                  ? 'bg-[var(--accent-soft)] border-[var(--accent-primary)] text-[var(--accent-soft-text)] font-semibold'
                  : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Verdict Banner */}
      <div
        role="status"
        className={`rounded-xl border p-4 space-y-3 ${
          result.isValid
            ? result.warnings.length > 0
              ? 'border-[var(--semantic-warning)] bg-[var(--semantic-warning-soft)]'
              : 'border-[var(--semantic-success)] bg-[var(--semantic-success-soft)]'
            : 'border-[var(--semantic-error)] bg-[var(--semantic-error-soft)]'
        }`}
      >
        <div className="flex items-start gap-3">
          {result.isValid ? (
            result.warnings.length > 0 ? (
              <AlertTriangle className="w-5 h-5 text-[var(--semantic-warning)] shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-[var(--semantic-success)] shrink-0 mt-0.5" />
            )
          ) : (
            <XCircle className="w-5 h-5 text-[var(--semantic-error)] shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <div className="text-sm font-bold text-[var(--text-primary)]">
              {result.isValid
                ? result.warnings.length > 0
                  ? 'VALID SYNTAX — WITH CAUTION'
                  : 'VALID PYTHON VARIABLE NAME'
                : 'INVALID VARIABLE NAME'}
            </div>
            <p className="text-sm text-[var(--text-secondary)]">{result.summary}</p>
          </div>
        </div>

        {/* Rule Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {result.rules.map((r) => (
            <div
              key={r.id}
              className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-3 py-2 flex items-start gap-2"
            >
              {r.passed ? (
                <CheckCircle2 className="w-4 h-4 text-[var(--semantic-success)] shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-[var(--semantic-error)] shrink-0 mt-0.5" />
              )}
              <div>
                <div className="text-xs font-semibold text-[var(--text-primary)]">{r.label}</div>
                <div className="text-xs text-[var(--text-muted)]">{r.detail}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Style & Warnings */}
        {result.warnings.map((w, i) => (
          <div key={i} className="flex items-start gap-2 text-xs font-medium text-[var(--semantic-warning-text)] bg-[var(--bg-surface)]/80 rounded-lg px-3 py-2 border border-[var(--semantic-warning)]/40">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{w}</span>
          </div>
        ))}
        {result.styleNotes.map((n, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-[var(--text-secondary)] bg-[var(--bg-surface)]/80 rounded-lg px-3 py-2">
            <Info className="w-4 h-4 text-[var(--accent-primary)] shrink-0 mt-0.5" />
            <span>{n}</span>
          </div>
        ))}
      </div>

      {/* Case Sensitivity Tester */}
      <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-3">
        <h2 className="text-sm font-semibold font-display text-[var(--text-primary)]">
          Case Sensitivity Check (age vs Age)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="case-a" className="block text-xs text-[var(--text-muted)] mb-1">First name tag</label>
            <input
              id="case-a"
              type="text"
              value={compareA}
              onChange={(e) => setCompareA(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] font-mono-tabular text-sm"
            />
          </div>
          <div>
            <label htmlFor="case-b" className="block text-xs text-[var(--text-muted)] mb-1">Second name tag</label>
            <input
              id="case-b"
              type="text"
              value={compareB}
              onChange={(e) => setCompareB(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] font-mono-tabular text-sm"
            />
          </div>
        </div>
        <p className="text-xs text-[var(--text-secondary)]">
          {areSameCase
            ? `"${compareA}" and "${compareB}" have identical spelling and capitals — they point to the SAME variable.`
            : `"${compareA}" and "${compareB}" differ in capitalisation — Python treats them as TWO separate variables!`}
        </p>
      </div>

      {/* Full Keyword List */}
      <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold font-display text-[var(--text-primary)]">
            Python Reserved Keywords ({PYTHON_KEYWORDS.length})
          </h2>
          <span className="text-xs text-[var(--text-muted)]">Click any keyword to test it</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PYTHON_KEYWORDS.map((kw) => (
            <button
              key={kw}
              type="button"
              onClick={() => setCandidate(kw)}
              className="px-2 py-1 rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] font-mono-tabular text-xs text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-colors"
            >
              {kw}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
