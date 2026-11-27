import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Bug,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  Eye,
  EyeOff,
  FileText,
  HelpCircle,
  Lightbulb,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { MODULES } from '../data/curriculum';
import { MODULE_EXERCISE_BANKS } from '../data/moduleSummaries';
import { executePythonGenerator } from '../engine/interpreter';
import { CodeEditor } from './CodeEditor';

export type ExerciseTab = 'mcq' | 'theory' | 'coding' | 'debugging';

interface ExerciseBankViewProps {
  initialModuleId?: string;
  teachingMode?: boolean;
  onRunInTheatre: (code: string) => void;
  onAwardXP?: (xp: number) => void;
  onOpenSummary?: (moduleId: string) => void;
}

interface CheckResult {
  passed: boolean;
  actualOutput: string;
  errorMsg?: string;
  errorHint?: string;
}

function runExerciseCode(code: string): { output: string; errorMsg?: string; errorHint?: string } {
  const gen = executePythonGenerator(code);
  let output = '';
  let guard = 0;
  while (guard++ < 2500) {
    const res = gen.next('100');
    if (res.done) break;
    const val = res.value;
    if (val.kind === 'step') {
      output = val.trace.outputSoFar;
    } else if (val.kind === 'done') {
      output = val.finalOutput;
      break;
    } else if (val.kind === 'error') {
      return {
        output: val.finalOutput,
        errorMsg: `${val.error.errorType}: ${val.error.message} (line ${val.error.line})`,
        errorHint: val.error.hint,
      };
    }
  }
  return { output };
}

export const ExerciseBankView: React.FC<ExerciseBankViewProps> = ({
  initialModuleId,
  teachingMode = false,
  onRunInTheatre,
  onAwardXP,
  onOpenSummary,
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>(
    initialModuleId && MODULES.some((m) => m.id === initialModuleId)
      ? initialModuleId
      : MODULES[0].id
  );
  const [activeTab, setActiveTab] = useState<ExerciseTab>('mcq');
  const [showTeacherKeys, setShowTeacherKeys] = useState(false);

  // Per-question state keyed by exercise ID
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  const [theoryDrafts, setTheoryDrafts] = useState<Record<string, string>>({});
  const [theoryRevealed, setTheoryRevealed] = useState<Record<string, boolean>>({});
  const [codeDrafts, setCodeDrafts] = useState<Record<string, string>>({});
  const [codeHints, setCodeHints] = useState<Record<string, boolean>>({});
  const [checkResults, setCheckResults] = useState<Record<string, CheckResult>>({});
  const [awardedIds, setAwardedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialModuleId && MODULES.some((m) => m.id === initialModuleId)) {
      setSelectedModuleId(initialModuleId);
    }
  }, [initialModuleId]);

  const activeModule = useMemo(
    () => MODULES.find((m) => m.id === selectedModuleId) ?? MODULES[0],
    [selectedModuleId]
  );

  const bank = useMemo(
    () => MODULE_EXERCISE_BANKS.find((b) => b.moduleId === selectedModuleId) ?? MODULE_EXERCISE_BANKS[0],
    [selectedModuleId]
  );

  const awardOnce = (id: string, amount: number) => {
    if (awardedIds[id]) return;
    setAwardedIds((prev) => ({ ...prev, [id]: true }));
    onAwardXP?.(amount);
  };

  const handleSelectMcq = (questionId: string, optionIdx: number, correctIdx: number) => {
    setMcqAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
    if (optionIdx === correctIdx) {
      awardOnce(questionId, 10);
    }
  };

  const handleCheckCode = (id: string, sourceCode: string, expectedOutput: string) => {
    const run = runExerciseCode(sourceCode);
    const passed = !run.errorMsg && run.output.trim() === expectedOutput.trim();
    setCheckResults((prev) => ({
      ...prev,
      [id]: {
        passed,
        actualOutput: run.output,
        errorMsg: run.errorMsg,
        errorHint: run.errorHint,
      },
    }));
    if (passed) {
      awardOnce(id, 20);
    }
  };

  const mcqCorrectCount = bank.mcq.filter((q) => mcqAnswers[q.id] === q.correctIndex).length;
  const codingPassedCount = bank.coding.filter((c) => checkResults[c.id]?.passed).length;
  const debugPassedCount = bank.debugging.filter((d) => checkResults[d.id]?.passed).length;
  const theoryDoneCount = bank.theory.filter((t) => awardedIds[t.id]).length;

  return (
    <div className="h-full min-h-0 flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* Header & Module Selector */}
      <div className="px-4 sm:px-6 py-3.5 border-b border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-3 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-base sm:text-lg font-bold font-display">
              Practice &amp; Exam Bank — {activeModule.code}: {activeModule.title}
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              15 Multiple Choice · 6 Theory · 6 Coding · 4 Debugging per module (248 total questions)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {teachingMode && (
              <button
                type="button"
                onClick={() => setShowTeacherKeys((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                  showTeacherKeys
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] border-[var(--accent-primary)]'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border-hairline)] hover:bg-[var(--bg-canvas)]'
                }`}
              >
                {showTeacherKeys ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showTeacherKeys ? 'Hide Teacher Keys' : 'Reveal Teacher Keys'}</span>
              </button>
            )}
            {onOpenSummary && (
              <button
                type="button"
                onClick={() => onOpenSummary(selectedModuleId)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-xs font-semibold hover:bg-[var(--bg-canvas)]"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Module Handout</span>
              </button>
            )}
          </div>
        </div>

        {/* Module Picker */}
        <div className="flex flex-wrap items-center gap-1.5">
          {MODULES.map((mod) => {
            const active = mod.id === selectedModuleId;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => setSelectedModuleId(mod.id)}
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

        {/* Exercise Type Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'mcq', label: `MCQ (${mcqCorrectCount}/${bank.mcq.length})`, icon: ClipboardCheck },
              { id: 'theory', label: `Theory (${theoryDoneCount}/${bank.theory.length})`, icon: BookOpen },
              { id: 'coding', label: `Coding (${codingPassedCount}/${bank.coding.length})`, icon: Code2 },
              { id: 'debugging', label: `Debugging (${debugPassedCount}/${bank.debugging.length})`, icon: Bug },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  active
                    ? 'bg-[var(--accent-soft)] text-[var(--accent-soft-text)] border-[var(--accent-primary)]/40'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-hairline)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="font-mono-tabular">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Exercise Content */}
      <div className="flex-1 min-h-0 panel-scroll p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {teachingMode && (
            <div className="rounded-xl border border-[var(--accent-primary)]/40 bg-[var(--accent-soft)] px-4 py-2.5 text-xs text-[var(--accent-soft-text)] flex flex-wrap items-center justify-between gap-2">
              <span>
                <strong>Teaching Mode Active:</strong> Larger projector typography is enabled. Toggle &ldquo;Reveal Teacher Keys&rdquo; above whenever you are ready to show solutions in class.
              </span>
            </div>
          )}

          {/* TAB 1: MULTIPLE CHOICE (15 per module) */}
          {activeTab === 'mcq' && (
            <div className="space-y-4">
              {bank.mcq.map((q, idx) => {
                const chosen = mcqAnswers[q.id];
                const isChosen = chosen !== undefined;
                const isCorrect = chosen === q.correctIndex;
                const revealKey = teachingMode && showTeacherKeys;
                return (
                  <article
                    key={q.id}
                    className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-sm font-semibold leading-snug">
                        <span className="font-mono-tabular text-[var(--accent-primary)] mr-1.5">
                          Q{idx + 1}.
                        </span>
                        {q.prompt}
                      </h2>
                      {isChosen && isCorrect && (
                        <CheckCircle2
                          className="w-4 h-4 text-[var(--semantic-success)] shrink-0 mt-0.5"
                          aria-label="Answered accurately"
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, optIdx) => {
                        const selected = chosen === optIdx;
                        const correctOpt = optIdx === q.correctIndex;
                        let style =
                          'border-[var(--border-hairline)] bg-[var(--bg-elevated)] hover:border-[var(--accent-primary)]';
                        if (selected && isCorrect) {
                          style =
                            'border-[var(--semantic-success)] bg-[var(--semantic-success-soft)] text-[var(--semantic-success-text)] font-semibold';
                        } else if (selected && !isCorrect) {
                          style =
                            'border-[var(--semantic-warning)] bg-[var(--semantic-warning-soft)] text-[var(--semantic-warning-text)] font-medium';
                        } else if (revealKey && correctOpt) {
                          style =
                            'border-[var(--semantic-success)] bg-[var(--semantic-success-soft)] text-[var(--semantic-success-text)] font-semibold';
                        }

                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleSelectMcq(q.id, optIdx, q.correctIndex)}
                            className={`text-left px-3 py-2.5 rounded-lg border text-xs transition-colors min-h-[42px] ${style}`}
                          >
                            <span className="font-mono-tabular font-bold mr-2">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {(isChosen || revealKey) && (
                      <div
                        className={`rounded-lg px-3 py-2 text-xs ${
                          isChosen && !isCorrect
                            ? 'bg-[var(--semantic-warning-soft)] text-[var(--semantic-warning-text)]'
                            : 'bg-[var(--semantic-success-soft)] text-[var(--semantic-success-text)]'
                        }`}
                      >
                        <strong>
                          {isChosen
                            ? isCorrect
                              ? 'Spot on! '
                              : 'Not quite yet — '
                            : 'Teacher Key: '}
                        </strong>
                        {q.explanation}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {/* TAB 2: THEORY / WAEC-STYLE EXPLANATIONS (6 per module) */}
          {activeTab === 'theory' && (
            <div className="space-y-4">
              {bank.theory.map((th, idx) => {
                const draft = theoryDrafts[th.id] ?? '';
                const open = Boolean(theoryRevealed[th.id]) || (teachingMode && showTeacherKeys);
                const checked = Boolean(awardedIds[th.id]);
                return (
                  <article
                    key={th.id}
                    className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-sm font-semibold leading-snug">
                        <span className="font-mono-tabular text-[var(--accent-primary)] mr-1.5">
                          Theory {idx + 1}.
                        </span>
                        {th.prompt}
                      </h2>
                      {checked && (
                        <CheckCircle2 className="w-4 h-4 text-[var(--semantic-success)] shrink-0 mt-0.5" />
                      )}
                    </div>

                    <textarea
                      value={draft}
                      onChange={(e) =>
                        setTheoryDrafts((prev) => ({ ...prev, [th.id]: e.target.value }))
                      }
                      rows={3}
                      placeholder="Write your explanation in plain English before comparing with the marking guide..."
                      className="w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setTheoryRevealed((prev) => ({ ...prev, [th.id]: !prev[th.id] }))
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-xs font-semibold hover:bg-[var(--bg-canvas)]"
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>{open ? 'Hide Model Answer' : 'Show Marking Points & Model Answer'}</span>
                      </button>

                      {open && !checked && (
                        <button
                          type="button"
                          onClick={() => awardOnce(th.id, 10)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--semantic-success)] text-white text-xs font-semibold"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Mark Self-Checked (+10 XP)</span>
                        </button>
                      )}
                    </div>

                    {open && (
                      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 space-y-2 text-xs">
                        <div>
                          <div className="font-bold text-[var(--text-primary)] mb-1">
                            Key Marking Points
                          </div>
                          <ul className="list-disc pl-4 space-y-0.5 text-[var(--text-secondary)]">
                            {th.keyPoints.map((kp) => (
                              <li key={kp}>{kp}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="font-bold text-[var(--text-primary)] mb-0.5">
                            Model Answer
                          </div>
                          <p className="text-[var(--text-secondary)] leading-relaxed">
                            {th.modelAnswer}
                          </p>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {/* TAB 3: CODING EXERCISES (6 per module) */}
          {activeTab === 'coding' && (
            <div className="space-y-4">
              {bank.coding.map((ex, idx) => {
                const source = codeDrafts[ex.id] ?? ex.starterCode;
                const result = checkResults[ex.id];
                const showHint = Boolean(codeHints[ex.id]) || (teachingMode && showTeacherKeys);
                return (
                  <article
                    key={ex.id}
                    className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h2 className="text-sm font-semibold">
                          <span className="font-mono-tabular text-[var(--accent-primary)] mr-1.5">
                            Code {idx + 1}.
                          </span>
                          {ex.title}
                        </h2>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{ex.prompt}</p>
                      </div>
                      {result?.passed && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--semantic-success-text)] bg-[var(--semantic-success-soft)] px-2.5 py-1 rounded-md">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Passed
                        </span>
                      )}
                    </div>

                    <div className="h-36 rounded-lg border border-[var(--border-hairline)] overflow-hidden">
                      <CodeEditor
                        value={source}
                        onChange={(next) =>
                          setCodeDrafts((prev) => ({ ...prev, [ex.id]: next }))
                        }
                        activeLine={null}
                        onRunShortcut={() => handleCheckCode(ex.id, source, ex.expectedOutput)}
                        showMobileBar={true}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCheckCode(ex.id, source, ex.expectedOutput)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] text-[var(--accent-primary-text)] text-xs font-semibold hover:bg-[var(--accent-primary-hover)]"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Run &amp; Check</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onRunInTheatre(source)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-xs font-semibold hover:bg-[var(--bg-canvas)]"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Step in Theatre</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCodeDrafts((prev) => ({ ...prev, [ex.id]: ex.starterCode }));
                          setCheckResults((prev) => {
                            const next = { ...prev };
                            delete next[ex.id];
                            return next;
                          });
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs font-medium hover:bg-[var(--bg-elevated)]"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setCodeHints((prev) => ({ ...prev, [ex.id]: !prev[ex.id] }))
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs font-medium hover:bg-[var(--bg-elevated)]"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>{showHint ? 'Hide Hint' : 'Hint'}</span>
                      </button>
                    </div>

                    {showHint && (
                      <div className="rounded-lg bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                        <strong>Hint:</strong> <span className="font-mono-tabular">{ex.hint}</span>
                      </div>
                    )}

                    {result && (
                      <div
                        className={`rounded-lg p-3 text-xs space-y-1.5 ${
                          result.passed
                            ? 'bg-[var(--semantic-success-soft)] text-[var(--semantic-success-text)]'
                            : 'bg-[var(--semantic-warning-soft)] text-[var(--semantic-warning-text)]'
                        }`}
                      >
                        <div className="font-semibold">
                          {result.passed
                            ? 'Well done! Output matches perfectly (+20 XP).'
                            : 'Not quite yet — compare your output with the expected output below.'}
                        </div>
                        {result.errorMsg && (
                          <div className="font-mono-tabular">
                            {result.errorMsg} {result.errorHint ? `— ${result.errorHint}` : ''}
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          <div>
                            <div className="text-[11px] font-bold uppercase opacity-80">
                              Expected Output
                            </div>
                            <pre className="mt-0.5 rounded bg-black/10 p-2 font-mono-tabular whitespace-pre-wrap">
                              {ex.expectedOutput}
                            </pre>
                          </div>
                          <div>
                            <div className="text-[11px] font-bold uppercase opacity-80">
                              Your Output
                            </div>
                            <pre className="mt-0.5 rounded bg-black/10 p-2 font-mono-tabular whitespace-pre-wrap">
                              {result.actualOutput || '(no output)'}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {/* TAB 4: DEBUGGING CHALLENGES (4 per module) */}
          {activeTab === 'debugging' && (
            <div className="space-y-4">
              {bank.debugging.map((dbg, idx) => {
                const source = codeDrafts[dbg.id] ?? dbg.buggyCode;
                const result = checkResults[dbg.id];
                const showHint = Boolean(codeHints[dbg.id]) || (teachingMode && showTeacherKeys);
                return (
                  <article
                    key={dbg.id}
                    className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h2 className="text-sm font-semibold">
                          <span className="font-mono-tabular text-[var(--accent-primary)] mr-1.5">
                            Debug {idx + 1}.
                          </span>
                          {dbg.title}
                        </h2>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{dbg.prompt}</p>
                      </div>
                      {result?.passed && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--semantic-success-text)] bg-[var(--semantic-success-soft)] px-2.5 py-1 rounded-md">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Fixed
                        </span>
                      )}
                    </div>

                    <div className="h-36 rounded-lg border border-[var(--border-hairline)] overflow-hidden">
                      <CodeEditor
                        value={source}
                        onChange={(next) =>
                          setCodeDrafts((prev) => ({ ...prev, [dbg.id]: next }))
                        }
                        activeLine={null}
                        onRunShortcut={() => handleCheckCode(dbg.id, source, dbg.expectedOutput)}
                        showMobileBar={true}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCheckCode(dbg.id, source, dbg.expectedOutput)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] text-[var(--accent-primary-text)] text-xs font-semibold hover:bg-[var(--accent-primary-hover)]"
                      >
                        <Bug className="w-3.5 h-3.5" />
                        <span>Test Fix</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onRunInTheatre(source)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-xs font-semibold hover:bg-[var(--bg-canvas)]"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Step in Theatre</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCodeDrafts((prev) => ({ ...prev, [dbg.id]: dbg.buggyCode }));
                          setCheckResults((prev) => {
                            const next = { ...prev };
                            delete next[dbg.id];
                            return next;
                          });
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs font-medium hover:bg-[var(--bg-elevated)]"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Buggy Code</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setCodeHints((prev) => ({ ...prev, [dbg.id]: !prev[dbg.id] }))
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs font-medium hover:bg-[var(--bg-elevated)]"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>{showHint ? 'Hide Hint' : 'Hint'}</span>
                      </button>
                    </div>

                    {showHint && (
                      <div className="rounded-lg bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                        <strong>Hint:</strong> <span className="font-mono-tabular">{dbg.hint}</span>
                      </div>
                    )}

                    {result && (
                      <div
                        className={`rounded-lg p-3 text-xs space-y-1.5 ${
                          result.passed
                            ? 'bg-[var(--semantic-success-soft)] text-[var(--semantic-success-text)]'
                            : 'bg-[var(--semantic-warning-soft)] text-[var(--semantic-warning-text)]'
                        }`}
                      >
                        <div className="font-semibold">
                          {result.passed
                            ? 'Bug squashed! Output matches cleanly (+20 XP).'
                            : 'Not quite yet — inspect the output or error message below.'}
                        </div>
                        {result.errorMsg && (
                          <div className="font-mono-tabular">
                            {result.errorMsg} {result.errorHint ? `— ${result.errorHint}` : ''}
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          <div>
                            <div className="text-[11px] font-bold uppercase opacity-80">
                              Expected Output
                            </div>
                            <pre className="mt-0.5 rounded bg-black/10 p-2 font-mono-tabular whitespace-pre-wrap">
                              {dbg.expectedOutput}
                            </pre>
                          </div>
                          <div>
                            <div className="text-[11px] font-bold uppercase opacity-80">
                              Your Output
                            </div>
                            <pre className="mt-0.5 rounded bg-black/10 p-2 font-mono-tabular whitespace-pre-wrap">
                              {result.actualOutput || '(no output)'}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
