import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, Eye, Terminal, Trash2 } from 'lucide-react';
import { FriendlyError } from '../types/lab';

interface ConsolePanelProps {
  output: string;
  stderr?: string;
  error: FriendlyError | null;
  pendingInputPrompt: string | null;
  onSubmitInput: (value: string) => void;
  onClear: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  height: number;
  onResizeHeight: (next: number) => void;
  isPhone?: boolean;
}

export const ConsolePanel: React.FC<ConsolePanelProps> = ({
  output,
  stderr,
  error,
  pendingInputPrompt,
  onSubmitInput,
  onClear,
  isOpen,
  onToggleOpen,
  height,
  onResizeHeight,
  isPhone = false,
}) => {
  const [showMarkers, setShowMarkers] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (pendingInputPrompt !== null) {
      inputRef.current?.focus();
    }
  }, [pendingInputPrompt]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const next = window.innerHeight - e.clientY;
      onResizeHeight(Math.max(110, Math.min(420, next)));
    };
    const handleUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [onResizeHeight]);

  const formatVisibleText = (raw: string) => {
    if (!showMarkers) return raw;
    return raw.replace(/ /g, '·').replace(/\t/g, '→   ').replace(/\n/g, '↵\n');
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = inputValue;
      setInputValue('');
      onSubmitInput(val);
    }
  };

  return (
    <section
      aria-label="Console output"
      className="no-print flex flex-col border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] shrink-0"
      style={isPhone ? { height: '100%' } : { height: isOpen ? `${height}px` : '38px' }}
    >
      {/* Drag Resize Handle (Desktop/Tablet when open) */}
      {!isPhone && isOpen && (
        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize console panel"
          onMouseDown={() => {
            draggingRef.current = true;
          }}
          className="h-1.5 w-full cursor-row-resize hover:bg-[var(--accent-primary)] transition-colors bg-transparent"
        />
      )}

      {/* Console Toolbar */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Terminal className="w-4 h-4 text-[var(--accent-primary)] shrink-0" aria-hidden="true" />
          <span className="text-xs font-semibold text-[var(--text-primary)] whitespace-nowrap">
            Console Output
          </span>
          {pendingInputPrompt !== null && (
            <span className="text-xs font-medium text-[var(--semantic-warning-text)] bg-[var(--semantic-warning-soft)] px-2 py-0.5 rounded whitespace-nowrap">
              Waiting for your input
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowMarkers((s) => !s)}
            aria-pressed={showMarkers}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              showMarkers
                ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)]'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-hairline)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Spaces &amp; ↵</span>
          </button>

          <button
            type="button"
            onClick={onClear}
            aria-label="Clear console"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-hairline)] hover:text-[var(--text-primary)]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>

          {!isPhone && (
            <button
              type="button"
              onClick={onToggleOpen}
              aria-label={isOpen ? 'Collapse console' : 'Expand console'}
              className="p-1 rounded-md hover:bg-[var(--bg-inset)] text-[var(--text-secondary)]"
            >
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Console Body */}
      {(isOpen || isPhone) && (
        <div className="flex-1 min-h-0 panel-scroll bg-[var(--console-bg)] text-[var(--console-text)] p-3 font-mono-tabular text-xs sm:text-sm space-y-2.5">
          {!output && !stderr && !error && pendingInputPrompt === null && (
            <div className="text-[var(--console-muted)] text-xs">
              Output from print() and input() will appear here.
            </div>
          )}

          {output && (
            <pre className="whitespace-pre-wrap break-words leading-relaxed m-0">
              {formatVisibleText(output)}
            </pre>
          )}

          {stderr && (
            <pre className="whitespace-pre-wrap break-words text-amber-300 leading-relaxed m-0">
              [stderr] {formatVisibleText(stderr)}
            </pre>
          )}

          {/* Interactive input() prompt */}
          {pendingInputPrompt !== null && (
            <div className="flex items-center gap-2 pt-1 border-t border-white/10">
              <span className="text-emerald-300 font-semibold shrink-0">&gt;</span>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Type your response and press Enter..."
                aria-label="Program input prompt"
                className="flex-1 bg-white/10 text-white placeholder:text-slate-400 px-2.5 py-1.5 rounded border border-sky-400/60 focus:outline-none focus:border-sky-300 font-mono-tabular text-xs sm:text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  const val = inputValue;
                  setInputValue('');
                  onSubmitInput(val);
                }}
                className="px-3 py-1.5 rounded bg-sky-500 text-white text-xs font-sans font-semibold hover:bg-sky-400 shrink-0"
              >
                Enter
              </button>
            </div>
          )}

          {/* Friendly Error Explanation Card */}
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-rose-400/40 bg-rose-950/60 p-3 font-sans text-rose-100 space-y-1.5"
            >
              <div className="flex items-center gap-2 font-semibold text-sm text-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error.friendlyTitle}</span>
              </div>
              <p className="text-xs text-rose-100/90 leading-relaxed">
                {error.friendlyReason}
              </p>
              <div className="text-xs font-mono-tabular text-rose-300 bg-black/30 px-2 py-1 rounded">
                Python message: {error.errorType}: {error.message} (line {error.line})
              </div>
              <p className="text-xs text-amber-200">
                Tip: {error.hint}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
