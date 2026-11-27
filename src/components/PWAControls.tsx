import React, { useState } from 'react';
import { Download, Wifi, WifiOff, Cpu } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { EngineMode } from '../engine/pyodideBridge';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-primary-text)] hover:bg-[var(--accent-primary-hover)] transition-colors whitespace-nowrap shrink-0"
      >
        <Download className="w-3.5 h-3.5" />
        <span>{compact ? 'Install' : 'Install App'}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] p-5 shadow-xl space-y-3">
              <h3 className="text-base font-bold font-display text-[var(--text-primary)]">
                Install Python Data Types Lab
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                1. Tap the <strong>Share</strong> button in your Safari toolbar.<br />
                2. Scroll down and tap <strong>Add to Home Screen</strong> so you can practise offline anytime.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-lg bg-[var(--accent-primary)] py-2 text-xs font-semibold text-[var(--accent-primary-text)]"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

interface EngineStatusTextProps {
  engineMode: EngineMode;
  onEnablePyodide: () => void;
}

export const EngineStatusControl: React.FC<EngineStatusTextProps> = ({
  engineMode,
  onEnablePyodide,
}) => {
  const isOnline = useOnlineStatus();

  const statusText =
    engineMode === 'pyodide-ready'
      ? 'Full Python ready'
      : engineMode === 'loading-pyodide'
      ? 'Loading Full Python…'
      : isOnline
      ? 'Online'
      : 'Offline';

  return (
    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] whitespace-nowrap shrink-0">
      <span className="inline-flex items-center gap-1 font-medium text-[var(--text-secondary)]">
        {isOnline ? (
          <Wifi className="w-3.5 h-3.5 text-[var(--semantic-success)]" aria-hidden="true" />
        ) : (
          <WifiOff className="w-3.5 h-3.5 text-[var(--semantic-warning)]" aria-hidden="true" />
        )}
        <span>{statusText}</span>
      </span>

      {isOnline && engineMode === 'builtin' && (
        <button
          type="button"
          onClick={onEnablePyodide}
          title="Download Full Python (Pyodide) for offline WebAssembly execution"
          className="hidden lg:inline-flex items-center gap-1 text-[11px] font-medium text-[var(--accent-soft-text)] hover:underline whitespace-nowrap"
        >
          <Cpu className="w-3 h-3" />
          <span>Load Full Python</span>
        </button>
      )}
    </div>
  );
};

export const OfflineToast: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-16 md:bottom-4 left-4 z-40 flex items-center gap-2 rounded-lg border border-[var(--semantic-warning)] bg-[var(--semantic-warning-soft)] px-3 py-1.5 text-xs font-medium text-[var(--semantic-warning-text)] shadow-md"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Offline mode — built-in Python engine and cached lessons are active.</span>
    </div>
  );
};
