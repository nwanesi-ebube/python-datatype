import React from 'react';
import { CheckCircle2, Play, XCircle } from 'lucide-react';
import { MODULE_A_DO_DONT } from '../data/moduleA';

interface DoDontBoardProps {
  onRunInTheatre: (code: string, title: string) => void;
}

export const DoDontBoard: React.FC<DoDontBoardProps> = ({ onRunInTheatre }) => {
  const doItems = MODULE_A_DO_DONT.filter((i) => i.kind === 'do');
  const dontItems = MODULE_A_DO_DONT.filter((i) => i.kind === 'dont');

  return (
    <div className="h-full min-h-0 panel-scroll p-4 sm:p-5 space-y-5">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold font-display text-[var(--text-primary)]">
          Variable Naming: Do &amp; Don&apos;t Board
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Click <strong>Run in Theatre</strong> on any card to watch Python execute it and see the exact result or error.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* DO Column */}
        <section aria-label="Good variable naming practices" className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--semantic-success-text)]">
            <CheckCircle2 className="w-4 h-4 text-[var(--semantic-success)]" />
            <span>DO — Clean &amp; Valid Python Names</span>
          </div>
          <div className="space-y-3">
            {doItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-[var(--semantic-success)]/50 bg-[var(--bg-surface)] p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono-tabular text-sm font-bold text-[var(--text-primary)]">
                    {item.title}
                  </span>
                  <span className="text-[11px] font-bold text-[var(--semantic-success-text)]">
                    DO
                  </span>
                </div>
                <p className="text-xs font-medium text-[var(--text-secondary)]">{item.summary}</p>
                <p className="text-xs text-[var(--text-muted)]">{item.reason}</p>
                <button
                  type="button"
                  onClick={() => onRunInTheatre(item.code, item.title)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--semantic-success-soft)] text-[var(--semantic-success-text)] border border-[var(--semantic-success)]/40 text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  <Play className="w-3.5 h-3.5" />
                  Run in Theatre
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* DON'T Column */}
        <section aria-label="Common naming mistakes" className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--semantic-error-text)]">
            <XCircle className="w-4 h-4 text-[var(--semantic-error)]" />
            <span>DON&apos;T — Errors &amp; Dangerous Traps</span>
          </div>
          <div className="space-y-3">
            {dontItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-[var(--semantic-error)]/50 bg-[var(--bg-surface)] p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono-tabular text-sm font-bold text-[var(--text-primary)]">
                    {item.title}
                  </span>
                  <span className="text-[11px] font-bold text-[var(--semantic-error-text)]">
                    DON&apos;T
                  </span>
                </div>
                <p className="text-xs font-medium text-[var(--text-secondary)]">{item.summary}</p>
                <p className="text-xs text-[var(--text-muted)]">{item.reason}</p>
                <button
                  type="button"
                  onClick={() => onRunInTheatre(item.code, item.title)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--semantic-error-soft)] text-[var(--semantic-error-text)] border border-[var(--semantic-error)]/40 text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  <Play className="w-3.5 h-3.5" />
                  Run in Theatre
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
