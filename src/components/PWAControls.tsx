import React, { useState } from 'react';
import { Cpu, Download, RefreshCw, Wifi, WifiOff, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { EngineMode } from '../engine/pyodideBridge';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { isTauriDesktop } from '../utils/desktop';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isTauriDesktop() || isInstalled) return null;

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

      {!isTauriDesktop() && isOnline && engineMode === 'builtin' && (
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
      className="no-print fixed bottom-16 md:bottom-4 left-4 z-40 flex items-center gap-2 rounded-lg border border-[var(--semantic-warning)] bg-[var(--semantic-warning-soft)] px-3 py-1.5 text-xs font-medium text-[var(--semantic-warning-text)] shadow-md"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Offline mode — built-in Python engine and cached lessons are active.</span>
    </div>
  );
};

export const PWAUpdatePrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      className="no-print fixed bottom-16 md:bottom-4 right-4 z-50 flex items-center gap-2.5 rounded-xl border border-[var(--accent-primary)] bg-[var(--bg-surface)] px-3.5 py-2 text-xs text-[var(--text-primary)] shadow-lg"
    >
      <RefreshCw className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" aria-hidden="true" />
      <span className="font-medium">New version ready</span>
      <button
        type="button"
        onClick={() => updateServiceWorker(true)}
        className="rounded-md bg-[var(--accent-primary)] px-2.5 py-1 font-semibold text-[var(--accent-primary-text)] hover:bg-[var(--accent-primary-hover)] transition-colors"
      >
        Reload
      </button>
      <button
        type="button"
        onClick={() => setNeedRefresh(false)}
        aria-label="Dismiss update notice"
        className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
