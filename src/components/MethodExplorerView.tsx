import React, { useMemo, useState } from 'react';
import { FlaskConical, Play, RotateCcw } from 'lucide-react';
import { STAGE3_METHODS } from '../data/moduleD1';
import { STAGE4_METHODS } from '../data/moduleD2';
import { STAGE5_METHODS } from '../data/moduleD3';
import { STAGE6_METHODS } from '../data/moduleD4';
import { executePythonGenerator } from '../engine/interpreter';
import { MethodExplorerEntry, PyTypeName, TraceVariable } from '../types/lab';

interface MethodExplorerViewProps {
  onRunInTheatre: (code: string) => void;
}

const ALL_EXPLORER_METHODS: MethodExplorerEntry[] = [
  ...STAGE3_METHODS,
  ...STAGE4_METHODS,
  ...STAGE5_METHODS,
  ...STAGE6_METHODS,
];
const EXPLORER_TYPES: PyTypeName[] = [
  'int',
  'float',
  'complex',
  'bool',
  'NoneType',
  'str',
  'list',
  'tuple',
  'range',
  'dict',
  'set',
  'frozenset',
  'bytes',
  'bytearray',
];

const SAMPLE_PRESETS: Record<string, string[]> = {
  int: ['42', '255', '1_000', '-7'],
  float: ['4.0', '0.75', '0.1', '12.567'],
  complex: ['3 + 4j', '1 - 2j', '5j'],
  bool: ['True', 'False'],
  NoneType: ['None'],
  str: ['"  amaka okafor  "', '"NG-2026-WAEC"', '"08031234567"', '"Lagos Abuja Kano"'],
  list: ['["Akara", "Zobo", "Boli"]', '[85, 62, 94, 71]', '[10, 20, 30, 40]'],
  tuple: ['(9.0765, 7.3986)', '("WAEC", 2026, "A1")', '(10, 20, 10, 30)'],
  range: ['range(1, 6)', 'range(0, 12, 2)', 'range(10, 0, -2)'],
  dict: ['{"name": "Amaka", "score": 92}', '{"rice": 900, "beans": 750}', 'dict(code="NG", year=2026)'],
  set: ['{"Ada", "Bola", "Chidi"}', '{1, 2, 3, 2, 1}', 'set("LAGOS")'],
  frozenset: ['frozenset(["read", "grade"])', 'frozenset([10, 20, 30])'],
  bytes: ['b"NG-WAEC"', 'b"Hello"', '"₦500".encode("utf-8")'],
  bytearray: ['bytearray(b"NG-01")', 'bytearray([65, 66, 67])'],
};

function runSnippetSync(code: string): {
  output: string;
  variables: TraceVariable[];
  errorMsg: string | null;
} {
  const gen = executePythonGenerator(code);
  let lastVars: TraceVariable[] = [];
  let output = '';
  for (let i = 0; i < 80; i++) {
    const step = gen.next();
    if (step.done) break;
    if (step.value.kind === 'step') {
      lastVars = step.value.trace.variables;
      output = step.value.trace.outputSoFar;
    } else if (step.value.kind === 'error') {
      return {
        output: step.value.finalOutput,
        variables: lastVars,
        errorMsg: `${step.value.error.errorType}: ${step.value.error.message}`,
      };
    } else if (step.value.kind === 'done') {
      output = step.value.finalOutput;
      break;
    } else if (step.value.kind === 'input') {
      break;
    }
  }
  return { output, variables: lastVars, errorMsg: null };
}

export const MethodExplorerView: React.FC<MethodExplorerViewProps> = ({ onRunInTheatre }) => {
  const [selectedType, setSelectedType] = useState<PyTypeName>('int');
  const [sampleLiteral, setSampleLiteral] = useState<string>(SAMPLE_PRESETS.int[0]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>(ALL_EXPLORER_METHODS[0].id);
  const [sliceExpr, setSliceExpr] = useState<string>('0:3');

  const methodsForType = useMemo(
    () => ALL_EXPLORER_METHODS.filter((m) => m.type === selectedType),
    [selectedType]
  );

  const activeMethod: MethodExplorerEntry = useMemo(
    () => methodsForType.find((m) => m.id === selectedMethodId) ?? methodsForType[0],
    [methodsForType, selectedMethodId]
  );

  const handleSelectType = (t: PyTypeName) => {
    setSelectedType(t);
    const presets = SAMPLE_PRESETS[t] ?? ['0'];
    setSampleLiteral(presets[0]);
    setSliceExpr(t === 'str' ? '0:7' : '0:2');
    const firstMethod = ALL_EXPLORER_METHODS.find((m) => m.type === t);
    if (firstMethod) setSelectedMethodId(firstMethod.id);
  };

  const generatedCode = useMemo(() => {
    const safeSample = sampleLiteral.trim() || (SAMPLE_PRESETS[selectedType]?.[0] ?? '0');
    return activeMethod ? activeMethod.sampleCode(safeSample) : '';
  }, [activeMethod, sampleLiteral, selectedType]);

  const result = useMemo(() => runSnippetSync(generatedCode), [generatedCode]);

  const isSequenceType =
    selectedType === 'str' ||
    selectedType === 'list' ||
    selectedType === 'tuple' ||
    selectedType === 'range' ||
    selectedType === 'bytes' ||
    selectedType === 'bytearray';

  const sequencePreview = useMemo(() => {
    if (!isSequenceType) return null;
    const safe = sampleLiteral.trim() || (SAMPLE_PRESETS[selectedType]?.[0] ?? '""');
    const code =
      selectedType === 'str'
        ? `s = ${safe}\nprint(s)\nprint(repr(s[${sliceExpr || ':'}]))`
        : `s = ${safe}\nitems = list(s)\nprint(len(s))\nprint(repr(s[${sliceExpr || ':'}]))\nfor el in items[:12]:\n    print(repr(el))`;
    const evalRes = runSnippetSync(code);
    if (evalRes.errorMsg) return { cells: [] as string[], sliced: '', totalLen: 0, error: evalRes.errorMsg };
    if (selectedType === 'str') {
      const sVar = evalRes.variables.find((v) => v.name === 's');
      const strVal = sVar ? sVar.repr.slice(1, -1) : '';
      const lines = evalRes.output.split('\n');
      const chars = Array.from(strVal).slice(0, 18);
      return { cells: chars, sliced: lines[1] ?? '', totalLen: Array.from(strVal).length, error: null };
    }
    const lines = evalRes.output.trimEnd().split('\n');
    const totalLen = Number(lines[0] ?? 0);
    const sliced = lines[1] ?? '';
    const cells = lines.slice(2).slice(0, 12);
    return { cells, sliced, totalLen, error: null };
  }, [isSequenceType, sampleLiteral, selectedType, sliceExpr]);

  const mappingOrSetPreview = useMemo(() => {
    if (selectedType !== 'dict' && selectedType !== 'set' && selectedType !== 'frozenset') return null;
    const safe = sampleLiteral.trim() || (SAMPLE_PRESETS[selectedType]?.[0] ?? '{}');
    const evalRes = runSnippetSync(`v = ${safe}\nprint(len(v))\nprint(repr(v))`);
    if (evalRes.errorMsg) return { len: 0, repr: '', error: evalRes.errorMsg };
    const lines = evalRes.output.trimEnd().split('\n');
    return { len: Number(lines[0] ?? 0), repr: lines[1] ?? '', error: null };
  }, [sampleLiteral, selectedType]);

  const presets = SAMPLE_PRESETS[selectedType] ?? [];

  return (
    <div className="h-full min-h-0 panel-scroll bg-[var(--bg-canvas)] text-[var(--text-primary)] p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <FlaskConical className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>Interactive Lab · Modules D1, D2, D3 &amp; D4</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-display">
              Method &amp; Type Explorer
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-2xl">
              Pick a Python type, type or choose any sample value, and test its built-in methods and slicing live.
            </p>
          </div>
        </div>

        {/* Type Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)]">
          {EXPLORER_TYPES.map((t) => {
            const active = selectedType === t;
            const count = ALL_EXPLORER_METHODS.filter((m) => m.type === t).length;
            return (
              <button
                key={t}
                type="button"
                onClick={() => handleSelectType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono-tabular transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]'
                }`}
              >
                {t} ({count})
              </button>
            );
          })}
        </div>

        {/* Interactive Sequence Index & Slice Ruler */}
        {isSequenceType && sequencePreview && (
          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xs font-bold text-[var(--text-primary)]">
                  {selectedType === 'range'
                    ? 'Lazy Range Index & Slice Ruler'
                    : `${selectedType} Index & Slice Ruler`}
                </h2>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Positive indices count left-to-right from 0; negative indices count right-to-left from -1.
                  {selectedType === 'range' ? ` (Total length: ${sequencePreview.totalLen})` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="slice-expr" className="text-xs font-mono-tabular text-[var(--text-secondary)]">
                  s[
                </label>
                <input
                  id="slice-expr"
                  type="text"
                  value={sliceExpr}
                  onChange={(e) => setSliceExpr(e.target.value)}
                  placeholder="0:2"
                  className="w-24 px-2 py-1 rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] font-mono-tabular text-xs text-center focus:outline-none focus:border-[var(--accent-primary)]"
                />
                <span className="text-xs font-mono-tabular text-[var(--text-secondary)]">] =</span>
                <span className="font-mono-tabular text-xs font-bold text-[var(--accent-primary)]">
                  {sequencePreview.error ? sequencePreview.error : sequencePreview.sliced}
                </span>
              </div>
            </div>

            {sequencePreview.cells.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {sequencePreview.cells.map((cell, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1 min-w-[34px] font-mono-tabular"
                  >
                    <span className="text-[10px] text-[var(--text-muted)]">{idx}</span>
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      {cell === ' ' ? '·' : cell}
                    </span>
                    {sequencePreview.totalLen <= sequencePreview.cells.length && (
                      <span className="text-[10px] text-[var(--semantic-warning-text)]">
                        {idx - sequencePreview.cells.length}
                      </span>
                    )}
                  </div>
                ))}
                {sequencePreview.totalLen > sequencePreview.cells.length && (
                  <span className="text-xs font-mono-tabular text-[var(--text-muted)] px-2">
                    +{sequencePreview.totalLen - sequencePreview.cells.length} more
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Live Structure Summary for dict / set / frozenset */}
        {mappingOrSetPreview && (
          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h2 className="text-xs font-bold text-[var(--text-primary)]">
                Live {selectedType} Inspector
              </h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                {selectedType === 'dict'
                  ? 'Stores unique hashable keys mapped to values (mutable).'
                  : selectedType === 'set'
                  ? 'Stores unique hashable elements with duplicates removed (mutable).'
                  : 'Locked unique set that can act as a dict key or nested element (immutable).'}
              </p>
            </div>
            <div className="font-mono-tabular text-xs text-[var(--text-primary)]">
              {mappingOrSetPreview.error ? (
                <span className="text-[var(--semantic-error-text)]">{mappingOrSetPreview.error}</span>
              ) : (
                <span>
                  len={mappingOrSetPreview.len} · <span className="text-[var(--accent-primary)]">{mappingOrSetPreview.repr}</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Two-Zone Sandbox Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Zone: Sample Input + Method Picker */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="explorer-sample-input" className="text-xs font-bold text-[var(--text-primary)]">
                  Sample {selectedType} value
                </label>
                <button
                  type="button"
                  onClick={() => setSampleLiteral(presets[0] ?? '0')}
                  className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] whitespace-nowrap"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>
              <input
                id="explorer-sample-input"
                type="text"
                value={sampleLiteral}
                onChange={(e) => setSampleLiteral(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] font-mono-tabular text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                placeholder={`Enter a Python ${selectedType} literal...`}
              />
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-[var(--text-muted)] mr-1">Try:</span>
                {presets.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSampleLiteral(p)}
                    className={`px-2.5 py-1 rounded-md border text-xs font-mono-tabular transition-colors whitespace-nowrap ${
                      sampleLiteral === p
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)] text-[var(--accent-soft-text)] font-semibold'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] overflow-hidden">
              <div className="px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-xs font-bold text-[var(--text-secondary)]">
                Methods &amp; Helpers for {selectedType}
              </div>
              <div className="divide-y divide-[var(--border-subtle)]">
                {methodsForType.map((m) => {
                  const active = activeMethod?.id === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMethodId(m.id)}
                      className={`w-full text-left px-4 py-3 transition-colors space-y-1 ${
                        active ? 'bg-[var(--accent-soft)]/70' : 'hover:bg-[var(--bg-elevated)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono-tabular text-xs font-bold text-[var(--accent-primary)]">
                          {m.name}
                        </span>
                        <span className="text-[11px] font-mono-tabular text-[var(--text-muted)]">
                          returns {m.returns}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        {m.summary}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Zone: Live Execution & Memory Output */}
          {activeMethod && (
            <div className="lg:col-span-7 space-y-4">
              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 sm:p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs text-[var(--text-muted)] font-mono-tabular">
                      {activeMethod.signature} · {activeMethod.mutatesInPlace ? 'mutates in place' : 'returns new object (immutable)'}
                    </div>
                    <h2 className="text-base sm:text-lg font-bold font-display">
                      {activeMethod.name}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRunInTheatre(generatedCode)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--accent-primary)] text-[var(--accent-primary-text)] text-xs font-semibold hover:bg-[var(--accent-primary-hover)] whitespace-nowrap"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Step in Theatre</span>
                  </button>
                </div>

                {/* Live Python Code */}
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-[var(--text-secondary)]">
                    Live Python Code
                  </div>
                  <pre className="p-3 rounded-lg bg-[var(--console-bg)] text-[var(--console-text)] font-mono-tabular text-xs overflow-x-auto m-0 leading-relaxed">
                    {generatedCode}
                  </pre>
                </div>

                {/* Live Console Result */}
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-[var(--text-secondary)]">
                    Instant Console Output
                  </div>
                  {result.errorMsg ? (
                    <div className="p-3 rounded-lg border border-[var(--semantic-warning)]/40 bg-[var(--semantic-warning-soft)] text-[var(--semantic-warning-text)] text-xs font-mono-tabular">
                      Not quite yet — {result.errorMsg}. Try picking one of the sample presets on the left!
                    </div>
                  ) : (
                    <pre className="p-3 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] font-mono-tabular text-xs text-[var(--text-primary)] overflow-x-auto m-0 leading-relaxed">
                      {result.output || '(no printed output)'}
                    </pre>
                  )}
                </div>

                {/* Snapshot of Variables Created */}
                {result.variables.length > 0 && !result.errorMsg && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-[var(--text-secondary)]">
                      Objects Created in Memory
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {result.variables.map((v) => (
                        <div
                          key={v.name}
                          className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 flex items-center justify-between gap-2 text-xs font-mono-tabular"
                        >
                          <div className="truncate">
                            <span className="font-bold text-[var(--text-primary)]">{v.name}</span>
                            <span className="text-[var(--text-muted)]"> = {v.repr}</span>
                          </div>
                          <span className="text-[11px] font-semibold text-[var(--accent-primary)] shrink-0">
                            {v.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-3 text-xs text-[var(--text-secondary)]">
                  <span className="font-semibold text-[var(--text-primary)]">Teacher&apos;s tip: </span>
                  {activeMethod.tip}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

