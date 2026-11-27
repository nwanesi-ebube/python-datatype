import React, { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Compass,
  HelpCircle,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
} from 'lucide-react';
import { LessonDefinition, TraceStep } from '../types/lab';
import { CodeEditor } from './CodeEditor';
import { StoryScene } from './StoryScene';

interface LessonStageProps {
  lesson: LessonDefinition;
  code: string;
  onCodeChange: (next: string) => void;
  onResetCode: () => void;
  steps: TraceStep[];
  currentStepIdx: number;
  isPlaying: boolean;
  isPausedForInput: boolean;
  pendingInputPrompt?: string | null;
  speed: number;
  reduceMotion: boolean;
  readAloud: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  onRestart: () => void;
  onSpeedChange: (speed: number) => void;
  onSpeakText: (text: string) => void;
  onRunSnippet: (snippet: string) => void;
  onSubmitInput?: (value: string) => void;
  isCompleted: boolean;
  onMarkCompleted: () => void;
  onPredictSuccess: () => void;
  mobileSubView?: 'learn' | 'code';
}

const SPEEDS = [0.5, 1, 1.5, 2, 3];

export const LessonStage: React.FC<LessonStageProps> = ({
  lesson,
  code,
  onCodeChange,
  onResetCode,
  steps,
  currentStepIdx,
  isPlaying,
  isPausedForInput,
  pendingInputPrompt = null,
  speed,
  reduceMotion,
  onPlay,
  onPause,
  onStepForward,
  onStepBack,
  onRestart,
  onSpeedChange,
  onSpeakText,
  onRunSnippet,
  onSubmitInput,
  isCompleted,
  onMarkCompleted,
  onPredictSuccess,
  mobileSubView,
}) => {
  const [showExplainMore, setShowExplainMore] = useState(false);
  const [predictOpen, setPredictOpen] = useState(false);
  const [selectedPredict, setSelectedPredict] = useState<number | null>(null);
  const [activeBottomTab, setActiveBottomTab] = useState<'uses' | 'mistakes'>('uses');
  const [inlineInput, setInlineInput] = useState('');

  const currentStep = currentStepIdx >= 0 && currentStepIdx < steps.length ? steps[currentStepIdx] : null;
  const activeLine = currentStep ? currentStep.line : null;

  const handlePredictPick = (idx: number) => {
    if (selectedPredict !== null) return;
    setSelectedPredict(idx);
    if (lesson.predict && idx === lesson.predict.correctIndex) {
      onPredictSuccess();
    }
  };

  // On phone (<768px), split between Learn view and Code view cleanly
  const showSceneSection = !mobileSubView || mobileSubView === 'learn';
  const showCodeSection = !mobileSubView || mobileSubView === 'code';

  return (
    <div className="flex flex-col h-full min-h-0 bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* Lesson Top Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--accent-primary)]">{lesson.number}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{lesson.subtitle}</span>
          </div>
          <h1 className="text-base sm:text-lg font-bold font-display truncate">
            {lesson.title}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {lesson.predict && (
            <button
              type="button"
              onClick={() => {
                setPredictOpen((p) => !p);
                setSelectedPredict(null);
              }}
              aria-expanded={predictOpen}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
                predictOpen
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] border-[var(--accent-primary)]'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border-hairline)] hover:border-[var(--accent-primary)]'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Predict Mode</span>
            </button>
          )}

          <button
            type="button"
            onClick={onMarkCompleted}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
              isCompleted
                ? 'bg-[var(--semantic-success-soft)] text-[var(--semantic-success-text)] border-[var(--semantic-success)]'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-hairline)] hover:text-[var(--text-primary)]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isCompleted ? 'Explored' : 'Mark Explored'}</span>
          </button>
        </div>
      </div>

      {/* Main Scrollable Stage Content */}
      <div className="flex-1 min-h-0 panel-scroll p-3 sm:p-4 space-y-3">
        {/* Predict Mode Card */}
        {predictOpen && lesson.predict && (
          <div className="rounded-xl border border-[var(--accent-primary)] bg-[var(--bg-surface)] p-4 space-y-3">
            <div className="text-xs font-bold text-[var(--accent-primary)]">
              Predict Before Running
            </div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {lesson.predict.prompt}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {lesson.predict.options.map((opt, idx) => {
                const picked = selectedPredict === idx;
                const isCorrect = idx === lesson.predict!.correctIndex;
                let cls =
                  'border-[var(--border-hairline)] bg-[var(--bg-canvas)] hover:border-[var(--accent-primary)]';
                if (selectedPredict !== null) {
                  if (isCorrect) {
                    cls =
                      'border-[var(--semantic-success)] bg-[var(--semantic-success-soft)] text-[var(--semantic-success-text)] font-semibold';
                  } else if (picked) {
                    cls =
                      'border-[var(--semantic-warning)] bg-[var(--semantic-warning-soft)] text-[var(--semantic-warning-text)]';
                  }
                }
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePredictPick(idx)}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-colors ${cls}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {selectedPredict !== null && (
              <div className="rounded-lg bg-[var(--bg-elevated)] p-3 text-xs text-[var(--text-secondary)] space-y-1">
                <div className="font-bold text-[var(--text-primary)]">
                  {selectedPredict === lesson.predict.correctIndex
                    ? 'Spot on! Now press Play or Step to watch it happen.'
                    : 'Not quite yet — here is how Python thinks about it:'}
                </div>
                <p>{lesson.predict.explanation}</p>
              </div>
            )}
          </div>
        )}

        {/* Story Scene + Narration Bar */}
        {showSceneSection && (
          <div className="space-y-2.5">
            <div className="h-[210px] sm:h-[235px]">
              <StoryScene
                lesson={lesson}
                currentStep={currentStep}
                reduceMotion={reduceMotion}
                pendingInputPrompt={pendingInputPrompt}
              />
            </div>

            {/* Narration Bar */}
            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3.5 py-2.5 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs sm:text-sm font-medium text-[var(--text-primary)] leading-relaxed">
                  {currentStep
                    ? currentStep.narration
                    : 'Press Play or Step Forward to watch each line of code update the scene and memory.'}
                </p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      onSpeakText(
                        currentStep
                          ? `${currentStep.narration} ${showExplainMore ? currentStep.explainMore : ''}`
                          : `${lesson.title}. ${lesson.subtitle}`
                      )
                    }
                    aria-label="Read narration aloud"
                    title="Read narration aloud"
                    className="p-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  {currentStep && (
                    <button
                      type="button"
                      onClick={() => setShowExplainMore((s) => !s)}
                      className="px-2.5 py-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] whitespace-nowrap"
                    >
                      {showExplainMore ? 'Less' : 'Explain more'}
                    </button>
                  )}
                </div>
              </div>

              {showExplainMore && currentStep && (
                <div className="pt-2 border-t border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] leading-relaxed">
                  {currentStep.explainMore}
                </div>
              )}

              {isPausedForInput && pendingInputPrompt !== null && onSubmitInput && (
                <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--semantic-warning-text)]">
                    Program paused for input({pendingInputPrompt ? `"${pendingInputPrompt}"` : ''}):
                  </span>
                  <input
                    type="text"
                    value={inlineInput}
                    onChange={(e) => setInlineInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const v = inlineInput;
                        setInlineInput('');
                        onSubmitInput(v);
                      }
                    }}
                    placeholder="Type input & press Enter..."
                    aria-label="Inline input response"
                    className="flex-1 min-w-[160px] px-2.5 py-1.5 rounded-lg border border-[var(--accent-primary)] bg-[var(--bg-canvas)] text-xs font-mono-tabular text-[var(--text-primary)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const v = inlineInput;
                      setInlineInput('');
                      onSubmitInput(v);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] text-[var(--accent-primary-text)] text-xs font-semibold hover:bg-[var(--accent-primary-hover)] whitespace-nowrap"
                  >
                    Send Input
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Playback Controls + CodeMirror 6 Editor */}
        {showCodeSection && (
          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] overflow-hidden flex flex-col">
            {/* Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
              <div className="flex items-center gap-1.5">
                {!isPlaying ? (
                  <button
                    type="button"
                    onClick={onPlay}
                    disabled={isPausedForInput}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] text-[var(--accent-primary-text)] text-xs font-semibold hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 whitespace-nowrap"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{currentStepIdx >= 0 && currentStepIdx < steps.length - 1 ? 'Resume' : 'Play'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onPause}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--semantic-warning)] text-white text-xs font-semibold whitespace-nowrap"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onStepBack}
                  disabled={currentStepIdx <= 0}
                  aria-label="Step back"
                  title="Step back (Left arrow)"
                  className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-primary)] disabled:opacity-40 hover:bg-[var(--bg-canvas)]"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={onStepForward}
                  disabled={isPausedForInput}
                  aria-label="Step forward"
                  title="Step forward (Right arrow)"
                  className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-primary)] disabled:opacity-40 hover:bg-[var(--bg-canvas)]"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={onRestart}
                  aria-label="Restart trace"
                  title="Restart from line 1"
                  className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-canvas)]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                {steps.length > 0 && (
                  <span className="text-[11px] font-mono-tabular text-[var(--text-muted)] ml-1 whitespace-nowrap">
                    Step {Math.max(0, currentStepIdx + 1)}/{steps.length}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                  <span>Speed:</span>
                  <select
                    value={speed}
                    onChange={(e) => onSpeedChange(Number(e.target.value))}
                    aria-label="Playback speed"
                    className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-1.5 py-1 text-xs font-mono-tabular"
                  >
                    {SPEEDS.map((s) => (
                      <option key={s} value={s}>
                        {s}x
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  onClick={onResetCode}
                  className="px-2.5 py-1 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] whitespace-nowrap"
                >
                  Reset Code
                </button>
              </div>
            </div>

            {/* Editable Python CodeMirror 6 Area */}
            <div className="h-[220px] sm:h-[250px] min-h-[180px]">
              <CodeEditor
                value={code}
                onChange={onCodeChange}
                activeLine={activeLine}
                onRunShortcut={onPlay}
              />
            </div>
          </div>
        )}

        {/* Where is this used? & Common Mistakes */}
        {showSceneSection && (
          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] overflow-hidden">
            <div className="flex items-center gap-1 p-1.5 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
              <button
                type="button"
                onClick={() => setActiveBottomTab('uses')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeBottomTab === 'uses'
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>Where is this used?</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveBottomTab('mistakes')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeBottomTab === 'mistakes'
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-[var(--semantic-warning)]" />
                <span>Common Mistakes ({lesson.commonMistakes.length})</span>
              </button>
            </div>

            <div className="p-3.5">
              {activeBottomTab === 'uses' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {lesson.realLifeUses.map((use, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3 space-y-1"
                    >
                      <div className="text-[11px] font-semibold text-[var(--accent-primary)]">
                        {use.context}
                      </div>
                      <div className="text-xs font-bold text-[var(--text-primary)]">
                        {use.title}
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        {use.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {lesson.commonMistakes.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[var(--text-primary)]">{m.title}</span>
                        <span className="font-mono-tabular text-[11px] font-semibold text-[var(--semantic-error-text)]">
                          {m.errorLabel}
                        </span>
                      </div>
                      <pre className="p-2 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-mono-tabular text-xs overflow-x-auto m-0">
                        {m.badCode}
                      </pre>
                      <p className="text-xs text-[var(--text-secondary)]">{m.explanation}</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => onRunSnippet(m.badCode)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[var(--semantic-error)]/40 bg-[var(--semantic-error-soft)] text-[var(--semantic-error-text)] text-xs font-semibold"
                        >
                          <Play className="w-3 h-3" />
                          See Error
                        </button>
                        <button
                          type="button"
                          onClick={() => onRunSnippet(m.fixedCode)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[var(--semantic-success)]/40 bg-[var(--semantic-success-soft)] text-[var(--semantic-success-text)] text-xs font-semibold"
                        >
                          <BookOpen className="w-3 h-3" />
                          Run Fixed Code
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
