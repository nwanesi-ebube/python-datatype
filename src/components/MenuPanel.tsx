import React, { useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Bug,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  Copy,
  Download,
  Eye,
  FileText,
  FlaskConical,
  FolderGit2,
  Gamepad2,
  Layers,
  Lock,
  Printer,
  Search,
  SearchCheck,
  ShieldCheck,
  Trophy,
  Upload,
  Wrench,
  X,
} from 'lucide-react';
import { MODULES } from '../data/curriculum';
import { LAB_BADGES } from '../data/stage8';
import { UserProgress } from '../types/lab';
import { exportProgressJSON, parseImportedProgress } from '../utils/storage';
import { MiniGameId } from './GamesHubView';
import { TypeLabTab } from './TypeLabsView';

export type ActiveRoute =
  | { view: 'lesson'; lessonId: string }
  | { view: 'name-checker' }
  | { view: 'do-dont' }
  | { view: 'name-police' }
  | { view: 'print-studio' }
  | { view: 'method-explorer' }
  | { view: 'print-perfect' }
  | { view: 'input-detective' }
  | { view: 'type-labs'; tab?: TypeLabTab }
  | { view: 'games-hub'; game?: MiniGameId }
  | { view: 'capstones' }
  | { view: 'trophies' }
  | { view: 'exercises'; moduleId?: string }
  | { view: 'teach'; moduleId?: string };

interface MenuPanelProps {
  route: ActiveRoute;
  onNavigate: (next: ActiveRoute) => void;
  progress: UserProgress;
  onImportProgress: (next: UserProgress) => void;
  onClose?: () => void;
}

export const MenuPanel: React.FC<MenuPanelProps> = ({
  route,
  onNavigate,
  progress,
  onImportProgress,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  const readyModules = MODULES.filter((m) => m.stageReady);
  const upcomingModules = MODULES.filter((m) => !m.stageReady);
  const totalReadyLessons = readyModules.reduce((acc, m) => acc + m.lessons.length, 0);
  const exploredCount = progress.completedLessons.filter((id) =>
    readyModules.some((m) => m.lessons.some((l) => l.id === id))
  ).length;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const parsed = await parseImportedProgress(file);
    if (parsed) {
      onImportProgress(parsed);
      setImportNotice('Progress imported successfully.');
    } else {
      setImportNotice('Not quite yet — please choose a valid Python Lab JSON export.');
    }
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-[var(--bg-surface)] text-[var(--text-primary)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] shrink-0">
        <div>
          <h2 className="text-sm font-semibold font-display">Curriculum &amp; Tools</h2>
          <p className="text-xs text-[var(--text-muted)]">
            {progress.xp} XP · {progress.streakDays} day streak
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-[var(--bg-inset)] text-[var(--text-secondary)]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Scrollable Navigation */}
      <div className="flex-1 min-h-0 panel-scroll p-3 space-y-4">
        {/* Growth Summary */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span>Overall Progress</span>
            <span className="font-mono-tabular text-[var(--accent-primary)]">
              {exploredCount}/{totalReadyLessons}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[var(--bg-inset)] overflow-hidden">
            <div
              className="h-full bg-[var(--accent-primary)] transition-all"
              style={{ width: `${(exploredCount / Math.max(1, totalReadyLessons)) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">
            You&apos;ve explored {exploredCount} of {totalReadyLessons} unlocked lessons.
          </p>
        </div>

        {/* Stage-ready Modules */}
        {readyModules.map((mod) => (
          <div key={mod.id} className="space-y-1.5">
            <div className="px-1 text-xs font-bold text-[var(--text-secondary)]">
              {mod.code} · {mod.title}
            </div>
            {mod.lessons.map((lesson) => {
              const active = route.view === 'lesson' && route.lessonId === lesson.id;
              const done = progress.completedLessons.includes(lesson.id);
              return (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => onNavigate({ view: 'lesson', lessonId: lesson.id })}
                  className={`w-full min-h-[42px] flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                    active
                      ? 'bg-[var(--accent-soft)] text-[var(--accent-soft-text)] font-semibold border border-[var(--accent-primary)]/40'
                      : 'hover:bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <BookOpen className="w-3.5 h-3.5 shrink-0 opacity-80" />
                    <span className="truncate">
                      {lesson.number}. {lesson.title}
                    </span>
                  </div>
                  {done && (
                    <CheckCircle2 className="w-4 h-4 text-[var(--semantic-success)] shrink-0" aria-label="Completed" />
                  )}
                </button>
              );
            })}
          </div>
        ))}

        {/* Interactive Labs & Mini-Games */}
        <div className="space-y-1.5">
          <div className="px-1 text-xs font-bold text-[var(--text-secondary)]">
            Interactive Labs &amp; Games
          </div>
          <button
            type="button"
            onClick={() => onNavigate({ view: 'name-checker' })}
            className={`w-full min-h-[42px] flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs transition-colors ${
              route.view === 'name-checker'
                ? 'bg-[var(--accent-soft)] text-[var(--accent-soft-text)] font-semibold border border-[var(--accent-primary)]/40'
                : 'hover:bg-[var(--bg-elevated)] text-[var(--text-primary)]'
            }`}
          >
            <SearchCheck className="w-4 h-4 shrink-0" />
            <span>Variable Name Checker</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate({ view: 'do-dont' })}
            className={`w-full min-h-[42px] flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs transition-colors ${
              route.view === 'do-dont'
                ? 'bg-[var(--accent-soft)] text-[var(--accent-soft-text)] font-semibold border border-[var(--accent-primary)]/40'
                : 'hover:bg-[var(--bg-elevated)] text-[var(--text-primary)]'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Do &amp; Don&apos;t Board</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate({ view: 'print-studio' })}
            className={`w-full min-h-[42px] flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs transition-colors ${
              route.view === 'print-studio'
                ? 'bg-[var(--accent-soft)] text-[var(--accent-soft-text)] font-semibold border border-[var(--accent-primary)]/40'
                : 'hover:bg-[var(--bg-elevated)] text-[var(--text-primary)]'
            }`}
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>print() Studio</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate({ view: 'method-explorer' })}
            className={`w-full min-h-[42px] flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs transition-colors ${
              route.view === 'method-explorer'
                ? 'bg-[var(--accent-soft)] text-[var(--accent-soft-text)] font-semibold border border-[var(--accent-primary)]/40'
                : 'hover:bg-[var(--bg-elevated)] text-[var(--text-primary)]'
            }`}
          >
            <FlaskConical className="w-4 h-4 shrink-0" />
            <span>Method &amp; Type Explorer</span>
          </button>

          {(
            [
              { tab: 'conversion-matrix', label: 'Conversion Matrix', icon: ArrowRight },
              { tab: 'operation-lab', label: 'Operation Lab', icon: Calculator },
              { tab: 'mutability-lab', label: 'Mutability Lab', icon: Copy },
              { tab: 'type-chooser', label: 'Type Chooser', icon: Compass },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = route.view === 'type-labs' && (route.tab ?? 'conversion-matrix') === item.tab;
            return (
              <button
                key={item.tab}
                type="button"
                onClick={() => onNavigate({ view: 'type-labs', tab: item.tab })}
                className={`w-full min-h-[42px] flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                  active
                    ? 'bg-[var(--accent-soft)] text-[var(--accent-soft-text)] font-semibold border border-[var(--accent-primary)]/40'
                    : 'hover:bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => onNavigate({ view: 'name-police' })}
            className={`w-full min-h-[42px] flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-xs transition-colors ${
              route.view === 'name-police'
                ? 'bg-[var(--accent-soft)] text-[var(--accent-soft-text)] font-semibold border border-[var(--accent-primary)]/40'
                : 'hover:bg-[var(--bg-elevated)] text-[var(--text-primary)]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 shrink-0" />
              <span>Game: Name Police</span>
            </span>
            {progress.gameHighScores['name-police'] ? (
              <span className="font-mono-tabular text-[11px] text-[var(--text-muted)]">
                {progress.gameHighScores['name-police']}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => onNavigate({ view: 'print-perfect' })}
            className={`w-full min-h-[42px] flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-xs transition-colors ${
              route.view === 'print-perfect'
                ? 'bg-[var(--accent-soft)] text-[var(--accent-soft-text)] font-semibold border border-[var(--accent-primary)]/40'
                : 'hover:bg-[var(--bg-elevated)] text-[var(--text-primary)]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 shrink-0" />
              <span>Game: Print Perfect</span>
            </span>
            {progress.gameHighScores['print-perfect'] ? (
              <span className="font-mono-tabular text-[11px] text-[var(--text-muted)]">
                {progress.gameHighScores['print-perfect']}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => onNavigate({ view: 'input-detective' })}
            className={`w-full min-h-[42px] flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-xs transition-colors ${
              route.view === 'input-detective'
                ? 'bg-[var(--accent-soft)] text-[var(--accent-soft-text)] font-semibold border border-[var(--accent-primary)]/40'
                : 'hover:bg-[var(--bg-elevated)] text-[var(--text-primary)]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Search className="w-4 h-4 shrink-0" />
              <span>Game: Input Detective</span>
            </span>
            {progress.gameHighScores['input-detective'] ? (
              <span className="font-mono-tabular text-[11px] text-[var(--text-muted)]">
                {progress.gameHighScores['input-detective']}
              </span>
            ) : null}
          </button>

          {(
            [
              { game: 'type-sorter', label: 'Game: Type Sorter', icon: Layers },
              { game: 'method-match', label: 'Game: Method Match', icon: Wrench },
              { game: 'predict-duel', label: 'Game: Predict Duel', icon: Eye },
              { game: 'bug-hunter', label: 'Game: Bug Hunter', icon: Bug },
            ] as const
          ).map((g) => {
            const Icon = g.icon;
            const active = route.view === 'games-hub' && (route.game ?? 'type-sorter') === g.game;
            const best = progress.gameHighScores[g.game] ?? 0;
            return (
              <button
                key={g.game}
                type="button"
                onClick={() => onNavigate({ view: 'games-hub', game: g.game })}
                className={`w-full min-h-[42px] flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                  active
                    ? 'bg-[var(--accent-soft)] text-[var(--accent-soft-text)] font-semibold border border-[var(--accent-primary)]/40'
                    : 'hover:bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{g.label}</span>
                </span>
                {best > 0 && (
                  <span className="font-mono-tabular text-[11px] text-[var(--text-muted)]">{best}</span>
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => onNavigate({ view: 'capstones' })}
            className={`w-full min-h-[42px] flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs transition-colors ${
              route.view === 'capstones'
                ? 'bg-[var(--accent-soft)] text-[var(--accent-soft-text)] font-semibold border border-[var(--accent-primary)]/40'
                : 'hover:bg-[var(--bg-elevated)] text-[var(--text-primary)]'
            }`}
          >
            <FolderGit2 className="w-4 h-4 shrink-0" />
            <span>Capstone Projects</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate({ view: 'trophies' })}
            className={`w-full min-h-[42px] flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-xs transition-colors ${
              route.view === 'trophies'
                ? 'bg-[var(--accent-soft)] text-[var(--accent-soft-text)] font-semibold border border-[var(--accent-primary)]/40'
                : 'hover:bg-[var(--bg-elevated)] text-[var(--text-primary)]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Trophy className="w-4 h-4 shrink-0" />
              <span>Badges &amp; Scores</span>
            </span>
            <span className="font-mono-tabular text-[11px] text-[var(--text-muted)]">
              {progress.badges.length}/{LAB_BADGES.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate({ view: 'exercises' })}
            className={`w-full min-h-[42px] flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-xs transition-colors ${
              route.view === 'exercises'
                ? 'bg-[var(--accent-soft)] text-[var(--accent-soft-text)] font-semibold border border-[var(--accent-primary)]/40'
                : 'hover:bg-[var(--bg-elevated)] text-[var(--text-primary)]'
            }`}
          >
            <span className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 shrink-0" />
              <span>Practice &amp; Exam Bank</span>
            </span>
            <span className="font-mono-tabular text-[11px] text-[var(--text-muted)]">248</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate({ view: 'teach' })}
            className={`w-full min-h-[42px] flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs transition-colors ${
              route.view === 'teach'
                ? 'bg-[var(--accent-soft)] text-[var(--accent-soft-text)] font-semibold border border-[var(--accent-primary)]/40'
                : 'hover:bg-[var(--bg-elevated)] text-[var(--text-primary)]'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Teaching &amp; Summaries</span>
          </button>
        </div>

        {/* Upcoming Curriculum Roadmap */}
        {upcomingModules.length > 0 && (
          <div className="space-y-1.5">
            <div className="px-1 text-xs font-bold text-[var(--text-muted)]">
              Upcoming Stages
            </div>
            {upcomingModules.map((mod) => (
              <div
                key={mod.id}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] opacity-80"
              >
                <span className="truncate">{mod.code}: {mod.title}</span>
                <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer: Export / Import Progress */}
      <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] space-y-2 shrink-0">
        {importNotice && (
          <p className="text-[11px] text-[var(--text-secondary)]">{importNotice}</p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => exportProgressJSON(progress)}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs font-medium hover:bg-[var(--bg-canvas)]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs font-medium hover:bg-[var(--bg-canvas)]"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};
