import React from 'react';
import { Volume2, VolumeX, X } from 'lucide-react';
import { AppearanceSettings, LayoutDensity, TextSize, ThemeId } from '../types/lab';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppearanceSettings;
  onUpdate: (patch: Partial<AppearanceSettings>) => void;
}

const THEMES: Array<{ id: ThemeId; label: string; swatch: string; desc: string }> = [
  { id: 'light', label: 'Light Paper', swatch: '#F8FAFC', desc: 'Crisp studio light' },
  { id: 'dark', label: 'Dark Lab', swatch: '#0B1120', desc: 'Deep slate night mode' },
  { id: 'high-contrast', label: 'High Contrast', swatch: '#000000', desc: 'Maximum legibility' },
  { id: 'ocean', label: 'Ocean', swatch: '#EFF6FA', desc: 'Blue & orange safe' },
  { id: 'forest', label: 'Forest', swatch: '#F3F7F4', desc: 'Botanical pine' },
  { id: 'sunset', label: 'Sunset', swatch: '#FAF6F3', desc: 'Warm dusk & indigo' },
];

const TEXT_SIZES: TextSize[] = ['S', 'M', 'L', 'XL'];
const SPEEDS = [0.5, 1, 1.5, 2, 3];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdate,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div className="w-full max-w-lg max-h-[88dvh] flex flex-col rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
          <div>
            <h2 id="settings-title" className="text-base font-bold font-display">
              Appearance &amp; Accessibility Settings
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Changes apply immediately and save automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-[var(--bg-inset)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 panel-scroll p-5 space-y-5">
          {/* Colour Schemes */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-[var(--text-secondary)]">
              Colour Scheme (colour-blind friendly)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {THEMES.map((t) => {
                const active = settings.theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onUpdate({ theme: t.id })}
                    className={`p-2.5 rounded-xl border text-left transition-colors ${
                      active
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)]'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] hover:border-[var(--accent-primary)]/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full border border-slate-400/60 shrink-0"
                        style={{ backgroundColor: t.swatch }}
                        aria-hidden="true"
                      />
                      <span className="text-xs font-semibold truncate">{t.label}</span>
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-1 truncate">{t.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Text Size & Layout Density */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[var(--text-secondary)]">Text Size</div>
              <div className="grid grid-cols-4 gap-1.5 p-1 rounded-lg bg-[var(--bg-elevated)]">
                {TEXT_SIZES.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => onUpdate({ textSize: sz })}
                    className={`py-2 rounded-md text-xs font-bold transition-colors ${
                      settings.textSize === sz
                        ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-[var(--text-secondary)]">Layout Density</div>
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-[var(--bg-elevated)]">
                {(['compact', 'comfortable'] as LayoutDensity[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => onUpdate({ density: d })}
                    className={`py-2 rounded-md text-xs font-semibold capitalize transition-colors ${
                      settings.density === d
                        ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Animation Speed */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--text-secondary)]">Playback &amp; Animation Speed</span>
              <span className="font-mono-tabular font-bold text-[var(--accent-primary)]">{settings.speed}x</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 p-1 rounded-lg bg-[var(--bg-elevated)]">
              {SPEEDS.map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => onUpdate({ speed: sp })}
                  className={`py-2 rounded-md text-xs font-mono-tabular font-semibold transition-colors ${
                    settings.speed === sp
                      ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {sp}x
                </button>
              ))}
            </div>
          </div>

          {/* Toggles: Reduce Motion & Read Aloud */}
          <div className="space-y-2.5">
            <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] cursor-pointer">
              <div>
                <div className="text-xs font-semibold">Reduce Motion</div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  Turns off sliding transitions for calm, static updates.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.reduceMotion}
                onChange={(e) => onUpdate({ reduceMotion: e.target.checked })}
                className="w-5 h-5 accent-[var(--accent-primary)]"
              />
            </label>

            <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] cursor-pointer">
              <div className="flex items-center gap-2.5">
                {settings.readAloud ? (
                  <Volume2 className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
                ) : (
                  <VolumeX className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                )}
                <div>
                  <div className="text-xs font-semibold">Read-Aloud Narration</div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    Speaks each plain-English step explanation aloud.
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.readAloud}
                onChange={(e) => onUpdate({ readAloud: e.target.checked })}
                className="w-5 h-5 accent-[var(--accent-primary)]"
              />
            </label>

            <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] cursor-pointer">
              <div>
                <div className="text-xs font-semibold">Teaching Mode (Classroom &amp; Projector)</div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  Enlarges code &amp; stage text and unlocks teacher answer keys in Exercises.
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(settings.teachingMode)}
                onChange={(e) => onUpdate({ teachingMode: e.target.checked })}
                className="w-5 h-5 accent-[var(--accent-primary)]"
              />
            </label>
          </div>

          {/* Keyboard Shortcuts Reference */}
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3.5 space-y-2">
            <div className="text-xs font-semibold">Keyboard Shortcuts</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-[var(--text-secondary)]">
              <span><kbd className="font-mono-tabular font-semibold">Ctrl/Cmd + Enter</kbd> Run code</span>
              <span><kbd className="font-mono-tabular font-semibold">Space</kbd> Play / Pause</span>
              <span><kbd className="font-mono-tabular font-semibold">← / →</kbd> Step back / forward</span>
              <span><kbd className="font-mono-tabular font-semibold">Ctrl + B / I / J</kbd> Panels</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
