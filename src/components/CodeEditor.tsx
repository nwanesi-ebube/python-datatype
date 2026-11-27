import React, { useEffect, useRef } from 'react';
import { EditorState, StateEffect, StateField } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  CompletionContext,
} from '@codemirror/autocomplete';
import {
  bracketMatching,
  defaultHighlightStyle,
  indentOnInput,
  syntaxHighlighting,
} from '@codemirror/language';
import { PYTHON_BUILTINS, PYTHON_KEYWORDS } from '../engine/pythonMeta';

interface CodeEditorProps {
  value: string;
  onChange: (next: string) => void;
  activeLine: number | null;
  onRunShortcut?: () => void;
  showMobileBar?: boolean;
}

const setExecLineEffect = StateEffect.define<number | null>();

const execLineField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setExecLineEffect)) {
        if (effect.value === null || effect.value < 1 || effect.value > tr.state.doc.lines) {
          return Decoration.none;
        }
        const line = tr.state.doc.line(effect.value);
        return Decoration.set([
          Decoration.line({ attributes: { class: 'cm-exec-line' } }).range(line.from),
        ]);
      }
    }
    return decorations.map(tr.changes);
  },
  provide: (f) => EditorView.decorations.from(f),
});

const METHOD_COMPLETIONS = [
  'upper()', 'lower()', 'title()', 'strip()', 'split()', 'join()', 'replace()',
  'startswith()', 'endswith()', 'find()', 'isdigit()', 'isalpha()',
  'append()', 'extend()', 'insert()', 'remove()', 'pop()', 'clear()', 'copy()', 'sort()', 'reverse()',
  'get()', 'keys()', 'values()', 'items()', 'update()', 'add()', 'discard()', 'union()', 'intersection()',
];

function pythonCompletions(context: CompletionContext) {
  const beforeDot = context.matchBefore(/\.\w*/);
  if (beforeDot) {
    return {
      from: beforeDot.from + 1,
      options: METHOD_COMPLETIONS.map((m) => ({ label: m, type: 'method' })),
    };
  }
  const word = context.matchBefore(/\w+/);
  if (!word || (word.from === word.to && !context.explicit)) return null;
  return {
    from: word.from,
    options: [
      ...PYTHON_BUILTINS.map((b) => ({
        label: b,
        type: 'function',
        detail: 'built-in',
      })),
      ...PYTHON_KEYWORDS.map((k) => ({
        label: k,
        type: 'keyword',
      })),
    ],
  };
}

const MOBILE_SYMBOLS = ['Tab', ':', '(', ')', '[', ']', '{', '}', '"', "'", '=', '_', '#', ',', '.'];

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  activeLine,
  onRunShortcut,
  showMobileBar = true,
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onRunShortcut);

  onChangeRef.current = onChange;
  onRunRef.current = onRunShortcut;

  useEffect(() => {
    if (!hostRef.current) return;

    const runKeymap = keymap.of([
      {
        key: 'Mod-Enter',
        run: () => {
          onRunRef.current?.();
          return true;
        },
      },
    ]);

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        python(),
        autocompletion({ override: [pythonCompletions] }),
        execLineField,
        runKeymap,
        keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        EditorView.contentAttributes.of({
          'aria-label': 'Python code editor',
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: hostRef.current,
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  // Sync external code changes (e.g., switching lessons or Reset)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  // Sync active execution line highlight
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: setExecLineEffect.of(activeLine),
    });
  }, [activeLine]);

  const insertSymbol = (sym: string) => {
    const view = viewRef.current;
    if (!view) return;
    const insertText = sym === 'Tab' ? '    ' : sym;
    const { from, to } = view.state.selection.main;
    view.dispatch({
      changes: { from, to, insert: insertText },
      selection: { anchor: from + insertText.length },
    });
    view.focus();
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-[var(--bg-surface)]">
      <div ref={hostRef} className="flex-1 min-h-0 overflow-hidden" />
      {showMobileBar && (
        <div
          className="md:hidden flex items-center gap-1 px-2 py-1.5 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] overflow-x-auto shrink-0"
          role="toolbar"
          aria-label="Python quick symbols"
        >
          {MOBILE_SYMBOLS.map((sym) => (
            <button
              key={sym}
              type="button"
              onClick={() => insertSymbol(sym)}
              className="min-w-[40px] min-h-[38px] px-2 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-primary)] font-mono-tabular text-xs font-semibold hover:bg-[var(--accent-soft)] active:scale-95 transition-transform shrink-0"
            >
              {sym}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
