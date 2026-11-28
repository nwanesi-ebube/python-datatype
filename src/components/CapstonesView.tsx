import React, { Suspense, lazy, useRef, useState } from 'react';
import { CheckCircle2, FolderGit2, Play, RotateCcw, Send, Terminal } from 'lucide-react';
import { CAPSTONE_PROJECTS } from '../data/stage8';
import { executePythonGenerator } from '../engine/interpreter';
import { EngineStepYield } from '../types/lab';

const CodeEditor = lazy(() => import('./CodeEditor').then((m) => ({ default: m.CodeEditor })));

interface CapstonesViewProps {
  completedIds: string[];
  onCompleteCapstone: (capstoneId: string) => void;
  onRunInTheatre: (code: string) => void;
}

export const CapstonesView: React.FC<CapstonesViewProps> = ({
  completedIds,
  onCompleteCapstone,
  onRunInTheatre,
}) => {
  const [selectedId, setSelectedId] = useState<string>(CAPSTONE_PROJECTS[0].id);
  const project = CAPSTONE_PROJECTS.find((c) => c.id === selectedId) ?? CAPSTONE_PROJECTS[0];

  const [codes, setCodes] = useState<Record<string, string>>(() =>
    Object.fromEntries(CAPSTONE_PROJECTS.map((p) => [p.id, p.code]))
  );
  const activeCode = codes[project.id] ?? project.code;

  const genRef = useRef<Generator<EngineStepYield, void, string | undefined> | null>(null);
  const [consoleText, setConsoleText] = useState('');
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [runError, setRunError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  const pumpGenerator = (inputToPass?: string) => {
    const gen = genRef.current;
    if (!gen) return;
    let firstPass = true;
    for (let i = 0; i < 600; i++) {
      const res = gen.next(firstPass ? inputToPass : undefined);
      firstPass = false;
      if (res.done) {
        setIsDone(true);
        setPendingPrompt(null);
        break;
      }
      const val = res.value;
      if (val.kind === 'step') {
        setConsoleText(val.trace.outputSoFar);
      } else if (val.kind === 'input') {
        setConsoleText(val.partialOutput);
        setPendingPrompt(val.prompt);
        return;
      } else if (val.kind === 'error') {
        setConsoleText(val.finalOutput);
        setRunError(`${val.error.errorType} (line ${val.error.line}): ${val.error.friendlyReason}`);
        setPendingPrompt(null);
        setIsDone(true);
        return;
      } else if (val.kind === 'done') {
        setConsoleText(val.finalOutput);
        setPendingPrompt(null);
        setIsDone(true);
        return;
      }
    }
  };

  const startCapstoneRun = () => {
    setRunError(null);
    setConsoleText('');
    setPendingPrompt(null);
    setIsDone(false);
    setInputValue('');
    genRef.current = executePythonGenerator(activeCode);
    pumpGenerator();
  };

  const submitInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingPrompt === null) return;
    const typed = inputValue;
    setInputValue('');
    setPendingPrompt(null);
    pumpGenerator(typed);
  };

  const resetRun = () => {
    genRef.current = null;
    setConsoleText('');
    setPendingPrompt(null);
    setRunError(null);
    setIsDone(false);
  };

  const isCompleted = completedIds.includes(project.id);

  return (
    <div className="h-full min-h-0 panel-scroll bg-[var(--bg-canvas)] text-[var(--text-primary)] p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <FolderGit2 className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>Capstone Projects · Real Interactive Python Apps</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-display">
              Capstones: Build &amp; Play Real Python Programs
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-2xl">
              Combine dicts, lists, sets, tuples, loops, and interactive input() in three complete mini-applications.
            </p>
          </div>
        </div>

        {/* Project Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {CAPSTONE_PROJECTS.map((p) => {
            const active = p.id === project.id;
            const done = completedIds.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedId(p.id);
                  resetRun();
                }}
                className={`p-3.5 rounded-xl border text-left transition-colors space-y-1.5 ${
                  active
                    ? 'bg-[var(--accent-soft)] border-[var(--accent-primary)] text-[var(--accent-soft-text)]'
                    : 'bg-[var(--bg-surface)] border-[var(--border-hairline)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold font-display">{p.title}</span>
                  {done && <CheckCircle2 className="w-4 h-4 text-[var(--semantic-success)] shrink-0" />}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">{p.subtitle}</div>
                <div className="text-[11px] font-mono text-[var(--text-muted)]">
                  {p.typesUsed.join(' · ')}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Capstone Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Code Editor Pane */}
          <div className="lg:col-span-7 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs text-[var(--text-muted)]">{project.context}</div>
                <h2 className="text-base font-bold font-display">{project.title}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCodes((prev) => ({ ...prev, [project.id]: project.code }));
                    resetRun();
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--border-hairline)] text-xs font-medium"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRunInTheatre(activeCode)}
                  className="px-2.5 py-1.5 rounded-lg border border-[var(--border-hairline)] text-xs font-semibold hover:bg-[var(--bg-elevated)]"
                >
                  Open in Theatre
                </button>
                <button
                  type="button"
                  onClick={startCapstoneRun}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] text-[var(--accent-primary-text)] text-xs font-semibold"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Run Interactive App</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)]">{project.description}</p>

            <div className="h-72 rounded-lg border border-[var(--border-hairline)] overflow-hidden">
              <Suspense
                fallback={
                  <div className="h-full flex items-center justify-center bg-[var(--bg-surface)] text-xs text-[var(--text-muted)]">
                    Loading code editor…
                  </div>
                }
              >
                <CodeEditor
                  value={activeCode}
                  onChange={(next) => setCodes((prev) => ({ ...prev, [project.id]: next }))}
                  activeLine={null}
                  onRunShortcut={startCapstoneRun}
                />
              </Suspense>
            </div>
          </div>

          {/* Interactive Terminal Pane */}
          <div className="lg:col-span-5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 flex flex-col justify-between gap-3">
            <div className="space-y-2.5 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Terminal className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span>Interactive Capstone Console</span>
                </div>
                <button
                  type="button"
                  onClick={() => onCompleteCapstone(project.id)}
                  disabled={isDone || isCompleted}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    isCompleted
                      ? 'bg-[var(--semantic-success-soft)] text-[var(--semantic-success-text)]'
                      : 'border border-[var(--border-hairline)] hover:bg-[var(--bg-elevated)]'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isCompleted ? 'Completed (+50 XP)' : 'Mark Completed'}</span>
                </button>
              </div>

              <div className="text-[11px] text-[var(--text-muted)]">{project.sampleInputsHint}</div>

              <div className="flex-1 min-h-[200px] max-h-[300px] overflow-y-auto rounded-lg bg-[var(--console-bg)] text-[var(--console-text)] p-3 font-mono text-xs space-y-2">
                {consoleText ? (
                  <pre className="whitespace-pre-wrap break-words">{consoleText}</pre>
                ) : (
                  <div className="text-slate-400">
                    Click &ldquo;Run Interactive App&rdquo; to play {project.title} right here.
                  </div>
                )}

                {pendingPrompt !== null && (
                  <form onSubmit={submitInput} className="flex items-center gap-2 pt-1 border-t border-slate-700">
                    <span className="text-amber-300 shrink-0">{pendingPrompt}</span>
                    <input
                      type="text"
                      autoFocus
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Type & press Enter..."
                      className="flex-1 min-w-0 bg-slate-900/90 text-white px-2 py-1 rounded border border-slate-600 focus:outline-none focus:border-sky-400"
                    />
                    <button
                      type="submit"
                      aria-label="Send input"
                      className="px-2 py-1 rounded bg-sky-500 text-slate-950 font-semibold inline-flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                    </button>
                  </form>
                )}

                {runError && (
                  <div className="text-rose-300 pt-1">{runError}</div>
                )}

                {isDone && !runError && (
                  <div className="text-emerald-400 pt-1 border-t border-slate-700/70">
                    Program finished cleanly! Click Run Interactive App to play again.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
