import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Code2,
  Cpu,
  EyeOff,
  Maximize2,
  Minimize2,
  PanelBottom,
  PanelLeft,
  PanelRight,
  Settings,
  Terminal,
  Menu as MenuIcon,
} from 'lucide-react';
import { ConsolePanel } from './components/ConsolePanel';
import { LessonStage } from './components/LessonStage';
import { ActiveRoute, MenuPanel } from './components/MenuPanel';
import { MemoryInspector } from './components/MemoryInspector';
import { EngineStatusControl, OfflineToast, PWAInstallButton, PWAUpdatePrompt } from './components/PWAControls';
import { SettingsModal } from './components/SettingsModal';

const CapstonesView = lazy(() => import('./components/CapstonesView').then((m) => ({ default: m.CapstonesView })));
const DoDontBoard = lazy(() => import('./components/DoDontBoard').then((m) => ({ default: m.DoDontBoard })));
const ExerciseBankView = lazy(() => import('./components/ExerciseBankView').then((m) => ({ default: m.ExerciseBankView })));
const GamesHubView = lazy(() => import('./components/GamesHubView').then((m) => ({ default: m.GamesHubView })));
const InputDetectiveGame = lazy(() => import('./components/InputDetectiveGame').then((m) => ({ default: m.InputDetectiveGame })));
const MethodExplorerView = lazy(() => import('./components/MethodExplorerView').then((m) => ({ default: m.MethodExplorerView })));
const NameCheckerView = lazy(() => import('./components/NameCheckerView').then((m) => ({ default: m.NameCheckerView })));
const NamePoliceGame = lazy(() => import('./components/NamePoliceGame').then((m) => ({ default: m.NamePoliceGame })));
const PrintPerfectGame = lazy(() => import('./components/PrintPerfectGame').then((m) => ({ default: m.PrintPerfectGame })));
const PrintStudioView = lazy(() => import('./components/PrintStudioView').then((m) => ({ default: m.PrintStudioView })));
const TeacherSummariesView = lazy(() => import('./components/TeacherSummariesView').then((m) => ({ default: m.TeacherSummariesView })));
const TrophyRoomView = lazy(() => import('./components/TrophyRoomView').then((m) => ({ default: m.TrophyRoomView })));
const TypeLabsView = lazy(() => import('./components/TypeLabsView').then((m) => ({ default: m.TypeLabsView })));
import { MODULE_A_LESSONS } from './data/moduleA';
import { MODULE_B_LESSONS } from './data/moduleB';
import { MODULE_C_LESSONS } from './data/moduleC';
import { MODULE_D1_LESSONS } from './data/moduleD1';
import { MODULE_D2_LESSONS } from './data/moduleD2';
import { MODULE_D3_LESSONS } from './data/moduleD3';
import { MODULE_D4_LESSONS } from './data/moduleD4';
import { MODULE_E_LESSONS } from './data/moduleE';
import { evaluateUnlockedBadges } from './data/stage8';
import { executePythonGenerator } from './engine/interpreter';
import { enableFullPythonMode, EngineMode } from './engine/pyodideBridge';
import { useSpeech } from './hooks/useSpeech';
import {
  AppearanceSettings,
  EngineStepYield,
  FriendlyError,
  PanelLayoutState,
  TraceStep,
  UserProgress,
} from './types/lab';
import { isTauriDesktop, openExternalUrl } from './utils/desktop';
import { loadProgressAsync, loadProgressSync, saveProgress } from './utils/storage';

type MobileTab = 'learn' | 'code' | 'output' | 'memory' | 'menu';

const ALL_LESSONS = [
  ...MODULE_A_LESSONS,
  ...MODULE_B_LESSONS,
  ...MODULE_C_LESSONS,
  ...MODULE_D1_LESSONS,
  ...MODULE_D2_LESSONS,
  ...MODULE_D3_LESSONS,
  ...MODULE_D4_LESSONS,
  ...MODULE_E_LESSONS,
];

function parseHashRoute(): ActiveRoute {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash === 'name-checker') return { view: 'name-checker' };
  if (hash === 'do-dont') return { view: 'do-dont' };
  if (hash === 'name-police') return { view: 'name-police' };
  if (hash === 'print-studio') return { view: 'print-studio' };
  if (hash === 'method-explorer') return { view: 'method-explorer' };
  if (hash === 'print-perfect') return { view: 'print-perfect' };
  if (hash === 'input-detective') return { view: 'input-detective' };
  if (hash === 'type-labs' || hash === 'conversion-matrix') return { view: 'type-labs', tab: 'conversion-matrix' };
  if (hash === 'operation-lab') return { view: 'type-labs', tab: 'operation-lab' };
  if (hash === 'mutability-lab') return { view: 'type-labs', tab: 'mutability-lab' };
  if (hash === 'type-chooser') return { view: 'type-labs', tab: 'type-chooser' };
  if (hash === 'games-hub' || hash === 'type-sorter') return { view: 'games-hub', game: 'type-sorter' };
  if (hash === 'method-match') return { view: 'games-hub', game: 'method-match' };
  if (hash === 'predict-duel') return { view: 'games-hub', game: 'predict-duel' };
  if (hash === 'bug-hunter') return { view: 'games-hub', game: 'bug-hunter' };
  if (hash === 'capstones') return { view: 'capstones' };
  if (hash === 'trophies') return { view: 'trophies' };
  if (hash === 'exercises') return { view: 'exercises' };
  if (hash.startsWith('exercises/')) {
    return { view: 'exercises', moduleId: hash.slice('exercises/'.length) };
  }
  if (hash === 'teach' || hash === 'summaries') return { view: 'teach' };
  if (hash.startsWith('teach/')) {
    return { view: 'teach', moduleId: hash.slice('teach/'.length) };
  }
  if (hash.startsWith('lesson/')) {
    const id = hash.slice('lesson/'.length);
    if (ALL_LESSONS.some((l) => l.id === id)) {
      return { view: 'lesson', lessonId: id };
    }
  }
  return { view: 'lesson', lessonId: ALL_LESSONS[0].id };
}

function routeToHash(route: ActiveRoute): string {
  if (route.view === 'lesson') return `#/lesson/${route.lessonId}`;
  if (route.view === 'type-labs') return `#/${route.tab ?? 'conversion-matrix'}`;
  if (route.view === 'games-hub') return `#/${route.game ?? 'type-sorter'}`;
  if (route.view === 'exercises') {
    return route.moduleId ? `#/exercises/${route.moduleId}` : '#/exercises';
  }
  if (route.view === 'teach') {
    return route.moduleId ? `#/teach/${route.moduleId}` : '#/teach';
  }
  return `#/${route.view}`;
}

export default function App() {
  const [progress, setProgress] = useState<UserProgress>(() => loadProgressSync());
  const [route, setRoute] = useState<ActiveRoute>(() => parseHashRoute());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('learn');
  const [engineMode, setEngineMode] = useState<EngineMode>('builtin');
  const isDesktop = isTauriDesktop();

  // Active lesson & code state
  const activeLesson = useMemo(() => {
    if (route.view === 'lesson') {
      return ALL_LESSONS.find((l) => l.id === route.lessonId) ?? ALL_LESSONS[0];
    }
    return ALL_LESSONS[0];
  }, [route]);

  const [code, setCode] = useState<string>(
    () => progress.savedCode[activeLesson.id] ?? activeLesson.starterCode
  );

  // Interpreter execution state
  const generatorRef = useRef<Generator<EngineStepYield, void, string | undefined> | null>(null);
  const [steps, setSteps] = useState<TraceStep[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [pendingInputPrompt, setPendingInputPrompt] = useState<string | null>(null);
  const [partialOutput, setPartialOutput] = useState('');
  const [execError, setExecError] = useState<FriendlyError | null>(null);

  const { speak, stop: stopSpeech } = useSpeech(progress.settings.readAloud);
  const touchStartX = useRef<number | null>(null);

  // Hydrate from IndexedDB asynchronously on mount
  useEffect(() => {
    loadProgressAsync().then((loaded) => {
      setProgress(loaded);
    });
  }, []);

  // In desktop mode, open external http/https links in the system's default browser
  useEffect(() => {
    if (!isDesktop) return;
    const handleExternalLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute('href') || '';
      if (/^https?:\/\//i.test(href)) {
        e.preventDefault();
        void openExternalUrl(href);
      }
    };
    document.addEventListener('click', handleExternalLinkClick);
    return () => document.removeEventListener('click', handleExternalLinkClick);
  }, [isDesktop]);

  // Persist progress and unlock any earned achievement badges automatically
  useEffect(() => {
    const nextBadges = evaluateUnlockedBadges(progress);
    if (nextBadges.length !== progress.badges.length) {
      setProgress((prev) => ({ ...prev, badges: evaluateUnlockedBadges(prev) }));
      return;
    }
    saveProgress(progress);
  }, [progress]);

  // Apply theme, text size, density, reduce-motion, and teaching-mode attributes on document root
  useEffect(() => {
    const root = document.documentElement;
    const { theme, textSize, density, reduceMotion, teachingMode } = progress.settings;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-text-size', textSize);
    root.setAttribute('data-density', density);
    root.setAttribute('data-reduce-motion', String(reduceMotion));
    root.setAttribute('data-teaching-mode', String(Boolean(teachingMode)));
    if (theme === 'dark' || theme === 'high-contrast') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [progress.settings]);

  // Sync hash routing
  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseHashRoute());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((next: ActiveRoute) => {
    setRoute(next);
    window.location.hash = routeToHash(next);
    setIsPlaying(false);
    stopSpeech();
    if (next.view === 'lesson') {
      setMobileTab('learn');
    } else {
      setMobileTab('learn');
    }
  }, [stopSpeech]);

  // Reset interpreter trace cleanly
  const resetTrace = useCallback(() => {
    generatorRef.current = null;
    setSteps([]);
    setCurrentStepIdx(-1);
    setIsPlaying(false);
    setIsFinished(false);
    setPendingInputPrompt(null);
    setPartialOutput('');
    setExecError(null);
    stopSpeech();
  }, [stopSpeech]);

  // When switching lessons, load saved code or starter code
  useEffect(() => {
    if (route.view === 'lesson') {
      const saved = progress.savedCode[activeLesson.id];
      setCode(saved ?? activeLesson.starterCode);
      resetTrace();
    }
  }, [activeLesson.id, route.view]);

  const handleCodeChange = useCallback(
    (nextCode: string) => {
      setCode(nextCode);
      // Reset trace when code is edited so next Play/Step reflects edits
      if (generatorRef.current || steps.length > 0 || execError) {
        resetTrace();
      }
      setProgress((prev) => ({
        ...prev,
        savedCode: {
          ...prev.savedCode,
          [activeLesson.id]: nextCode,
        },
      }));
    },
    [activeLesson.id, execError, resetTrace, steps.length]
  );

  // Advance the generator by one step (or resume with input)
  const advanceGeneratorOnce = useCallback(
    (inputToPass?: string): boolean => {
      if (!generatorRef.current) {
        generatorRef.current = executePythonGenerator(code);
        setSteps([]);
        setCurrentStepIdx(-1);
        setIsFinished(false);
        setExecError(null);
      }

      const res = generatorRef.current.next(inputToPass);
      if (res.done) {
        setIsPlaying(false);
        setIsFinished(true);
        return false;
      }

      const val = res.value;
      if (val.kind === 'step') {
        setSteps((prev) => {
          const next = [...prev, val.trace];
          setCurrentStepIdx(next.length - 1);
          return next;
        });
        setPartialOutput(val.trace.outputSoFar);
        if (progress.settings.readAloud) {
          speak(val.trace.narration);
        }
        return true;
      }

      if (val.kind === 'input') {
        setIsPlaying(false);
        setPendingInputPrompt(val.prompt);
        setPartialOutput(val.partialOutput);
        setProgress((p) => ({
          ...p,
          panelState: { ...p.panelState, bottomOpen: true },
        }));
        if (window.innerWidth < 768) {
          setMobileTab('output');
        }
        return false;
      }

      if (val.kind === 'error') {
        setIsPlaying(false);
        setIsFinished(true);
        setExecError(val.error);
        setPartialOutput(val.finalOutput);
        setProgress((p) => ({
          ...p,
          panelState: { ...p.panelState, bottomOpen: true },
        }));
        return false;
      }

      if (val.kind === 'done') {
        setIsPlaying(false);
        setIsFinished(true);
        setPartialOutput(val.finalOutput);
        return false;
      }

      return false;
    },
    [code, progress.settings.readAloud, speak]
  );

  const handleStepForward = useCallback(() => {
    if (pendingInputPrompt !== null) return;
    if (currentStepIdx + 1 < steps.length) {
      const nextIdx = currentStepIdx + 1;
      setCurrentStepIdx(nextIdx);
      if (progress.settings.readAloud && steps[nextIdx]) {
        speak(steps[nextIdx].narration);
      }
      return;
    }
    if (!isFinished) {
      advanceGeneratorOnce();
    }
  }, [advanceGeneratorOnce, currentStepIdx, isFinished, pendingInputPrompt, progress.settings.readAloud, speak, steps]);

  const handleStepBack = useCallback(() => {
    setIsPlaying(false);
    if (currentStepIdx > 0) {
      const prevIdx = currentStepIdx - 1;
      setCurrentStepIdx(prevIdx);
      if (progress.settings.readAloud && steps[prevIdx]) {
        speak(steps[prevIdx].narration);
      }
    }
  }, [currentStepIdx, progress.settings.readAloud, speak, steps]);

  const handlePlay = useCallback(() => {
    if (pendingInputPrompt !== null) return;
    if (isFinished && currentStepIdx >= steps.length - 1) {
      resetTrace();
      setTimeout(() => {
        setIsPlaying(true);
      }, 20);
      return;
    }
    setIsPlaying(true);
  }, [currentStepIdx, isFinished, pendingInputPrompt, resetTrace, steps.length]);

  // Playback timer
  useEffect(() => {
    if (!isPlaying || pendingInputPrompt !== null) return;
    const delayMs = Math.max(180, Math.round(750 / progress.settings.speed));
    const id = window.setTimeout(() => {
      if (currentStepIdx + 1 < steps.length) {
        const nextIdx = currentStepIdx + 1;
        setCurrentStepIdx(nextIdx);
        if (progress.settings.readAloud && steps[nextIdx]) {
          speak(steps[nextIdx].narration);
        }
      } else if (!isFinished) {
        advanceGeneratorOnce();
      } else {
        setIsPlaying(false);
      }
    }, delayMs);
    return () => window.clearTimeout(id);
  }, [
    advanceGeneratorOnce,
    currentStepIdx,
    isFinished,
    isPlaying,
    pendingInputPrompt,
    progress.settings.readAloud,
    progress.settings.speed,
    speak,
    steps,
  ]);

  const handleSubmitInput = (val: string) => {
    setPendingInputPrompt(null);
    const keepGoing = advanceGeneratorOnce(val);
    if (keepGoing) {
      setIsPlaying(true);
    }
  };

  const handleRunCustomSnippet = (snippet: string) => {
    navigate({ view: 'lesson', lessonId: activeLesson.id });
    setCode(snippet);
    resetTrace();
    setTimeout(() => {
      setIsPlaying(true);
    }, 30);
  };

  const updateSettings = (patch: Partial<AppearanceSettings>) => {
    setProgress((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...patch },
    }));
  };

  const updatePanelState = useCallback((patch: Partial<PanelLayoutState>) => {
    setProgress((prev) => ({
      ...prev,
      panelState: { ...prev.panelState, ...patch },
    }));
  }, []);

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen?.();
        setIsFullscreen(false);
      }
    } catch {
      // Ignore iframe fullscreen restrictions
    }
  };

  const handleEnablePyodide = async () => {
    setEngineMode('loading-pyodide');
    try {
      await enableFullPythonMode();
      setEngineMode('pyodide-ready');
    } catch {
      setEngineMode('builtin');
    }
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inEditorOrInput =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        Boolean(target?.closest('.cm-editor'));

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        updatePanelState({ leftOpen: !progress.panelState.leftOpen, focusMode: false });
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        updatePanelState({ rightOpen: !progress.panelState.rightOpen, focusMode: false });
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        updatePanelState({ bottomOpen: !progress.panelState.bottomOpen, focusMode: false });
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handlePlay();
        return;
      }

      if (inEditorOrInput) return;

      if (e.key === ' ') {
        e.preventDefault();
        if (isPlaying) setIsPlaying(false);
        else handlePlay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleStepForward();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleStepBack();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        updatePanelState({ focusMode: !progress.panelState.focusMode });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    handlePlay,
    handleStepBack,
    handleStepForward,
    isPlaying,
    progress.panelState.bottomOpen,
    progress.panelState.focusMode,
    progress.panelState.leftOpen,
    progress.panelState.rightOpen,
    updatePanelState,
  ]);

  const currentStep = currentStepIdx >= 0 && currentStepIdx < steps.length ? steps[currentStepIdx] : null;
  const consoleOutput = currentStep ? currentStep.outputSoFar : partialOutput;
  const consoleStderr = useMemo(
    () =>
      steps
        .slice(0, currentStepIdx + 1)
        .map((s) => s.stderrDelta ?? '')
        .join(''),
    [steps, currentStepIdx]
  );
  const { leftOpen, rightOpen, bottomOpen, bottomHeight, focusMode } = progress.panelState;

  const markLessonCompleted = () => {
    setProgress((prev) => {
      if (prev.completedLessons.includes(activeLesson.id)) return prev;
      return {
        ...prev,
        xp: prev.xp + 25,
        completedLessons: [...prev.completedLessons, activeLesson.id],
      };
    });
  };

  const awardPredictXP = () => {
    setProgress((prev) => ({ ...prev, xp: prev.xp + 15 }));
  };

  // Phone swipe between bottom tabs
  const TAB_ORDER: MobileTab[] = ['learn', 'code', 'output', 'memory', 'menu'];
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.cm-editor')) return;
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 70) return;
    const idx = TAB_ORDER.indexOf(mobileTab);
    if (dx < 0 && idx < TAB_ORDER.length - 1) setMobileTab(TAB_ORDER[idx + 1]);
    if (dx > 0 && idx > 0) setMobileTab(TAB_ORDER[idx - 1]);
  };

  return (
    <div
      className="w-screen h-[100dvh] flex flex-col overflow-hidden safe-area-pad bg-[var(--bg-canvas)] text-[var(--text-primary)]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Bar (Strict 3-zone single row) */}
      {!focusMode && (
        <header className="h-12 px-4 sm:px-6 border-b border-[var(--border-hairline)] bg-[var(--bg-surface)] flex items-center justify-between gap-8 shrink-0">
          {/* Zone 1: Brand Title */}
          <a
            href="#/lesson/a1-what-is-a-variable"
            onClick={(e) => {
              e.preventDefault();
              navigate({ view: 'lesson', lessonId: activeLesson.id });
            }}
            className="text-base sm:text-lg font-bold font-display tracking-tight text-[var(--text-primary)] whitespace-nowrap shrink-0"
          >
            Python Data Types Lab
          </a>

          {/* Zone 2: Concise Navigation Links */}
          <nav aria-label="Primary sections" className="hidden md:flex items-center gap-4 lg:gap-6 text-xs sm:text-sm font-medium text-[var(--text-secondary)]">
            <button
              type="button"
              onClick={() => navigate({ view: 'lesson', lessonId: activeLesson.id })}
              className={`hover:text-[var(--text-primary)] transition-colors whitespace-nowrap shrink-0 ${
                route.view === 'lesson' ? 'text-[var(--accent-primary)] font-semibold underline underline-offset-4' : ''
              }`}
            >
              Theatre
            </button>
            <button
              type="button"
              onClick={() => navigate({ view: 'method-explorer' })}
              className={`hover:text-[var(--text-primary)] transition-colors whitespace-nowrap shrink-0 ${
                route.view === 'method-explorer' ? 'text-[var(--accent-primary)] font-semibold underline underline-offset-4' : ''
              }`}
            >
              Methods
            </button>
            <button
              type="button"
              onClick={() => navigate({ view: 'type-labs', tab: 'conversion-matrix' })}
              className={`hover:text-[var(--text-primary)] transition-colors whitespace-nowrap shrink-0 ${
                route.view === 'type-labs' ? 'text-[var(--accent-primary)] font-semibold underline underline-offset-4' : ''
              }`}
            >
              Type Labs
            </button>
            <button
              type="button"
              onClick={() => navigate({ view: 'games-hub', game: 'type-sorter' })}
              className={`hover:text-[var(--text-primary)] transition-colors whitespace-nowrap shrink-0 ${
                route.view === 'games-hub' ? 'text-[var(--accent-primary)] font-semibold underline underline-offset-4' : ''
              }`}
            >
              Games
            </button>
            <button
              type="button"
              onClick={() => navigate({ view: 'exercises', moduleId: activeLesson.moduleId })}
              className={`hover:text-[var(--text-primary)] transition-colors whitespace-nowrap shrink-0 ${
                route.view === 'exercises' ? 'text-[var(--accent-primary)] font-semibold underline underline-offset-4' : ''
              }`}
            >
              Practice
            </button>
            <button
              type="button"
              onClick={() => navigate({ view: 'teach', moduleId: activeLesson.moduleId })}
              className={`hover:text-[var(--text-primary)] transition-colors whitespace-nowrap shrink-0 ${
                route.view === 'teach' ? 'text-[var(--accent-primary)] font-semibold underline underline-offset-4' : ''
              }`}
            >
              Teach
            </button>
          </nav>

          {/* Zone 3: Single Primary Action (+ mobile Install shortcut) */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="md:hidden">
              <PWAInstallButton compact />
            </div>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="Open appearance settings"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] text-[var(--accent-primary-text)] text-xs font-semibold hover:bg-[var(--accent-primary-hover)] transition-colors whitespace-nowrap shrink-0"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
          </div>
        </header>
      )}

      {/* Workspace Dock & Status Toolbar (Desktop & Tablet) */}
      {!focusMode && (
        <div className="no-print hidden md:flex items-center justify-between gap-4 px-4 py-1.5 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => updatePanelState({ leftOpen: !leftOpen })}
              aria-pressed={leftOpen}
              title="Toggle Menu Panel (Ctrl+B)"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                leftOpen
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-hairline)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]'
              }`}
            >
              <PanelLeft className="w-3.5 h-3.5" />
              <span>Menu</span>
            </button>

            <button
              type="button"
              onClick={() => updatePanelState({ rightOpen: !rightOpen })}
              aria-pressed={rightOpen}
              title="Toggle Memory Inspector (Ctrl+I)"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                rightOpen
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-hairline)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]'
              }`}
            >
              <PanelRight className="w-3.5 h-3.5" />
              <span>Memory</span>
            </button>

            <button
              type="button"
              onClick={() => updatePanelState({ bottomOpen: !bottomOpen })}
              aria-pressed={bottomOpen}
              title="Toggle Console Panel (Ctrl+J)"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                bottomOpen
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-hairline)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]'
              }`}
            >
              <PanelBottom className="w-3.5 h-3.5" />
              <span>Console</span>
            </button>

            <button
              type="button"
              onClick={() => updatePanelState({ focusMode: true })}
              title="Focus Mode (F)"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] whitespace-nowrap"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Focus</span>
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] whitespace-nowrap"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <EngineStatusControl engineMode={engineMode} onEnablePyodide={handleEnablePyodide} />
            <PWAInstallButton />
          </div>
        </div>
      )}

      {/* Floating Exit Focus Mode Control */}
      {focusMode && (
        <div className="fixed top-3 right-3 z-50 flex items-center gap-2">
          <button
            type="button"
            onClick={() => updatePanelState({ focusMode: false })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-xs font-semibold text-[var(--text-primary)] shadow-md hover:bg-[var(--bg-elevated)]"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Exit Focus Mode</span>
          </button>
        </div>
      )}

      {/* Main Workspace Grid (Desktop & Tablet) */}
      <div className="hidden md:flex flex-1 min-h-0 flex-col overflow-hidden">
        <div className="flex-1 min-h-0 flex relative overflow-hidden">
          {/* LEFT: Menu Panel (Docked on lg+, Overlay Drawer on md) */}
          {!focusMode && leftOpen && (
            <>
              <div
                className="lg:hidden fixed inset-0 z-30 bg-black/40"
                onClick={() => updatePanelState({ leftOpen: false })}
              />
              <aside
                aria-label="Curriculum menu"
                className="fixed lg:static inset-y-0 left-0 z-40 w-64 lg:w-64 xl:w-72 border-r border-[var(--border-hairline)] shrink-0 h-full shadow-xl lg:shadow-none"
              >
                <MenuPanel
                  route={route}
                  onNavigate={navigate}
                  progress={progress}
                  onImportProgress={(imported) => setProgress(imported)}
                  onClose={() => updatePanelState({ leftOpen: false })}
                />
              </aside>
            </>
          )}

          {/* CENTRE: Lesson Stage / Interactive Lab */}
          <main className="flex-1 min-w-0 min-h-0 overflow-hidden">
            {route.view === 'lesson' && (
              <LessonStage
                lesson={activeLesson}
                code={code}
                onCodeChange={handleCodeChange}
                onResetCode={() => {
                  setCode(activeLesson.starterCode);
                  resetTrace();
                }}
                steps={steps}
                currentStepIdx={currentStepIdx}
                isPlaying={isPlaying}
                isPausedForInput={pendingInputPrompt !== null}
                pendingInputPrompt={pendingInputPrompt}
                speed={progress.settings.speed}
                reduceMotion={progress.settings.reduceMotion}
                readAloud={progress.settings.readAloud}
                onPlay={handlePlay}
                onPause={() => setIsPlaying(false)}
                onStepForward={handleStepForward}
                onStepBack={handleStepBack}
                onRestart={resetTrace}
                onSpeedChange={(sp) => updateSettings({ speed: sp })}
                onSpeakText={(txt) => speak(txt)}
                onRunSnippet={handleRunCustomSnippet}
                onSubmitInput={handleSubmitInput}
                isCompleted={progress.completedLessons.includes(activeLesson.id)}
                onMarkCompleted={markLessonCompleted}
                onPredictSuccess={awardPredictXP}
              />
            )}
            {route.view !== 'lesson' && (
              <Suspense
                fallback={
                  <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
                    Loading workspace…
                  </div>
                }
              >
                {route.view === 'name-checker' && (
              <NameCheckerView onTryInTheatre={handleRunCustomSnippet} />
            )}
            {route.view === 'do-dont' && (
              <DoDontBoard onRunInTheatre={(snippet) => handleRunCustomSnippet(snippet)} />
            )}
            {route.view === 'print-studio' && (
              <PrintStudioView onRunInTheatre={handleRunCustomSnippet} />
            )}
            {route.view === 'method-explorer' && (
              <MethodExplorerView onRunInTheatre={handleRunCustomSnippet} />
            )}
            {route.view === 'type-labs' && (
              <TypeLabsView
                initialTab={route.tab}
                onRunInTheatre={handleRunCustomSnippet}
                onAwardXP={(xp) =>
                  setProgress((prev) => ({
                    ...prev,
                    xp: prev.xp + xp,
                  }))
                }
              />
            )}
            {route.view === 'name-police' && (
              <NamePoliceGame
                bestScore={progress.gameHighScores['name-police'] ?? 0}
                onScoreUpdate={(sc, xp) =>
                  setProgress((prev) => ({
                    ...prev,
                    xp: prev.xp + xp,
                    gameHighScores: {
                      ...prev.gameHighScores,
                      'name-police': Math.max(prev.gameHighScores['name-police'] ?? 0, sc),
                    },
                  }))
                }
              />
            )}
            {route.view === 'print-perfect' && (
              <PrintPerfectGame
                bestScore={progress.gameHighScores['print-perfect'] ?? 0}
                onScoreUpdate={(sc, xp) =>
                  setProgress((prev) => ({
                    ...prev,
                    xp: prev.xp + xp,
                    gameHighScores: {
                      ...prev.gameHighScores,
                      'print-perfect': Math.max(prev.gameHighScores['print-perfect'] ?? 0, sc),
                    },
                  }))
                }
              />
            )}
            {route.view === 'input-detective' && (
              <InputDetectiveGame
                bestScore={progress.gameHighScores['input-detective'] ?? 0}
                onRunInTheatre={handleRunCustomSnippet}
                onScoreUpdate={(sc, xp) =>
                  setProgress((prev) => ({
                    ...prev,
                    xp: prev.xp + xp,
                    gameHighScores: {
                      ...prev.gameHighScores,
                      'input-detective': Math.max(prev.gameHighScores['input-detective'] ?? 0, sc),
                    },
                  }))
                }
              />
            )}
            {route.view === 'games-hub' && (
              <GamesHubView
                initialGame={route.game}
                highScores={progress.gameHighScores}
                onRunInTheatre={handleRunCustomSnippet}
                onScoreUpdate={(gameId, sc, xp) =>
                  setProgress((prev) => ({
                    ...prev,
                    xp: prev.xp + xp,
                    gameHighScores: {
                      ...prev.gameHighScores,
                      [gameId]: Math.max(prev.gameHighScores[gameId] ?? 0, sc),
                    },
                  }))
                }
              />
            )}
            {route.view === 'capstones' && (
              <CapstonesView
                completedIds={progress.completedLessons}
                onRunInTheatre={handleRunCustomSnippet}
                onCompleteCapstone={(capId) =>
                  setProgress((prev) => {
                    if (prev.completedLessons.includes(capId)) return prev;
                    return {
                      ...prev,
                      xp: prev.xp + 50,
                      completedLessons: [...prev.completedLessons, capId],
                    };
                  })
                }
              />
            )}
            {route.view === 'trophies' && <TrophyRoomView progress={progress} />}
            {route.view === 'exercises' && (
              <ExerciseBankView
                initialModuleId={route.moduleId}
                teachingMode={Boolean(progress.settings.teachingMode)}
                onRunInTheatre={handleRunCustomSnippet}
                onAwardXP={(xp) =>
                  setProgress((prev) => ({
                    ...prev,
                    xp: prev.xp + xp,
                  }))
                }
                onOpenSummary={(moduleId) => navigate({ view: 'teach', moduleId })}
              />
            )}
            {route.view === 'teach' && (
              <TeacherSummariesView
                initialModuleId={route.moduleId}
                teachingMode={Boolean(progress.settings.teachingMode)}
                onToggleTeachingMode={(enabled) => updateSettings({ teachingMode: enabled })}
                onRunInTheatre={handleRunCustomSnippet}
                onOpenExercises={(moduleId) => navigate({ view: 'exercises', moduleId })}
              />
            )}
              </Suspense>
            )}
          </main>

          {/* RIGHT: Memory Inspector (Docked on lg+, Overlay Drawer on md) */}
          {!focusMode && rightOpen && (
            <>
              <div
                className="lg:hidden fixed inset-0 z-30 bg-black/40"
                onClick={() => updatePanelState({ rightOpen: false })}
              />
              <aside
                aria-label="Memory inspector"
                className="fixed lg:static inset-y-0 right-0 z-40 w-72 xl:w-80 border-l border-[var(--border-hairline)] shrink-0 h-full shadow-xl lg:shadow-none"
              >
                <MemoryInspector
                  currentStep={currentStep}
                  reduceMotion={progress.settings.reduceMotion}
                  onClose={() => updatePanelState({ rightOpen: false })}
                />
              </aside>
            </>
          )}
        </div>

        {/* BOTTOM: Resizable Console Panel */}
        {!focusMode && (
          <ConsolePanel
            output={consoleOutput}
            stderr={consoleStderr}
            error={execError}
            pendingInputPrompt={pendingInputPrompt}
            onSubmitInput={handleSubmitInput}
            onClear={resetTrace}
            isOpen={bottomOpen}
            onToggleOpen={() => updatePanelState({ bottomOpen: !bottomOpen })}
            height={bottomHeight}
            onResizeHeight={(h) => updatePanelState({ bottomHeight: h })}
          />
        )}
      </div>

      {/* Mobile Single-Column Layout (< 768px) */}
      <div className="flex md:hidden flex-1 min-h-0 flex-col overflow-hidden">
        <div className="flex-1 min-h-0 overflow-hidden">
          {(mobileTab === 'learn' || mobileTab === 'code') && (
            <>
              {route.view === 'lesson' && (
                <LessonStage
                  lesson={activeLesson}
                  code={code}
                  onCodeChange={handleCodeChange}
                  onResetCode={() => {
                    setCode(activeLesson.starterCode);
                    resetTrace();
                  }}
                  steps={steps}
                  currentStepIdx={currentStepIdx}
                  isPlaying={isPlaying}
                  isPausedForInput={pendingInputPrompt !== null}
                  pendingInputPrompt={pendingInputPrompt}
                  speed={progress.settings.speed}
                  reduceMotion={progress.settings.reduceMotion}
                  readAloud={progress.settings.readAloud}
                  onPlay={handlePlay}
                  onPause={() => setIsPlaying(false)}
                  onStepForward={handleStepForward}
                  onStepBack={handleStepBack}
                  onRestart={resetTrace}
                  onSpeedChange={(sp) => updateSettings({ speed: sp })}
                  onSpeakText={(txt) => speak(txt)}
                  onRunSnippet={handleRunCustomSnippet}
                  onSubmitInput={handleSubmitInput}
                  isCompleted={progress.completedLessons.includes(activeLesson.id)}
                  onMarkCompleted={markLessonCompleted}
                  onPredictSuccess={awardPredictXP}
                  mobileSubView={mobileTab === 'code' ? 'code' : 'learn'}
                />
              )}
              {route.view !== 'lesson' && (
                <Suspense
                  fallback={
                    <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
                      Loading workspace…
                    </div>
                  }
                >
                  {route.view === 'name-checker' && (
                <NameCheckerView onTryInTheatre={handleRunCustomSnippet} />
              )}
              {route.view === 'do-dont' && (
                <DoDontBoard onRunInTheatre={(snippet) => handleRunCustomSnippet(snippet)} />
              )}
              {route.view === 'print-studio' && (
                <PrintStudioView onRunInTheatre={handleRunCustomSnippet} />
              )}
              {route.view === 'method-explorer' && (
                <MethodExplorerView onRunInTheatre={handleRunCustomSnippet} />
              )}
              {route.view === 'type-labs' && (
                <TypeLabsView
                  initialTab={route.tab}
                  onRunInTheatre={handleRunCustomSnippet}
                  onAwardXP={(xp) =>
                    setProgress((prev) => ({
                      ...prev,
                      xp: prev.xp + xp,
                    }))
                  }
                />
              )}
              {route.view === 'name-police' && (
                <NamePoliceGame
                  bestScore={progress.gameHighScores['name-police'] ?? 0}
                  onScoreUpdate={(sc, xp) =>
                    setProgress((prev) => ({
                      ...prev,
                      xp: prev.xp + xp,
                      gameHighScores: {
                        ...prev.gameHighScores,
                        'name-police': Math.max(prev.gameHighScores['name-police'] ?? 0, sc),
                      },
                    }))
                  }
                />
              )}
              {route.view === 'print-perfect' && (
                <PrintPerfectGame
                  bestScore={progress.gameHighScores['print-perfect'] ?? 0}
                  onScoreUpdate={(sc, xp) =>
                    setProgress((prev) => ({
                      ...prev,
                      xp: prev.xp + xp,
                      gameHighScores: {
                        ...prev.gameHighScores,
                        'print-perfect': Math.max(prev.gameHighScores['print-perfect'] ?? 0, sc),
                      },
                    }))
                  }
                />
              )}
              {route.view === 'input-detective' && (
                <InputDetectiveGame
                  bestScore={progress.gameHighScores['input-detective'] ?? 0}
                  onRunInTheatre={handleRunCustomSnippet}
                  onScoreUpdate={(sc, xp) =>
                    setProgress((prev) => ({
                      ...prev,
                      xp: prev.xp + xp,
                      gameHighScores: {
                        ...prev.gameHighScores,
                        'input-detective': Math.max(prev.gameHighScores['input-detective'] ?? 0, sc),
                      },
                    }))
                  }
                />
              )}
              {route.view === 'games-hub' && (
                <GamesHubView
                  initialGame={route.game}
                  highScores={progress.gameHighScores}
                  onRunInTheatre={handleRunCustomSnippet}
                  onScoreUpdate={(gameId, sc, xp) =>
                    setProgress((prev) => ({
                      ...prev,
                      xp: prev.xp + xp,
                      gameHighScores: {
                        ...prev.gameHighScores,
                        [gameId]: Math.max(prev.gameHighScores[gameId] ?? 0, sc),
                      },
                    }))
                  }
                />
              )}
              {route.view === 'capstones' && (
                <CapstonesView
                  completedIds={progress.completedLessons}
                  onRunInTheatre={handleRunCustomSnippet}
                  onCompleteCapstone={(capId) =>
                    setProgress((prev) => {
                      if (prev.completedLessons.includes(capId)) return prev;
                      return {
                        ...prev,
                        xp: prev.xp + 50,
                        completedLessons: [...prev.completedLessons, capId],
                      };
                    })
                  }
                />
              )}
              {route.view === 'trophies' && <TrophyRoomView progress={progress} />}
              {route.view === 'exercises' && (
                <ExerciseBankView
                  initialModuleId={route.moduleId}
                  teachingMode={Boolean(progress.settings.teachingMode)}
                  onRunInTheatre={handleRunCustomSnippet}
                  onAwardXP={(xp) =>
                    setProgress((prev) => ({
                      ...prev,
                      xp: prev.xp + xp,
                    }))
                  }
                  onOpenSummary={(moduleId) => navigate({ view: 'teach', moduleId })}
                />
              )}
              {route.view === 'teach' && (
                <TeacherSummariesView
                  initialModuleId={route.moduleId}
                  teachingMode={Boolean(progress.settings.teachingMode)}
                  onToggleTeachingMode={(enabled) => updateSettings({ teachingMode: enabled })}
                  onRunInTheatre={handleRunCustomSnippet}
                  onOpenExercises={(moduleId) => navigate({ view: 'exercises', moduleId })}
                />
              )}
                </Suspense>
              )}
            </>
          )}

          {mobileTab === 'output' && (
            <ConsolePanel
              output={consoleOutput}
              stderr={consoleStderr}
              error={execError}
              pendingInputPrompt={pendingInputPrompt}
              onSubmitInput={handleSubmitInput}
              onClear={resetTrace}
              isOpen={true}
              onToggleOpen={() => {}}
              height={300}
              onResizeHeight={() => {}}
              isPhone={true}
            />
          )}

          {mobileTab === 'memory' && (
            <MemoryInspector
              currentStep={currentStep}
              reduceMotion={progress.settings.reduceMotion}
            />
          )}

          {mobileTab === 'menu' && (
            <MenuPanel
              route={route}
              onNavigate={(next) => {
                navigate(next);
                setMobileTab('learn');
              }}
              progress={progress}
              onImportProgress={(imported) => setProgress(imported)}
            />
          )}
        </div>

        {/* Phone Bottom Tab Bar (<= 15% viewport, min 44px touch targets) */}
        <nav
          aria-label="Mobile workspace tabs"
          className="no-print grid grid-cols-5 border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] shrink-0"
        >
          {(
            [
              { id: 'learn', label: 'Learn', icon: BookOpen },
              { id: 'code', label: 'Code', icon: Code2 },
              { id: 'output', label: 'Output', icon: Terminal },
              { id: 'memory', label: 'Memory', icon: Cpu },
              { id: 'menu', label: 'Menu', icon: MenuIcon },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = mobileTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMobileTab(tab.id)}
                className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium transition-colors ${
                  active
                    ? 'text-[var(--accent-primary)] font-bold bg-[var(--accent-soft)]/60'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={progress.settings}
        onUpdate={updateSettings}
      />

      {/* Calm Offline Notice & PWA Update Prompt */}
      <OfflineToast />
      {!isDesktop && <PWAUpdatePrompt />}
    </div>
  );
}
