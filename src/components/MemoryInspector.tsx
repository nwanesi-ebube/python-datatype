import React from 'react';
import { ArrowRight, Link2, Lock, RefreshCw, Unlock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TraceStep } from '../types/lab';

interface MemoryInspectorProps {
  currentStep: TraceStep | null;
  reduceMotion: boolean;
  onClose?: () => void;
}

export const MemoryInspector: React.FC<MemoryInspectorProps> = ({
  currentStep,
  reduceMotion,
  onClose,
}) => {
  const vars = currentStep?.variables ?? [];
  const deleted = currentStep?.deletedNames ?? [];

  // Group variables by objectId to visually highlight shared objects (aliasing)
  const objectGroups = new Map<number, typeof vars>();
  for (const v of vars) {
    const arr = objectGroups.get(v.objectId) ?? [];
    arr.push(v);
    objectGroups.set(v.objectId, arr);
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-[var(--bg-surface)] text-[var(--text-primary)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] shrink-0">
        <div>
          <h2 className="text-sm font-semibold font-display text-[var(--text-primary)]">
            Memory View
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Name tags · Types · Object IDs
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Memory Inspector"
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-[var(--bg-inset)] text-[var(--text-secondary)]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 panel-scroll p-3 space-y-3">
        {deleted.length > 0 && (
          <div className="rounded-lg border border-[var(--semantic-warning)] bg-[var(--semantic-warning-soft)] px-3 py-2 text-xs text-[var(--semantic-warning-text)]">
            Removed with <code className="font-mono-tabular font-semibold">del</code>:{' '}
            <span className="font-mono-tabular font-semibold">{deleted.join(', ')}</span>
          </div>
        )}

        {vars.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-5 text-center space-y-1.5">
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              Memory is empty right now
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Click <strong>Run</strong> or <strong>Step</strong> to watch Python create objects and attach variable name tags.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            <div className="space-y-2.5">
              {Array.from(objectGroups.entries()).map(([objId, group]) => {
                const sample = group[0];
                const isAliased = group.length > 1;
                const anyChanged = group.some((v) => v.changed);

                return (
                  <motion.div
                    key={objId}
                    layout={!reduceMotion}
                    initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.2 }}
                    className={`rounded-xl border p-3 transition-colors ${
                      anyChanged
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)]'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)]'
                    }`}
                  >
                    {/* Variable Name Tags pointing to this Object */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      {group.map((v) => (
                        <span
                          key={v.name}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-surface)] border border-[var(--border-hairline)] font-mono-tabular text-xs font-semibold text-[var(--text-primary)]"
                        >
                          {v.name}
                          {v.isNew && (
                            <span className="text-[10px] font-sans font-bold text-[var(--semantic-success-text)]">
                              new
                            </span>
                          )}
                          {!v.isNew && v.changed && (
                            <RefreshCw className="w-3 h-3 text-[var(--accent-primary)]" aria-label="Updated" />
                          )}
                        </span>
                      ))}
                      <ArrowRight className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" aria-hidden="true" />
                      {isAliased && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--accent-soft-text)]">
                          <Link2 className="w-3 h-3" />
                          Shared object (aliased)
                        </span>
                      )}
                    </div>

                    {/* Memory Object Value */}
                    <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-2.5 py-2 font-mono-tabular text-sm font-semibold text-[var(--text-primary)] break-all">
                      {sample.repr}
                    </div>

                    {/* Metadata line (clean unboxed text with · separators) */}
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[var(--text-muted)] font-mono-tabular">
                      <span className="font-semibold text-[var(--accent-soft-text)]">
                        type: {sample.type}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>id: {sample.objectId}</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 font-sans">
                        {sample.mutable ? (
                          <>
                            <Unlock className="w-3 h-3 text-[var(--semantic-warning)]" />
                            mutable
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 text-[var(--semantic-success)]" />
                            immutable
                          </>
                        )}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}

        {/* Step Insight Hint Box */}
        {currentStep && (
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 space-y-1">
            <div className="text-xs font-semibold text-[var(--text-primary)]">
              Why this matters
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {currentStep.explainMore}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
