import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpenCheck,
  ClipboardCheck,
  Monitor,
  Play,
  Printer,
} from 'lucide-react';
import { MODULES } from '../data/curriculum';
import { MODULE_SUMMARY_SHEETS } from '../data/moduleSummaries';

interface TeacherSummariesViewProps {
  initialModuleId?: string;
  teachingMode: boolean;
  onToggleTeachingMode: (enabled: boolean) => void;
  onRunInTheatre: (code: string) => void;
  onOpenExercises?: (moduleId: string) => void;
}

export const TeacherSummariesView: React.FC<TeacherSummariesViewProps> = ({
  initialModuleId,
  teachingMode,
  onToggleTeachingMode,
  onRunInTheatre,
  onOpenExercises,
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>(
    initialModuleId && MODULES.some((m) => m.id === initialModuleId)
      ? initialModuleId
      : MODULES[0].id
  );
  const [printAllModules, setPrintAllModules] = useState(false);

  useEffect(() => {
    if (initialModuleId && MODULES.some((m) => m.id === initialModuleId)) {
      setSelectedModuleId(initialModuleId);
    }
  }, [initialModuleId]);

  const sheetsToRender = useMemo(() => {
    if (printAllModules) return MODULE_SUMMARY_SHEETS;
    const one = MODULE_SUMMARY_SHEETS.find((s) => s.moduleId === selectedModuleId);
    return one ? [one] : [MODULE_SUMMARY_SHEETS[0]];
  }, [printAllModules, selectedModuleId]);

  return (
    <div className="h-full min-h-0 flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* Screen-Only Teacher Controls */}
      <div className="no-print px-4 sm:px-6 py-3.5 border-b border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-3 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-base sm:text-lg font-bold font-display">
              Teaching Mode &amp; Printable Module Summaries
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              Projector-ready classroom scale, discussion prompts, and clean printable handouts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleTeachingMode(!teachingMode)}
              aria-pressed={teachingMode}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                teachingMode
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] border-[var(--accent-primary)]'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border-hairline)] hover:bg-[var(--bg-canvas)]'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Teaching Mode: {teachingMode ? 'On (Projector)' : 'Off'}</span>
            </button>

            {onOpenExercises && (
              <button
                type="button"
                onClick={() => onOpenExercises(selectedModuleId)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-xs font-semibold hover:bg-[var(--bg-canvas)]"
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>Practice Bank</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] text-[var(--accent-primary-text)] text-xs font-semibold hover:bg-[var(--accent-primary-hover)]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {MODULES.map((mod) => {
              const active = !printAllModules && mod.id === selectedModuleId;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => {
                    setPrintAllModules(false);
                    setSelectedModuleId(mod.id);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    active
                      ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] border-[var(--accent-primary)] font-semibold'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {mod.code}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setPrintAllModules((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-semibold ${
              printAllModules
                ? 'bg-[var(--accent-soft)] text-[var(--accent-soft-text)] border-[var(--accent-primary)]/40'
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
            }`}
          >
            <BookOpenCheck className="w-3.5 h-3.5" />
            <span>{printAllModules ? 'Showing All 8 Modules' : 'Show Full 8-Module Booklet'}</span>
          </button>
        </div>
      </div>

      {/* Printable Summary Sheets */}
      <div className="flex-1 min-h-0 panel-scroll p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {sheetsToRender.map((sheet) => (
            <section
              key={sheet.moduleId}
              className="print-sheet rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 sm:p-6 space-y-5"
            >
              <header className="border-b border-[var(--border-subtle)] pb-3 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-primary)]">
                    Python Data Types Lab · Classroom Revision Handout
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold font-display mt-0.5">
                    {sheet.code}: {sheet.title}
                  </h2>
                </div>
                <span className="text-xs text-[var(--text-muted)]">JSS1 – SSS3 Reference</span>
              </header>

              {/* Big Idea */}
              <div className="rounded-lg bg-[var(--bg-elevated)] p-3.5 border border-[var(--border-subtle)]">
                <div className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1">
                  The Big Idea
                </div>
                <p className="text-sm font-medium leading-relaxed">{sheet.bigIdea}</p>
              </div>

              {/* Key Syntax & Rules */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold font-display">Core Syntax &amp; Rules</h3>
                <div className="overflow-x-auto rounded-lg border border-[var(--border-hairline)]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[var(--bg-elevated)] border-b border-[var(--border-hairline)]">
                        <th className="px-3 py-2 font-bold w-2/5">Python Pattern</th>
                        <th className="px-3 py-2 font-bold">Plain-English Meaning</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sheet.keyRules.map((rule) => (
                        <tr
                          key={rule.syntax}
                          className="border-b border-[var(--border-subtle)] last:border-none"
                        >
                          <td className="px-3 py-2 font-mono-tabular font-semibold text-[var(--accent-primary)]">
                            {rule.syntax}
                          </td>
                          <td className="px-3 py-2 text-[var(--text-secondary)]">{rule.meaning}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Common Traps & Discussion Prompts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3.5 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--semantic-warning-text)]">
                    Common Traps to Watch
                  </h3>
                  <ul className="list-disc pl-4 space-y-1.5 text-xs text-[var(--text-secondary)]">
                    {sheet.commonTraps.map((trap) => (
                      <li key={trap}>{trap}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3.5 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--accent-primary)]">
                    Classroom Discussion Prompts
                  </h3>
                  <ol className="list-decimal pl-4 space-y-1.5 text-xs text-[var(--text-secondary)]">
                    {sheet.discussionPrompts.map((prompt) => (
                      <li key={prompt}>{prompt}</li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Classroom Projector Demo */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold font-display">Live Projector Demo</h3>
                  <button
                    type="button"
                    onClick={() => onRunInTheatre(sheet.classroomDemoCode)}
                    className="no-print inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] text-[var(--accent-primary-text)] text-xs font-semibold hover:bg-[var(--accent-primary-hover)]"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Run Demo in Theatre</span>
                  </button>
                </div>
                <pre className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-3 text-xs font-mono-tabular overflow-x-auto whitespace-pre-wrap">
                  {sheet.classroomDemoCode}
                </pre>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};
