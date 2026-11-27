import React, { useMemo, useState } from 'react';
import { Eye, Play, Plus, Trash2 } from 'lucide-react';

interface PrintStudioViewProps {
  onRunInTheatre: (code: string) => void;
}

interface StudioArg {
  id: string;
  raw: string;
}

const ARG_PALETTE = [
  { bg: 'bg-sky-500/20', border: 'border-sky-500/60', text: 'text-sky-700 dark:text-sky-200', label: 'Arg 1' },
  { bg: 'bg-emerald-500/20', border: 'border-emerald-500/60', text: 'text-emerald-700 dark:text-emerald-200', label: 'Arg 2' },
  { bg: 'bg-amber-500/20', border: 'border-amber-500/60', text: 'text-amber-800 dark:text-amber-200', label: 'Arg 3' },
  { bg: 'bg-indigo-500/20', border: 'border-indigo-500/60', text: 'text-indigo-700 dark:text-indigo-200', label: 'Arg 4' },
];

function decodeEscapes(s: string): string {
  return s.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '\r');
}

function evaluateSimpleArg(raw: string): { display: string; pyType: string } {
  const t = raw.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return { display: decodeEscapes(t.slice(1, -1)), pyType: 'str' };
  }
  if (t === 'True' || t === 'False') return { display: t, pyType: 'bool' };
  if (t === 'None') return { display: 'None', pyType: 'NoneType' };
  if (/^[+-]?\d+$/.test(t)) return { display: t, pyType: 'int' };
  if (/^[+-]?\d+\.\d+$/.test(t)) return { display: t, pyType: 'float' };
  if (t.startsWith('[') && t.endsWith(']')) return { display: t, pyType: 'list' };
  return { display: t, pyType: 'expr' };
}

export const PrintStudioView: React.FC<PrintStudioViewProps> = ({ onRunInTheatre }) => {
  const [args, setArgs] = useState<StudioArg[]>([
    { id: 'a1', raw: '"Meat Pie"' },
    { id: 'a2', raw: '500' },
    { id: 'a3', raw: '"Available"' },
  ]);
  const [sep, setSep] = useState(' | ');
  const [end, setEnd] = useState('\\n');
  const [stream, setStream] = useState<'sys.stdout' | 'sys.stderr'>('sys.stdout');
  const [flush, setFlush] = useState(false);
  const [showMarkers, setShowMarkers] = useState(true);

  const evaluated = useMemo(
    () => args.map((a, idx) => ({ ...a, ...evaluateSimpleArg(a.raw), idx })),
    [args]
  );

  const decodedSep = decodeEscapes(sep);
  const decodedEnd = decodeEscapes(end);

  const formatVisible = (text: string) => {
    if (!showMarkers) return text;
    return text.replace(/ /g, '·').replace(/\t/g, '→').replace(/\n/g, '↵\n');
  };

  const generatedCode = useMemo(() => {
    const argList = args.map((a) => a.raw.trim() || '""').join(', ');
    const kwargs: string[] = [];
    if (sep !== ' ') kwargs.push(`sep=${JSON.stringify(decodeEscapes(sep))}`);
    if (end !== '\\n') kwargs.push(`end=${JSON.stringify(decodeEscapes(end))}`);
    if (stream === 'sys.stderr') kwargs.push('file=sys.stderr');
    if (flush) kwargs.push('flush=True');
    const allParts = [argList, ...kwargs].filter(Boolean).join(', ');
    const prefix = stream === 'sys.stderr' ? 'import sys\n' : '';
    return `${prefix}print(${allParts})`;
  }, [args, sep, end, stream, flush]);

  const addArg = () => {
    if (args.length >= 6) return;
    setArgs((prev) => [...prev, { id: `a${Date.now()}`, raw: '"Item"' }]);
  };

  const updateArg = (id: string, val: string) => {
    setArgs((prev) => prev.map((a) => (a.id === id ? { ...a, raw: val } : a)));
  };

  const removeArg = (id: string) => {
    if (args.length <= 1) return;
    setArgs((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="h-full min-h-0 panel-scroll p-4 sm:p-5 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-[var(--text-primary)]">
            Interactive print() Studio
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Experiment with arguments, <code className="font-mono-tabular">sep</code>,{' '}
            <code className="font-mono-tabular">end</code>, <code className="font-mono-tabular">file</code>, and{' '}
            <code className="font-mono-tabular">flush</code> and see how each piece builds the final text.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onRunInTheatre(generatedCode)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-[var(--accent-primary-text)] text-xs font-semibold hover:bg-[var(--accent-primary-hover)] whitespace-nowrap"
        >
          <Play className="w-3.5 h-3.5" />
          Run in Theatre
        </button>
      </div>

      {/* Arguments Builder */}
      <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--text-secondary)]">
            1. Objects passed to print(*objects)
          </span>
          <button
            type="button"
            onClick={addArg}
            disabled={args.length >= 6}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-xs font-semibold disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Argument
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {evaluated.map((arg, idx) => {
            const pal = ARG_PALETTE[idx % ARG_PALETTE.length];
            return (
              <div key={arg.id} className={`rounded-lg border p-2.5 space-y-1.5 ${pal.bg} ${pal.border}`}>
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className={pal.text}>Argument {idx + 1} · {arg.pyType}</span>
                  {args.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArg(arg.id)}
                      aria-label={`Remove argument ${idx + 1}`}
                      className="text-[var(--text-muted)] hover:text-[var(--semantic-error)]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={arg.raw}
                  onChange={(e) => updateArg(arg.id, e.target.value)}
                  aria-label={`Argument ${idx + 1} expression`}
                  className="w-full px-2.5 py-1.5 rounded bg-[var(--bg-surface)] border border-[var(--border-hairline)] font-mono-tabular text-xs font-semibold text-[var(--text-primary)]"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* sep, end, file, flush controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <label htmlFor="studio-sep" className="text-xs font-bold text-[var(--text-secondary)]">
              2. Separator (sep) — placed BETWEEN arguments
            </label>
          </div>
          <input
            id="studio-sep"
            type="text"
            value={sep}
            onChange={(e) => setSep(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] font-mono-tabular text-sm"
          />
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: 'Space (" ")', val: ' ' },
              { label: 'Empty ("")', val: '' },
              { label: 'Dash ("-")', val: '-' },
              { label: 'Pipe (" | ")', val: ' | ' },
              { label: 'Newline ("\\n")', val: '\\n' },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setSep(p.val)}
                className={`px-2 py-1 rounded text-[11px] font-mono-tabular border ${
                  sep === p.val
                    ? 'bg-[var(--accent-soft)] border-[var(--accent-primary)] text-[var(--accent-soft-text)] font-bold'
                    : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-2.5">
          <label htmlFor="studio-end" className="text-xs font-bold text-[var(--text-secondary)]">
            3. Ending (end) — placed AFTER the last argument
          </label>
          <input
            id="studio-end"
            type="text"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] font-mono-tabular text-sm"
          />
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: 'Newline ("\\n")', val: '\\n' },
              { label: 'Empty ("")', val: '' },
              { label: 'Space (" ")', val: ' ' },
              { label: 'Exclaim ("!!\\n")', val: '!!\\n' },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setEnd(p.val)}
                className={`px-2 py-1 rounded text-[11px] font-mono-tabular border ${
                  end === p.val
                    ? 'bg-[var(--accent-soft)] border-[var(--accent-primary)] text-[var(--accent-soft-text)] font-bold'
                    : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* file & flush */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-[var(--text-secondary)]">4. Output Stream (file)</div>
            <div className="text-[11px] text-[var(--text-muted)]">
              Normal output goes to stdout; warnings go to stderr.
            </div>
          </div>
          <div className="flex gap-1 p-1 rounded-lg bg-[var(--bg-elevated)]">
            {(['sys.stdout', 'sys.stderr'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStream(s)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-mono-tabular font-semibold ${
                  stream === s
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)]'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <label className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 flex items-center justify-between gap-3 cursor-pointer">
          <div>
            <div className="text-xs font-bold text-[var(--text-secondary)]">5. Immediate Flush (flush=True)</div>
            <div className="text-[11px] text-[var(--text-muted)]">
              Pushes text onto the screen immediately without buffering (great for loading animations).
            </div>
          </div>
          <input
            type="checkbox"
            checked={flush}
            onChange={(e) => setFlush(e.target.checked)}
            className="w-5 h-5 accent-[var(--accent-primary)]"
          />
        </label>
      </div>

      {/* Colour-Coded Output Preview + Generated Python Code */}
      <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-bold text-[var(--text-secondary)]">
            Colour-Coded Output Breakdown ({stream})
          </div>
          <button
            type="button"
            onClick={() => setShowMarkers((m) => !m)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-xs font-medium"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showMarkers ? 'Hide' : 'Show'} Space/Newline Markers</span>
          </button>
        </div>

        <div className="rounded-xl bg-[var(--console-bg)] text-[var(--console-text)] p-4 font-mono-tabular text-sm leading-relaxed flex flex-wrap items-center gap-0.5">
          {evaluated.map((arg, idx) => {
            const pal = ARG_PALETTE[idx % ARG_PALETTE.length];
            return (
              <React.Fragment key={arg.id}>
                <span
                  title={`From Argument ${idx + 1}`}
                  className={`px-1.5 py-0.5 rounded border ${pal.border} bg-white/10 text-white`}
                >
                  {formatVisible(arg.display)}
                </span>
                {idx < evaluated.length - 1 && decodedSep.length > 0 && (
                  <span
                    title="Separator (sep)"
                    className="px-1 py-0.5 rounded bg-rose-500/30 border border-rose-400/50 text-rose-200"
                  >
                    {formatVisible(decodedSep)}
                  </span>
                )}
              </React.Fragment>
            );
          })}
          {decodedEnd.length > 0 && (
            <span
              title="Ending (end)"
              className="px-1 py-0.5 rounded bg-teal-500/30 border border-teal-400/50 text-teal-200"
            >
              {formatVisible(decodedEnd)}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--text-muted)]">
          <span>Legend:</span>
          <span>[White border] = Arguments converted via str()</span>
          <span aria-hidden="true">·</span>
          <span className="text-rose-600 dark:text-rose-300 font-semibold">[Rose] = sep</span>
          <span aria-hidden="true">·</span>
          <span className="text-teal-600 dark:text-teal-300 font-semibold">[Teal] = end</span>
        </div>

        <pre className="p-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] font-mono-tabular text-xs overflow-x-auto m-0">
          {generatedCode}
        </pre>
      </div>
    </div>
  );
};
