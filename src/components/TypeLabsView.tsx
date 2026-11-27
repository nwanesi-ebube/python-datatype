import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  CheckCircle2,
  Compass,
  Copy,
  Layers,
  Play,
  RotateCcw,
} from 'lucide-react';
import {
  CONVERSION_SOURCE_PRESETS,
  CONVERSION_TYPES,
  getConversionRule,
  OPERATION_PRESETS,
  TYPE_CHOOSER_SCENARIOS,
} from '../data/moduleE';
import { executePythonGenerator } from '../engine/interpreter';
import { PyTypeName, TraceVariable } from '../types/lab';

export type TypeLabTab = 'conversion-matrix' | 'operation-lab' | 'mutability-lab' | 'type-chooser';

interface TypeLabsViewProps {
  initialTab?: TypeLabTab;
  onRunInTheatre: (code: string) => void;
  onAwardXP?: (xp: number) => void;
}

interface LabExecResult {
  output: string;
  variables: TraceVariable[];
  errorType: string | null;
  errorMsg: string | null;
}

function runLabCode(code: string): LabExecResult {
  const gen = executePythonGenerator(code);
  let lastVars: TraceVariable[] = [];
  let output = '';
  for (let i = 0; i < 120; i++) {
    const step = gen.next();
    if (step.done) break;
    if (step.value.kind === 'step') {
      lastVars = step.value.trace.variables;
      output = step.value.trace.outputSoFar;
    } else if (step.value.kind === 'error') {
      return {
        output: step.value.finalOutput,
        variables: lastVars,
        errorType: step.value.error.errorType,
        errorMsg: step.value.error.message,
      };
    } else if (step.value.kind === 'done') {
      output = step.value.finalOutput;
      break;
    } else if (step.value.kind === 'input') {
      break;
    }
  }
  return { output, variables: lastVars, errorType: null, errorMsg: null };
}

const MUTABILITY_PRESETS = [
  {
    id: 'alias-list',
    label: 'List Alias (b = a)',
    code: `a = ["Garri", "Milk"]\nb = a\nb.append("Sugar")\nprint("a:", a, "| b:", b)\nprint("Same id?", id(a) == id(b))`,
    explanation: 'Assignment b = a never copies the list! Both tags point to the exact same mutable list object in memory.',
  },
  {
    id: 'copy-list',
    label: 'Flat List Copy (b = a.copy())',
    code: `a = ["Garri", "Milk"]\nb = a.copy()\nb.append("Sugar")\nprint("a:", a, "| b:", b)\nprint("Same id?", id(a) == id(b))`,
    explanation: 'a.copy() creates a brand-new outer list with a different id(), so appending to b leaves a untouched.',
  },
  {
    id: 'shallow-nested',
    label: 'Shallow Copy Nested (copy.copy)',
    code: `import copy\na = [["Ada", 88], ["Bola", 91]]\nb = copy.copy(a)\nb[0][1] = 99\nprint("a:", a)\nprint("Outer same id?", id(a) == id(b), "| Inner[0] same id?", id(a[0]) == id(b[0]))`,
    explanation: 'Shallow copy makes a new outer box, but the inner lists inside are still shared references! Editing b[0][1] mutates a[0].',
  },
  {
    id: 'deep-nested',
    label: 'Deep Copy Nested (copy.deepcopy)',
    code: `import copy\na = [["Ada", 88], ["Bola", 91]]\nb = copy.deepcopy(a)\nb[0][1] = 99\nprint("a:", a, "| b:", b)\nprint("Inner[0] same id?", id(a[0]) == id(b[0]))`,
    explanation: 'copy.deepcopy() recursively duplicates every nested container so edits to b never reach a.',
  },
  {
    id: 'immutable-int',
    label: 'Immutable Reassign (int / str)',
    code: `score = 500\nbackup = score\nscore = score + 50\nprint("score:", score, "| backup:", backup)\nprint("Same id?", id(score) == id(backup))`,
    explanation: 'Integers and strings are immutable. Changing score creates a brand-new int object and moves only the score tag.',
  },
  {
    id: 'mutable-dict',
    label: 'Dict In-Place Update',
    code: `shop = {"rice": 900, "beans": 750}\nref = shop\nshop["yam"] = 600\nprint("ref sees yam:", ref)\nprint("Same id?", id(shop) == id(ref))`,
    explanation: 'Dictionaries are mutable! Mutating a key in place keeps the same object id(), so any alias sees the update.',
  },
];

export const TypeLabsView: React.FC<TypeLabsViewProps> = ({
  initialTab = 'conversion-matrix',
  onRunInTheatre,
  onAwardXP,
}) => {
  const [activeTab, setActiveTab] = useState<TypeLabTab>(initialTab);

  // Sync when navigated directly from MenuPanel shortcut
  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // 1. Conversion Matrix State
  const [selectedSourceKey, setSelectedSourceKey] = useState<string>('str_num');
  const [customSourceExpr, setCustomSourceExpr] = useState<string>(CONVERSION_SOURCE_PRESETS.str_num.expr);
  const [targetConvType, setTargetConvType] = useState<PyTypeName>('int');

  // 2. Operation Lab State
  const [opLeft, setOpLeft] = useState<string>('"NG-"');
  const [opSymbol, setOpSymbol] = useState<string>('+');
  const [opRight, setOpRight] = useState<string>('"2026"');

  // 3. Mutability Lab State
  const [mutPresetId, setMutPresetId] = useState<string>(MUTABILITY_PRESETS[0].id);

  // 4. Type Chooser State
  const [wizardMode, setWizardMode] = useState<'single' | 'collection'>('collection');
  const [wizardOrder, setWizardOrder] = useState<'ordered' | 'unique' | 'keyvalue'>('keyvalue');
  const [wizardMutable, setWizardMutable] = useState<'mutable' | 'immutable'>('mutable');
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [pickedType, setPickedType] = useState<PyTypeName | null>(null);
  const [solvedScenarios, setSolvedScenarios] = useState<string[]>([]);

  // Live Conversion Computation
  const sourcePreset = CONVERSION_SOURCE_PRESETS[selectedSourceKey] ?? CONVERSION_SOURCE_PRESETS.str_num;
  const activeConvCode = useMemo(() => {
    const expr = customSourceExpr.trim() || sourcePreset.expr;
    return `src = ${expr}\nprint("From:", repr(src), type(src))\nconverted = ${targetConvType}(src)\nprint("To:", repr(converted), type(converted))`;
  }, [customSourceExpr, sourcePreset.expr, targetConvType]);

  const convResult = useMemo(() => runLabCode(activeConvCode), [activeConvCode]);
  const convRule = useMemo(
    () => getConversionRule(sourcePreset.type, targetConvType),
    [sourcePreset.type, targetConvType]
  );

  // Live Operation Lab Computation
  const opCode = useMemo(() => {
    const left = opLeft.trim() || '0';
    const right = opRight.trim() || '0';
    return `left = ${left}\nright = ${right}\nresult = left ${opSymbol} right\nprint("Result:", repr(result))\nprint("Type:", type(result))\nprint("Same object (is)?", left is right)`;
  }, [opLeft, opRight, opSymbol]);

  const opResult = useMemo(() => runLabCode(opCode), [opCode]);

  // Live Mutability Lab Computation
  const activeMutPreset = MUTABILITY_PRESETS.find((p) => p.id === mutPresetId) ?? MUTABILITY_PRESETS[0];
  const mutResult = useMemo(() => runLabCode(activeMutPreset.code), [activeMutPreset]);

  // Wizard Recommendation
  const wizardRecommendation = useMemo<{ type: PyTypeName; reason: string; example: string }>(() => {
    if (wizardMode === 'single') {
      if (wizardOrder === 'keyvalue') {
        return {
          type: 'dict',
          reason: 'For a structured single record with named fields (like name, age, score), a dict keeps every field labelled.',
          example: `record = {"name": "Amaka", "score": 92}`,
        };
      }
      if (wizardOrder === 'unique') {
        return {
          type: 'bool',
          reason: 'For a single True/False flag or toggle, choose bool (or NoneType when a value is not yet set).',
          example: `is_paid = True\npending_score = None`,
        };
      }
      return {
        type: wizardMutable === 'mutable' ? 'bytearray' : 'int',
        reason:
          wizardMutable === 'mutable'
            ? 'Single primitive values (int, float, str, bool) are immutable; use bytearray only for editable raw byte buffers.'
            : 'Use int for exact counts/kobo, float for measurements, and str for text.',
        example: `amount_kobo = 2500\ntitle = "SS2 Physics"`,
      };
    }

    if (wizardOrder === 'keyvalue') {
      return {
        type: 'dict',
        reason: 'Key-value lookup pairs belong in a dict (keys must be immutable/hashable).',
        example: `prices = {"rice": 900, "beans": 750}`,
      };
    }
    if (wizardOrder === 'unique') {
      return wizardMutable === 'mutable'
        ? {
            type: 'set',
            reason: 'set automatically drops duplicates, supports Venn algebra (& | - ^), and allows .add()/.discard().',
            example: `clubs = {"Ada", "Bola", "Chidi"}`,
          }
        : {
            type: 'frozenset',
            reason: 'frozenset holds unique elements while remaining immutable and hashable (safe as a dict key).',
            example: `roles = frozenset(["read", "grade"])`,
          };
    }
    return wizardMutable === 'mutable'
      ? {
          type: 'list',
          reason: 'Ordered collection that grows, shrinks, or sorts in place: list is your everyday workhorse.',
          example: `queue = ["Chidi", "Amaka"]`,
        }
      : {
          type: 'tuple',
          reason: 'Ordered sequence that should stay fixed (GPS coordinates, RGB, dates): choose tuple.',
          example: `abuja_gps = (9.0765, 7.3986)`,
        };
  }, [wizardMode, wizardMutable, wizardOrder]);

  const currentScenario = TYPE_CHOOSER_SCENARIOS[scenarioIdx] ?? TYPE_CHOOSER_SCENARIOS[0];
  const isScenarioCorrect = pickedType === currentScenario.correctType;

  const handleSelectMatrixCell = (from: PyTypeName, to: PyTypeName) => {
    const matchKey =
      Object.keys(CONVERSION_SOURCE_PRESETS).find((k) => CONVERSION_SOURCE_PRESETS[k].type === from) ??
      'str_num';
    setSelectedSourceKey(matchKey);
    setCustomSourceExpr(CONVERSION_SOURCE_PRESETS[matchKey].expr);
    setTargetConvType(to);
  };

  return (
    <div className="h-full min-h-0 panel-scroll bg-[var(--bg-canvas)] text-[var(--text-primary)] p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header & 4-Tab Bar */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <Layers className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>Module E Laboratories · Interactive Sandboxes</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-display">
              Conversions, Operators, Mutability &amp; Type Chooser
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-2xl">
              Experiment live with how Python casts values, adapts operators across types, shares memory references, and selects the best container.
            </p>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Module E Interactive Laboratories"
          className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)]"
        >
          {(
            [
              { id: 'conversion-matrix', label: 'Conversion Matrix', icon: ArrowRight },
              { id: 'operation-lab', label: 'Operation Lab', icon: Calculator },
              { id: 'mutability-lab', label: 'Mutability Lab', icon: Copy },
              { id: 'type-chooser', label: 'Type Chooser', icon: Compass },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: CONVERSION MATRIX */}
        {activeTab === 'conversion-matrix' && (
          <div className="space-y-5">
            {/* Live Sandbox Converter */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-bold font-display">1. Live Converter Bench</h2>
                  <button
                    type="button"
                    onClick={() => onRunInTheatre(activeConvCode)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] text-[var(--accent-primary-text)] text-xs font-semibold hover:bg-[var(--accent-primary-hover)] whitespace-nowrap shrink-0"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Run in Theatre</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">Pick a starting value</span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(CONVERSION_SOURCE_PRESETS).map(([key, item]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setSelectedSourceKey(key);
                          setCustomSourceExpr(item.expr);
                        }}
                        className={`px-2 py-1 rounded-md text-[11px] font-mono border transition-colors ${
                          selectedSourceKey === key && customSourceExpr === item.expr
                            ? 'bg-[var(--accent-soft)] text-[var(--accent-soft-text)] border-[var(--accent-primary)] font-semibold'
                            : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <label className="block space-y-1 text-xs">
                    <span className="font-semibold text-[var(--text-secondary)]">Source Python expression</span>
                    <input
                      type="text"
                      value={customSourceExpr}
                      onChange={(e) => setCustomSourceExpr(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] font-mono text-xs text-[var(--text-primary)]"
                    />
                  </label>
                  <label className="block space-y-1 text-xs">
                    <span className="font-semibold text-[var(--text-secondary)]">Target converter</span>
                    <select
                      value={targetConvType}
                      onChange={(e) => setTargetConvType(e.target.value as PyTypeName)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] font-mono text-xs text-[var(--text-primary)]"
                    >
                      {CONVERSION_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}(src)
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed pt-1">
                  <strong className="text-[var(--text-primary)]">Rule:</strong> {convRule.summary}
                </p>
              </div>

              {/* Output Card */}
              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 flex flex-col justify-between gap-3">
                <div className="space-y-2">
                  <h2 className="text-sm font-bold font-display">2. Python Output &amp; Memory Result</h2>
                  <pre className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-3 text-xs font-mono overflow-x-auto text-[var(--text-primary)]">
                    {activeConvCode}
                  </pre>
                </div>

                {convResult.errorType ? (
                  <div className="rounded-lg border border-[var(--semantic-error)]/40 bg-[var(--semantic-error-soft)] p-3 text-xs text-[var(--semantic-error-text)] space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Not quite compatible — {convResult.errorType}</span>
                    </div>
                    <p className="font-mono">{convResult.errorMsg}</p>
                  </div>
                ) : (
                  <div className="rounded-lg bg-[var(--console-bg)] text-[var(--console-text)] p-3 text-xs font-mono space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Converted cleanly</span>
                    </div>
                    <pre className="whitespace-pre-wrap">{convResult.output || '(no output)'}</pre>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive 9x9 Conversion Compatibility Matrix */}
            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold font-display">Compatibility Matrix (Click any cell to test it)</h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Rows = starting type · Columns = target constructor · OK = always works · Check = depends on value · Error = TypeError
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs font-mono-tabular">
                  <thead>
                    <tr>
                      <th className="p-2 text-left text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                        From \ To
                      </th>
                      {CONVERSION_TYPES.map((to) => (
                        <th key={to} className="p-2 text-center font-bold border-b border-[var(--border-subtle)]">
                          {to}()
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {CONVERSION_TYPES.map((from) => (
                      <tr key={from} className="border-b border-[var(--border-subtle)]/60 last:border-b-0">
                        <th className="p-2 text-left font-bold text-[var(--text-primary)] whitespace-nowrap">
                          {from}
                        </th>
                        {CONVERSION_TYPES.map((to) => {
                          const rule = getConversionRule(from, to);
                          const isSelected = sourcePreset.type === from && targetConvType === to;
                          const label =
                            rule.status === 'safe' ? '✓ OK' : rule.status === 'conditional' ? '◐ Check' : '✕ Err';
                          const tone =
                            rule.status === 'safe'
                              ? 'bg-[var(--semantic-success-soft)] text-[var(--semantic-success-text)]'
                              : rule.status === 'conditional'
                              ? 'bg-[var(--semantic-warning-soft)] text-[var(--semantic-warning-text)]'
                              : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]';
                          return (
                            <td key={to} className="p-1 text-center">
                              <button
                                type="button"
                                onClick={() => handleSelectMatrixCell(from, to)}
                                title={rule.summary}
                                className={`w-full min-h-[34px] px-1.5 py-1 rounded text-[11px] font-semibold transition-all ${tone} ${
                                  isSelected ? 'ring-2 ring-[var(--accent-primary)]' : 'hover:opacity-85'
                                }`}
                              >
                                {label}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: OPERATION LAB */}
        {activeTab === 'operation-lab' && (
          <div className="space-y-5">
            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold font-display">Quick Operator Experiments</h2>
                  <p className="text-xs text-[var(--text-muted)]">Click any preset or build your own expression below.</p>
                </div>
                <button
                  type="button"
                  onClick={() => onRunInTheatre(opCode)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] text-[var(--accent-primary-text)] text-xs font-semibold hover:bg-[var(--accent-primary-hover)] whitespace-nowrap shrink-0"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Run in Theatre</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {OPERATION_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setOpLeft(p.leftExpr);
                      setOpSymbol(p.op);
                      setOpRight(p.rightExpr);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                      opLeft === p.leftExpr && opSymbol === p.op && opRight === p.rightExpr
                        ? 'bg-[var(--accent-soft)] text-[var(--accent-soft-text)] border-[var(--accent-primary)] font-semibold'
                        : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
                <label className="sm:col-span-5 block space-y-1 text-xs">
                  <span className="font-semibold text-[var(--text-secondary)]">Left operand</span>
                  <input
                    type="text"
                    value={opLeft}
                    onChange={(e) => setOpLeft(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] font-mono text-xs"
                  />
                </label>

                <label className="sm:col-span-2 block space-y-1 text-xs">
                  <span className="font-semibold text-[var(--text-secondary)]">Operator</span>
                  <select
                    value={opSymbol}
                    onChange={(e) => setOpSymbol(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] font-mono text-xs font-bold"
                  >
                    {['+', '-', '*', '/', '//', '%', '**', '==', '!=', 'is', '<', '>', 'in', '&', '|', '^'].map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="sm:col-span-5 block space-y-1 text-xs">
                  <span className="font-semibold text-[var(--text-secondary)]">Right operand</span>
                  <input
                    type="text"
                    value={opRight}
                    onChange={(e) => setOpRight(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] font-mono text-xs"
                  />
                </label>
              </div>
            </div>

            {/* Result & Takeaways */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-2">
                <h3 className="text-xs font-bold text-[var(--text-secondary)]">Generated Test Script</h3>
                <pre className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-3 text-xs font-mono overflow-x-auto">
                  {opCode}
                </pre>
                {(() => {
                  const matched = OPERATION_PRESETS.find(
                    (p) => p.leftExpr === opLeft && p.op === opSymbol && p.rightExpr === opRight
                  );
                  return matched ? (
                    <p className="text-xs text-[var(--text-secondary)] pt-1">
                      <strong className="text-[var(--text-primary)]">Key takeaway:</strong> {matched.takeaway}
                    </p>
                  ) : null;
                })()}
              </div>

              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-2">
                <h3 className="text-xs font-bold text-[var(--text-secondary)]">Live Result</h3>
                {opResult.errorType ? (
                  <div className="rounded-lg border border-[var(--semantic-error)]/40 bg-[var(--semantic-error-soft)] p-3 text-xs text-[var(--semantic-error-text)] space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Not allowed — {opResult.errorType}</span>
                    </div>
                    <p className="font-mono">{opResult.errorMsg}</p>
                    <p className="pt-1">
                      Python keeps strict boundaries between incompatible types rather than guessing silently.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg bg-[var(--console-bg)] text-[var(--console-text)] p-3 text-xs font-mono space-y-1.5">
                    <pre className="whitespace-pre-wrap">{opResult.output}</pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MUTABILITY LAB */}
        {activeTab === 'mutability-lab' && (
          <div className="space-y-5">
            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold font-display">Mutability, Aliasing &amp; Copy Simulator</h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Watch how Python shares object IDs on assignment (=), copies 1 level on .copy(), and isolates nested boxes with deepcopy().
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRunInTheatre(activeMutPreset.code)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] text-[var(--accent-primary-text)] text-xs font-semibold hover:bg-[var(--accent-primary-hover)] whitespace-nowrap shrink-0"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Step in Theatre</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {MUTABILITY_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setMutPresetId(p.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      mutPresetId === p.id
                        ? 'bg-[var(--accent-soft)] text-[var(--accent-soft-text)] border-[var(--accent-primary)]'
                        : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Code + Explanation */}
              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-3">
                <pre className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-3 text-xs font-mono overflow-x-auto">
                  {activeMutPreset.code}
                </pre>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  <strong className="text-[var(--text-primary)]">What happened:</strong> {activeMutPreset.explanation}
                </p>
                <div className="rounded-lg bg-[var(--console-bg)] text-[var(--console-text)] p-3 text-xs font-mono">
                  <pre className="whitespace-pre-wrap">{mutResult.output}</pre>
                </div>
              </div>

              {/* Live Memory Objects Card */}
              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-3">
                <h3 className="text-sm font-bold font-display">Final Memory State &amp; Object IDs</h3>
                <div className="space-y-2">
                  {mutResult.variables.map((v) => (
                    <div
                      key={v.name}
                      className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2.5 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 font-mono">
                          <span className="font-bold text-[var(--text-primary)]">{v.name}</span>
                          <span className="text-[var(--text-muted)]">·</span>
                          <span className="text-[var(--accent-primary)]">{v.type}</span>
                          <span className="text-[var(--text-muted)]">·</span>
                          <span className="text-[var(--text-muted)]">
                            {v.mutable ? 'Mutable' : 'Immutable'}
                          </span>
                        </div>
                        <div className="font-mono text-[var(--text-secondary)] truncate">{v.repr}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono-tabular text-[11px] text-[var(--text-muted)]">
                          id: {v.objectId}
                        </div>
                        {v.aliasedWith && v.aliasedWith.length > 0 && (
                          <div className="text-[11px] font-semibold text-[var(--semantic-warning-text)]">
                            Shares id with {v.aliasedWith.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TYPE CHOOSER */}
        {activeTab === 'type-chooser' && (
          <div className="space-y-5">
            {/* Wizard */}
            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-4">
              <div>
                <h2 className="text-sm font-bold font-display">1. Interactive Type Finder Wizard</h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Answer three quick questions about your data to see the Python type built for that job.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">Q1. How much data?</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(
                      [
                        { id: 'single', label: 'Single value' },
                        { id: 'collection', label: 'Collection' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setWizardMode(opt.id)}
                        className={`min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
                          wizardMode === opt.id
                            ? 'bg-[var(--accent-soft)] text-[var(--accent-soft-text)] border-[var(--accent-primary)] font-semibold'
                            : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">Q2. Structure needed?</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { id: 'ordered', label: 'Ordered' },
                        { id: 'unique', label: 'Unique' },
                        { id: 'keyvalue', label: 'Key→Val' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setWizardOrder(opt.id)}
                        className={`min-h-[38px] px-2 py-1.5 rounded-lg text-xs font-medium border ${
                          wizardOrder === opt.id
                            ? 'bg-[var(--accent-soft)] text-[var(--accent-soft-text)] border-[var(--accent-primary)] font-semibold'
                            : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">Q3. Can it change later?</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(
                      [
                        { id: 'mutable', label: 'Mutable' },
                        { id: 'immutable', label: 'Locked' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setWizardMutable(opt.id)}
                        className={`min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
                          wizardMutable === opt.id
                            ? 'bg-[var(--accent-soft)] text-[var(--accent-soft-text)] border-[var(--accent-primary)] font-semibold'
                            : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1 max-w-2xl">
                  <div className="text-xs font-bold text-[var(--accent-primary)] font-mono">
                    Recommended: {wizardRecommendation.type}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">{wizardRecommendation.reason}</p>
                  <pre className="text-xs font-mono text-[var(--text-primary)] pt-1">{wizardRecommendation.example}</pre>
                </div>
                <button
                  type="button"
                  onClick={() => onRunInTheatre(wizardRecommendation.example)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] text-[var(--accent-primary-text)] text-xs font-semibold whitespace-nowrap shrink-0"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Try in Theatre</span>
                </button>
              </div>
            </div>

            {/* Real-World Scenario Challenges */}
            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold font-display">2. Real-World Type Chooser Practice</h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Scenario {scenarioIdx + 1} of {TYPE_CHOOSER_SCENARIOS.length} · Solved {solvedScenarios.length}/{TYPE_CHOOSER_SCENARIOS.length}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPickedType(null);
                      setScenarioIdx((i) => (i - 1 + TYPE_CHOOSER_SCENARIOS.length) % TYPE_CHOOSER_SCENARIOS.length);
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-[var(--border-hairline)] text-xs font-medium hover:bg-[var(--bg-elevated)]"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPickedType(null);
                      setScenarioIdx((i) => (i + 1) % TYPE_CHOOSER_SCENARIOS.length);
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-[var(--border-hairline)] text-xs font-medium hover:bg-[var(--bg-elevated)]"
                  >
                    Next
                  </button>
                </div>
              </div>

              <div className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-3.5 space-y-2">
                <div className="text-xs text-[var(--text-muted)]">{currentScenario.context}</div>
                <h3 className="text-base font-bold font-display">{currentScenario.title}</h3>
                <ul className="list-disc pl-5 text-xs text-[var(--text-secondary)] space-y-1">
                  {currentScenario.clues.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {currentScenario.options.map((opt) => {
                  const chosen = pickedType === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setPickedType(opt);
                        if (opt === currentScenario.correctType && !solvedScenarios.includes(currentScenario.id)) {
                          setSolvedScenarios((prev) => [...prev, currentScenario.id]);
                          onAwardXP?.(15);
                        }
                      }}
                      className={`min-h-[44px] px-3 py-2 rounded-lg border text-xs font-mono font-bold transition-colors ${
                        chosen
                          ? opt === currentScenario.correctType
                            ? 'bg-[var(--semantic-success-soft)] text-[var(--semantic-success-text)] border-[var(--semantic-success)]'
                            : 'bg-[var(--semantic-warning-soft)] text-[var(--semantic-warning-text)] border-[var(--semantic-warning)]'
                          : 'bg-[var(--bg-canvas)] border-[var(--border-hairline)] hover:bg-[var(--bg-elevated)]'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {pickedType && (
                <div
                  className={`rounded-lg p-3 text-xs space-y-2 ${
                    isScenarioCorrect
                      ? 'bg-[var(--semantic-success-soft)] text-[var(--semantic-success-text)]'
                      : 'bg-[var(--semantic-warning-soft)] text-[var(--semantic-warning-text)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold">
                      {isScenarioCorrect
                        ? `Spot on! ${currentScenario.correctType} fits best.`
                        : `Not quite yet — try checking which type satisfies both clues above.`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPickedType(null)}
                      className="inline-flex items-center gap-1 underline font-medium"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  </div>
                  {isScenarioCorrect && (
                    <>
                      <p>{currentScenario.explanation}</p>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <pre className="font-mono text-[11px] text-[var(--text-primary)]">{currentScenario.sampleCode}</pre>
                        <button
                          type="button"
                          onClick={() => onRunInTheatre(currentScenario.sampleCode)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] text-[var(--accent-primary-text)] font-semibold"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Run in Theatre</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
